// Identidade local do jogador (sem runes; uso em qualquer contexto).
// Persistida no localStorage para sobreviver a reloads e reentrar na mesma sala.
import type { PlayerColor } from '../game/store.svelte'

const PLAYER_ID_KEY = 'pov-player-id'
const PROFILE_KEY = 'pov-profile'

export type Profile = {
  name: string
  color: PlayerColor
  avatarStorageId: string | null
}

function uuid(): string {
  // crypto.randomUUID está disponível em todos os navegadores-alvo (contexto seguro).
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback defensivo (não-cripto) para ambientes sem crypto.randomUUID.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Lê (ou cria e persiste) o id estável deste dispositivo/jogador. */
export function getPlayerId(): string {
  if (typeof localStorage === 'undefined') return uuid()
  let id = localStorage.getItem(PLAYER_ID_KEY)
  if (!id) {
    id = uuid()
    localStorage.setItem(PLAYER_ID_KEY, id)
  }
  return id
}

/** Lê o perfil salvo, ou null se ainda não existir / inválido. */
export function getProfile(): Profile | null {
  if (typeof localStorage === 'undefined') return null
  const raw = localStorage.getItem(PROFILE_KEY)
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as Partial<Profile>
    if (typeof p?.name !== 'string' || typeof p?.color !== 'string') return null
    return {
      name: p.name,
      color: p.color as PlayerColor,
      avatarStorageId:
        typeof p.avatarStorageId === 'string' ? p.avatarStorageId : null,
    }
  } catch {
    return null
  }
}

/** Persiste o perfil. */
export function saveProfile(p: Profile): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p))
}
