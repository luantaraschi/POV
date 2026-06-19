// Conexão reativa com uma sala Convex.
//
// Padrão convex-svelte (v0.14):
//  - `useQuery(query, () => args | 'skip')` é REATIVO e precisa de contexto de
//    componente (usa Svelte context + $effect internamente). Logo, esta
//    composable DEVE ser chamada de dentro do <script> de um componente
//    (ex.: a tela online), não de um módulo top-level.
//  - `useMutation`/`useAction` usam o singleton de módulo (`getConvexClient`),
//    então funcionam em qualquer lugar após `setupConvex()`. Ainda assim os
//    criamos aqui para co-localizar a API da sala.
//  - O heartbeat usa `$effect` (com cleanup) — também exige contexto de
//    componente. Por isso o arquivo é `.svelte.ts` e a função é "composable".
import { useQuery, useMutation } from 'convex-svelte'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { getPlayerId, type Profile } from './identity'

// O backend tipa avatarStorageId como Id<'_storage'> (string "marcada").
// Profile (TS puro, sem tipos Convex) usa string simples — convertemos aqui no limite.
function toConvexProfile(p: Profile) {
  return {
    name: p.name,
    color: p.color,
    avatarStorageId: (p.avatarStorageId as Id<'_storage'> | null) ?? null,
  }
}

const HEARTBEAT_MS = 8000
const GUESS_THROTTLE_MS = 125 // ~8 chamadas/seg enquanto arrasta o dial

// ---- formas derivadas da query getRoomView (mantidas em sincronia com convex/rooms.ts) ----

export type RoomView = NonNullable<
  ReturnType<typeof useQuery<typeof api.rooms.getRoomView>>['data']
>
export type RoomPlayer = RoomView extends { players: (infer P)[] } ? P : never
export type RoomGuess = RoomView extends { guesses: (infer G)[] } ? G : never

/**
 * Cria a conexão reativa de uma sala. CHAME DENTRO DO <script> DE UM COMPONENTE.
 *
 * @param getCode getter reativo do código da sala (null/'' => query em 'skip')
 */
export function createRoomConnection(getCode: () => string | null) {
  const playerId = getPlayerId()

  // --- query reativa (re-subscreve quando o code muda; 'skip' quando sem code) ---
  const q = useQuery(api.rooms.getRoomView, () => {
    const code = getCode()
    return code ? { code, playerId } : 'skip'
  })

  // --- mutations / actions ---
  const mCreateRoom = useMutation(api.rooms.createRoom)
  const mJoinRoom = useMutation(api.rooms.joinRoom)
  const mStartGame = useMutation(api.rooms.startGame)
  const mHeartbeat = useMutation(api.rooms.heartbeat)
  const mLeaveRoom = useMutation(api.rooms.leaveRoom)
  const mUpdateGuess = useMutation(api.round.updateGuess)
  const mLockGuess = useMutation(api.round.lockGuess)
  const mReveal = useMutation(api.round.reveal)
  const mNextRound = useMutation(api.round.nextRound)
  const mRestartGame = useMutation(api.round.restartGame)
  const mGenerateUploadUrl = useMutation(api.files.generateUploadUrl)
  const mSaveAvatar = useMutation(api.files.saveAvatar)

  // ---------- helpers derivados ----------
  const view = $derived(q.data ?? null)
  const room = $derived(view?.room ?? null)
  const players = $derived(view?.players ?? [])
  const guesses = $derived(view?.guesses ?? [])
  const me = $derived(view?.me ?? null)

  const isHost = $derived(!!room && room.hostPlayerId === playerId)
  const isDono = $derived(!!room?.round && room.round.donoPlayerId === playerId)

  const connectedPlayers = $derived(players.filter((p) => p.connected))

  const myGuess = $derived(
    guesses.find((g) => g.playerId === playerId) ?? null,
  )

  // Palpitadores = jogadores conectados que NÃO são o Dono da rodada.
  const guesserCount = $derived(
    room?.round
      ? connectedPlayers.filter(
          (p) => p.playerId !== room!.round!.donoPlayerId,
        ).length
      : 0,
  )
  const lockedCount = $derived(
    room?.round
      ? guesses.filter(
          (g) =>
            g.locked &&
            g.playerId !== room!.round!.donoPlayerId &&
            connectedPlayers.some((p) => p.playerId === g.playerId),
        ).length
      : 0,
  )

  // ---------- heartbeat (enquanto numa sala existente) ----------
  $effect(() => {
    const code = getCode()
    // só pulsa quando temos um code E a sala existe (room != null)
    if (!code || !room) return
    // dispara imediatamente e depois a cada HEARTBEAT_MS
    void mHeartbeat({ code, playerId }).catch(() => {})
    const id = setInterval(() => {
      void mHeartbeat({ code, playerId }).catch(() => {})
    }, HEARTBEAT_MS)
    return () => clearInterval(id)
  })

  // ---------- updateGuess THROTTLED (~8/s, com trailing edge) ----------
  let lastSent = 0
  let pendingValue: number | null = null
  let trailingTimer: ReturnType<typeof setTimeout> | null = null

  function flushGuess(code: string, value: number) {
    lastSent = Date.now()
    pendingValue = null
    void mUpdateGuess({ code, playerId, value }).catch(() => {})
  }

  function updateGuess(value: number) {
    const code = getCode()
    if (!code) return
    const elapsed = Date.now() - lastSent
    if (elapsed >= GUESS_THROTTLE_MS) {
      if (trailingTimer) {
        clearTimeout(trailingTimer)
        trailingTimer = null
      }
      flushGuess(code, value)
    } else {
      // agenda o último valor para o fim da janela (trailing edge)
      pendingValue = value
      if (!trailingTimer) {
        trailingTimer = setTimeout(() => {
          trailingTimer = null
          if (pendingValue !== null) flushGuess(code, pendingValue)
        }, GUESS_THROTTLE_MS - elapsed)
      }
    }
  }

  // limpa timer do throttle ao desmontar
  $effect(() => {
    return () => {
      if (trailingTimer) clearTimeout(trailingTimer)
    }
  })

  // ---------- API de chamadas (wrappers tipados com o code atual) ----------
  async function createRoom(args: {
    profile: Profile
    deck: string
    voltas: 1 | 2 | 3
    deckSize: number
  }) {
    return mCreateRoom({
      profile: toConvexProfile(args.profile),
      deck: args.deck,
      voltas: args.voltas,
      deckSize: args.deckSize,
      playerId,
    })
  }

  async function joinRoom(code: string, profile: Profile) {
    return mJoinRoom({ code, profile: toConvexProfile(profile), playerId })
  }

  async function startGame() {
    const code = getCode()
    if (!code) return
    return mStartGame({ code, playerId })
  }

  async function lockGuess() {
    const code = getCode()
    if (!code) return
    return mLockGuess({ code, playerId })
  }

  async function reveal() {
    const code = getCode()
    if (!code) return
    return mReveal({ code, playerId })
  }

  async function nextRound() {
    const code = getCode()
    if (!code) return
    return mNextRound({ code, playerId })
  }

  async function restartGame() {
    const code = getCode()
    if (!code) return
    return mRestartGame({ code, playerId })
  }

  async function leaveRoom() {
    const code = getCode()
    if (!code) return
    return mLeaveRoom({ code, playerId })
  }

  async function generateUploadUrl() {
    return mGenerateUploadUrl({})
  }

  async function saveAvatar(storageId: string) {
    const code = getCode()
    if (!code) return
    return mSaveAvatar({
      code,
      playerId,
      storageId: storageId as Id<'_storage'>,
    })
  }

  return {
    playerId,
    // estado reativo da query
    get isLoading() {
      return q.isLoading
    },
    get error() {
      return q.error
    },
    get view() {
      return view
    },
    get room() {
      return room
    },
    get players() {
      return players
    },
    get guesses() {
      return guesses
    },
    get me() {
      return me
    },
    // derivados
    get isHost() {
      return isHost
    },
    get isDono() {
      return isDono
    },
    get connectedPlayers() {
      return connectedPlayers
    },
    get myGuess() {
      return myGuess
    },
    get lockedCount() {
      return lockedCount
    },
    get guesserCount() {
      return guesserCount
    },
    // ações
    createRoom,
    joinRoom,
    startGame,
    updateGuess,
    lockGuess,
    reveal,
    nextRound,
    restartGame,
    leaveRoom,
    generateUploadUrl,
    saveAvatar,
  }
}

// hint de tipo para consumidores
export type RoomConnection = ReturnType<typeof createRoomConnection>
