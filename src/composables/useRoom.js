import { ref, computed } from 'vue'
import { useAuth } from './useAuth'

const API_BASE_URL = 'http://127.0.0.1:3000'

const currentRoom = ref(null)
const isLoadingRoom = ref(false)
const roomError = ref('')

function getOrCreateGuestId() {
  let id = localStorage.getItem('party_guest_id')
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substring(2, 10)
    localStorage.setItem('party_guest_id', id)
  }
  return id
}

export function useRoom() {
  const { token, user } = useAuth()
  const guestId = getOrCreateGuestId()

  const isHost = computed(() => {
    if (!currentRoom.value) return false
    if (user.value && currentRoom.value.host_id === user.value.id) return true
    const savedHostOf = localStorage.getItem('party_host_room_' + currentRoom.value.code)
    return Boolean(savedHostOf)
  })

  async function createRoom(name, hostName = '') {
    isLoadingRoom.value = true
    roomError.value = ''

    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {})
        },
        body: JSON.stringify({
          name: name || '',
          host_name: hostName || (user.value?.display_name || 'Host')
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Raum konnte nicht erstellt werden.')
      }

      const room = await res.json()
      currentRoom.value = room
      localStorage.setItem('party_host_room_' + room.code, 'true')
      return room
    } catch (err) {
      console.error('Failed to create room:', err)
      roomError.value = err.message
      throw err
    } finally {
      isLoadingRoom.value = false
    }
  }

  async function fetchRoom(code) {
    if (!code) return null
    isLoadingRoom.value = true
    roomError.value = ''

    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${code.toUpperCase()}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Raum nicht gefunden.')
      }
      const room = await res.json()
      currentRoom.value = room
      return room
    } catch (err) {
      console.error('Failed to fetch room:', err)
      roomError.value = err.message
      throw err
    } finally {
      isLoadingRoom.value = false
    }
  }

  async function joinRoom(code, nickname = '') {
    if (!code) return null
    isLoadingRoom.value = true
    roomError.value = ''

    const myName = nickname || user.value?.display_name || 'Party Gast'

    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${code.toUpperCase()}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {})
        },
        body: JSON.stringify({
          nickname: myName,
          user_id: user.value?.id || guestId
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Konnte dem Raum nicht beitreten.')
      }

      const room = await res.json()
      currentRoom.value = room
      return room
    } catch (err) {
      console.error('Failed to join room:', err)
      roomError.value = err.message
      throw err
    } finally {
      isLoadingRoom.value = false
    }
  }

  async function leaveRoom(code) {
    if (!code) return
    try {
      await fetch(`${API_BASE_URL}/api/rooms/${code.toUpperCase()}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.value?.id || guestId
        })
      })
    } catch (e) {
      console.warn('Error leaving room:', e)
    } finally {
      localStorage.removeItem('party_host_room_' + code.toUpperCase())
      currentRoom.value = null
    }
  }

  async function addToQueue(code, track) {
    if (!code || !track) return null
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${code.toUpperCase()}/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {})
        },
        body: JSON.stringify({
          track_id: track.id,
          name: track.name,
          uri: track.uri,
          artist_display: track.artist_display,
          album_name: track.album_name,
          album_art: track.album_art,
          duration_ms: track.duration_ms,
          user_id: user.value?.id || guestId,
          user_name: user.value?.display_name || 'Party Gast'
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Konnte Song nicht zur Queue hinzufügen.')
      }

      const room = await res.json()
      currentRoom.value = room
      return room
    } catch (err) {
      console.error('Failed to add to queue:', err)
      throw err
    }
  }

  async function voteTrack(code, trackId) {
    if (!code || !trackId) return null
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${code.toUpperCase()}/queue/${trackId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {})
        },
        body: JSON.stringify({
          user_id: user.value?.id || guestId
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Fehler beim Abstimmen.')
      }

      const room = await res.json()
      currentRoom.value = room
      return room
    } catch (err) {
      console.error('Failed to vote track:', err)
      throw err
    }
  }

  async function removeFromQueue(code, trackId) {
    if (!code || !trackId) return null
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${code.toUpperCase()}/queue/${trackId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Konnte Song nicht entfernen.')
      }

      const room = await res.json()
      currentRoom.value = room
      return room
    } catch (err) {
      console.error('Failed to remove from queue:', err)
      throw err
    }
  }

  return {
    currentRoom,
    isHost,
    guestId,
    isLoadingRoom,
    roomError,
    createRoom,
    fetchRoom,
    joinRoom,
    leaveRoom,
    closeRoom,
    addToQueue,
    voteTrack,
    removeFromQueue
  }
}
