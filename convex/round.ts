import { mutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import { v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { CONNECTED_MS, drawTarget, now, scoreFor, shuffledOrder } from './lib'

// ---------- guess (ao vivo, ~8/s) ----------

export const updateGuess = mutation({
  args: { code: v.string(), playerId: v.string(), value: v.number() },
  handler: async (ctx, args) => {
    const room = await roomByCode(ctx, args.code)
    if (!room || room.status !== 'playing' || !room.round) return { ok: false }
    if (room.round.phase !== 'guessing') return { ok: false }

    const roundIndex = room.round.index
    const existing = await ctx.db
      .query('guesses')
      .withIndex('by_room_round_player', (q) =>
        q.eq('roomId', room._id).eq('roundIndex', roundIndex).eq('playerId', args.playerId),
      )
      .unique()

    if (existing) {
      // mover o dial te "des-pronta" (natural)
      await ctx.db.patch(existing._id, { value: args.value, locked: false })
    } else {
      await ctx.db.insert('guesses', {
        roomId: room._id,
        roundIndex,
        playerId: args.playerId,
        value: args.value,
        locked: false,
      })
    }

    return { ok: true }
  },
})

// ---------- lock (pronto) + auto-reveal ----------

export const lockGuess = mutation({
  args: { code: v.string(), playerId: v.string() },
  handler: async (ctx, args) => {
    const room = await roomByCode(ctx, args.code)
    if (!room || room.status !== 'playing' || !room.round) return { ok: false }
    if (room.round.phase !== 'guessing') return { ok: false }

    const roundIndex = room.round.index
    const existing = await ctx.db
      .query('guesses')
      .withIndex('by_room_round_player', (q) =>
        q.eq('roomId', room._id).eq('roundIndex', roundIndex).eq('playerId', args.playerId),
      )
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { locked: true })
    } else {
      // sem palpite ainda: cria travado no valor atual (default 50)
      await ctx.db.insert('guesses', {
        roomId: room._id,
        roundIndex,
        playerId: args.playerId,
        value: 50,
        locked: true,
      })
    }

    // ---- auto-reveal: todos os não-Donos CONECTADOS travaram? ----
    const ts = now()
    const players = await ctx.db
      .query('players')
      .withIndex('by_room', (q) => q.eq('roomId', room._id))
      .collect()

    const connectedGuessers = players.filter(
      (p) => p.playerId !== room.round!.donoPlayerId && ts - p.lastSeen < CONNECTED_MS,
    )

    if (connectedGuessers.length >= 1) {
      const guesses = await ctx.db
        .query('guesses')
        .withIndex('by_room_round', (q) =>
          q.eq('roomId', room._id).eq('roundIndex', roundIndex),
        )
        .collect()
      const lockedBy = new Set(guesses.filter((g) => g.locked).map((g) => g.playerId))
      const everyoneLocked = connectedGuessers.every((p) => lockedBy.has(p.playerId))
      if (everyoneLocked) {
        await revealRound(ctx, room._id)
      }
    }

    return { ok: true }
  },
})

// ---------- reveal (host força; auto-call usa a mesma lógica) ----------

export const reveal = mutation({
  args: { code: v.string(), playerId: v.string() },
  handler: async (ctx, args) => {
    const room = await roomByCode(ctx, args.code)
    if (!room || !room.round) return { ok: false }
    await revealRound(ctx, room._id)
    return { ok: true }
  },
})

// ---------- next round ----------

export const nextRound = mutation({
  args: { code: v.string(), playerId: v.string() },
  handler: async (ctx, args) => {
    const room = await roomByCode(ctx, args.code)
    if (!room) throw new Error('Sala não encontrada')
    if (!room.round) throw new Error('Sem rodada ativa')
    const isHost = args.playerId === room.hostPlayerId
    const isDono = args.playerId === room.round.donoPlayerId
    if (!isHost && !isDono) throw new Error('Só o host ou o Dono avança')

    const players = await playersByJoin(ctx, room._id)
    if (players.length === 0) throw new Error('Sem jogadores')

    const total = room.voltas * players.length
    const nextIndex = room.round.index + 1

    if (nextIndex >= total) {
      await ctx.db.patch(room._id, { status: 'ended', round: null })
      return { ok: true, ended: true }
    }

    // avança a carta (sem-repetição até esgotar o deck)
    let cardOrder = room.cardOrder
    let cardPos = room.cardPos + 1
    if (cardPos >= cardOrder.length) {
      const oldLast = cardOrder[cardOrder.length - 1]
      cardOrder = shuffledOrder(cardOrder.length)
      // evita que a carta recém-usada seja a primeira do novo baralho
      if (cardOrder.length > 1 && cardOrder[0] === oldLast) {
        ;[cardOrder[0], cardOrder[1]] = [cardOrder[1], cardOrder[0]]
      }
      cardPos = 0
    }
    const cardIndex = cardOrder[cardPos]
    const donoPlayerId = players[nextIndex % players.length].playerId

    await ctx.db.patch(room._id, {
      cardOrder,
      cardPos,
      round: {
        index: nextIndex,
        donoPlayerId,
        cardIndex,
        target: drawTarget(),
        phase: 'guessing',
      },
    })

    return { ok: true, ended: false }
  },
})

// ---------- reveal logic (compartilhada; GUARD score-once) ----------

async function revealRound(ctx: MutationCtx, roomId: Id<'rooms'>): Promise<void> {
  const room = await ctx.db.get(roomId)
  if (!room || !room.round) return
  // GUARD score-once: só pontua/revela se ainda em 'guessing'
  if (room.round.phase !== 'guessing') return

  const roundIndex = room.round.index
  const target = room.round.target
  const guesses = await ctx.db
    .query('guesses')
    .withIndex('by_room_round', (q) =>
      q.eq('roomId', roomId).eq('roundIndex', roundIndex),
    )
    .collect()

  let sum = 0
  for (const g of guesses) sum += scoreFor(g.value, target)

  await ctx.db.patch(roomId, {
    groupScore: room.groupScore + sum,
    round: { ...room.round, phase: 'reveal' },
  })
}

// ---------- helpers ----------

async function roomByCode(ctx: MutationCtx, code: string): Promise<Doc<'rooms'> | null> {
  return await ctx.db
    .query('rooms')
    .withIndex('by_code', (q) => q.eq('code', code))
    .unique()
}

async function playersByJoin(
  ctx: MutationCtx,
  roomId: Id<'rooms'>,
): Promise<Doc<'players'>[]> {
  const players = await ctx.db
    .query('players')
    .withIndex('by_room', (q) => q.eq('roomId', roomId))
    .collect()
  return players.sort((a, b) => a.joinedAt - b.joinedAt)
}
