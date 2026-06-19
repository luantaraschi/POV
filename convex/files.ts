import { mutation } from './_generated/server'
import { v } from 'convex/values'

// URL de upload de uso único (o cliente faz POST do arquivo e recebe um storageId)
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

// grava o avatar no jogador (storageId obtido após o upload)
export const saveAvatar = mutation({
  args: {
    code: v.string(),
    playerId: v.string(),
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query('rooms')
      .withIndex('by_code', (q) => q.eq('code', args.code))
      .unique()
    if (!room) throw new Error('Sala não encontrada')

    const me = await ctx.db
      .query('players')
      .withIndex('by_room_player', (q) =>
        q.eq('roomId', room._id).eq('playerId', args.playerId),
      )
      .unique()
    if (!me) throw new Error('Jogador não encontrado')

    await ctx.db.patch(me._id, { avatarStorageId: args.storageId })
    return { ok: true }
  },
})
