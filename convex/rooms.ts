import { mutation, query } from './_generated/server'
import type { QueryCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { CONNECTED_MS, drawTarget, genCode, now, shuffledOrder } from './lib'

const profileValidator = v.object({
  name: v.string(),
  color: v.string(),
  avatarStorageId: v.union(v.null(), v.id('_storage')),
})

// ---------- mutations ----------

export const createRoom = mutation({
  args: {
    profile: profileValidator,
    deck: v.string(),
    voltas: v.union(v.literal(1), v.literal(2), v.literal(3)),
    deckSize: v.number(),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    // gera um code único (tenta novamente em colisão por by_code)
    let code = genCode()
    for (let i = 0; i < 16; i++) {
      const clash = await ctx.db
        .query('rooms')
        .withIndex('by_code', (q) => q.eq('code', code))
        .unique()
      if (!clash) break
      code = genCode()
    }

    const ts = now()
    const roomId = await ctx.db.insert('rooms', {
      code,
      hostPlayerId: args.playerId,
      status: 'lobby',
      deck: args.deck,
      voltas: args.voltas,
      cardOrder: shuffledOrder(args.deckSize),
      cardPos: 0,
      round: null,
      groupScore: 0,
      createdAt: ts,
    })

    await ctx.db.insert('players', {
      roomId,
      playerId: args.playerId,
      name: args.profile.name,
      color: args.profile.color,
      avatarStorageId: args.profile.avatarStorageId,
      lastSeen: ts,
      joinedAt: ts,
    })

    return { code }
  },
})

export const joinRoom = mutation({
  args: {
    code: v.string(),
    profile: profileValidator,
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique()
    if (!room) throw new Error('Sala não encontrada')
    if (room.status !== 'lobby') throw new Error('A partida já começou')

    const ts = now()
    const existing = await ctx.db
      .query('players')
      .withIndex('by_room_player', (q) =>
        q.eq('roomId', room._id).eq('playerId', args.playerId),
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.profile.name,
        color: args.profile.color,
        avatarStorageId: args.profile.avatarStorageId,
        lastSeen: ts,
      })
    } else {
      await ctx.db.insert('players', {
        roomId: room._id,
        playerId: args.playerId,
        name: args.profile.name,
        color: args.profile.color,
        avatarStorageId: args.profile.avatarStorageId,
        lastSeen: ts,
        joinedAt: ts,
      })
    }

    return { ok: true }
  },
})

export const startGame = mutation({
  args: { code: v.string(), playerId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique()
    if (!room) throw new Error('Sala não encontrada')
    if (args.playerId !== room.hostPlayerId) throw new Error('Só o host inicia')

    const players = await playersByJoin(ctx, room._id)
    if (players.length === 0) throw new Error('Sem jogadores')

    await ctx.db.patch(room._id, {
      status: 'playing',
      round: {
        index: 0,
        donoPlayerId: players[0].playerId,
        cardIndex: room.cardOrder[0],
        target: drawTarget(),
        phase: 'guessing',
      },
    })

    return { ok: true }
  },
})

export const heartbeat = mutation({
  args: { code: v.string(), playerId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique()
    if (!room) throw new Error('Sala não encontrada')

    const ts = now()
    const me = await ctx.db
      .query('players')
      .withIndex('by_room_player', (q) =>
        q.eq('roomId', room._id).eq('playerId', args.playerId),
      )
      .unique()
    if (me) await ctx.db.patch(me._id, { lastSeen: ts })

    // migração de host: se o host atual está obsoleto, promove o conectado mais antigo
    const host = await ctx.db
      .query('players')
      .withIndex('by_room_player', (q) =>
        q.eq('roomId', room._id).eq('playerId', room.hostPlayerId),
      )
      .unique()
    const hostStale = !host || ts - host.lastSeen > CONNECTED_MS
    if (hostStale) {
      const next = await oldestConnected(ctx, room._id, ts)
      if (next && next.playerId !== room.hostPlayerId) {
        await ctx.db.patch(room._id, { hostPlayerId: next.playerId })
      }
    }

    return { ok: true }
  },
})

export const leaveRoom = mutation({
  args: { code: v.string(), playerId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique()
    if (!room) return { ok: true }

    const me = await ctx.db
      .query('players')
      .withIndex('by_room_player', (q) =>
        q.eq('roomId', room._id).eq('playerId', args.playerId),
      )
      .unique()
    if (me) await ctx.db.delete(me._id)

    const remaining = await playersByJoin(ctx, room._id)

    if (remaining.length === 0) {
      // sem jogadores: apaga a sala e seus palpites
      const guesses = await ctx.db
        .query('guesses')
        .withIndex('by_room_round', (q) => q.eq('roomId', room._id))
        .collect()
      for (const g of guesses) await ctx.db.delete(g._id)
      await ctx.db.delete(room._id)
      return { ok: true }
    }

    // se o que saiu era o host, promove o conectado mais antigo (fallback: mais antigo)
    if (room.hostPlayerId === args.playerId) {
      const next =
        (await oldestConnected(ctx, room._id, now())) ?? remaining[0]
      await ctx.db.patch(room._id, { hostPlayerId: next.playerId })
    }

    return { ok: true }
  },
})

// ---------- query (determinística para STATE; Date.now() só p/ `connected` derivado) ----------

export const getRoomView = query({
  args: { code: v.string(), playerId: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique()
    if (!room) return null

    const ts = Date.now() // apenas para derivar `connected` (display); não afeta STATE
    const playersRaw = await playersByJoin(ctx, room._id)
    const players = playersRaw.map((p) => ({
      playerId: p.playerId,
      name: p.name,
      color: p.color,
      avatarStorageId: p.avatarStorageId,
      connected: ts - p.lastSeen < CONNECTED_MS,
    }))

    // palpites da rodada atual
    let guesses: { playerId: string; value: number; locked: boolean }[] = []
    if (room.round) {
      const roundIndex = room.round.index
      const raw = await ctx.db
        .query('guesses')
        .withIndex('by_room_round', (q) =>
          q.eq('roomId', room._id).eq('roundIndex', roundIndex),
        )
        .collect()
      guesses = raw.map((g) => ({
        playerId: g.playerId,
        value: g.value,
        locked: g.locked,
      }))
    }

    // GATING DO ALVO (requisito de segurança):
    // o alvo real só é revelado se o solicitante é o Dono OU a fase é 'reveal'.
    // Caso contrário, target = null (nunca chega o segredo ao cliente).
    let round: {
      index: number
      donoPlayerId: string
      cardIndex: number
      phase: 'guessing' | 'reveal'
      target: number | null
    } | null = null
    if (room.round) {
      const canSeeTarget =
        args.playerId === room.round.donoPlayerId ||
        room.round.phase === 'reveal'
      round = {
        index: room.round.index,
        donoPlayerId: room.round.donoPlayerId,
        cardIndex: room.round.cardIndex,
        phase: room.round.phase,
        target: canSeeTarget ? room.round.target : null,
      }
    }

    const me = players.find((p) => p.playerId === args.playerId) ?? null

    return {
      room: {
        code: room.code,
        hostPlayerId: room.hostPlayerId,
        status: room.status,
        deck: room.deck,
        voltas: room.voltas,
        cardOrder: room.cardOrder,
        cardPos: room.cardPos,
        groupScore: room.groupScore,
        createdAt: room.createdAt,
        round,
      },
      players,
      guesses,
      me,
    }
  },
})

// ---------- helpers (ctx) ----------

async function playersByJoin(
  ctx: QueryCtx,
  roomId: Id<'rooms'>,
): Promise<Doc<'players'>[]> {
  const players = await ctx.db
    .query('players')
    .withIndex('by_room', (q) => q.eq('roomId', roomId))
    .collect()
  return players.sort((a, b) => a.joinedAt - b.joinedAt)
}

async function oldestConnected(
  ctx: QueryCtx,
  roomId: Id<'rooms'>,
  ts: number,
): Promise<Doc<'players'> | null> {
  const players = await playersByJoin(ctx, roomId)
  for (const p of players) {
    if (ts - p.lastSeen < CONNECTED_MS) return p
  }
  return null
}
