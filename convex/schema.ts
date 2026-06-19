import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  rooms: defineTable({
    code: v.string(),                       // ex. "7Q2K"
    hostPlayerId: v.string(),
    status: v.union(v.literal('lobby'), v.literal('playing'), v.literal('ended')),
    deck: v.string(),                       // DeckId (o cliente mapeia p/ as cartas)
    voltas: v.union(v.literal(1), v.literal(2), v.literal(3)),
    cardOrder: v.array(v.number()),         // índices embaralhados (sem-repetição)
    cardPos: v.number(),
    round: v.union(v.null(), v.object({
      index: v.number(),
      donoPlayerId: v.string(),
      cardIndex: v.number(),
      target: v.number(),                   // SEGREDO — só exposto ao Dono ou no reveal (na query)
      phase: v.union(v.literal('guessing'), v.literal('reveal')),
    })),
    groupScore: v.number(),
    createdAt: v.number(),
  }).index('by_code', ['code']),

  players: defineTable({
    roomId: v.id('rooms'),
    playerId: v.string(),
    name: v.string(),
    color: v.string(),
    avatarStorageId: v.union(v.null(), v.id('_storage')),
    lastSeen: v.number(),
    joinedAt: v.number(),
  }).index('by_room', ['roomId']).index('by_room_player', ['roomId', 'playerId']),

  guesses: defineTable({
    roomId: v.id('rooms'),
    roundIndex: v.number(),
    playerId: v.string(),
    value: v.number(),                      // 0..100 (atualizado ao vivo)
    locked: v.boolean(),
  }).index('by_room_round', ['roomId', 'roundIndex']).index('by_room_round_player', ['roomId', 'roundIndex', 'playerId']),
})
