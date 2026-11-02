import { ref, computed } from 'vue'

const API_BASE_URL = 'http://127.0.0.1:3000'

const token = ref(localStorage.getItem('spotify_session_token') || '')
const user = ref(null)
const isConfigured = ref(true)
const isLoading = ref(false)
const authError = ref('')

export function useAuth() {
  const isAuthenticated = computed(() => Boolean(token.value && user.value))

  async function checkAuth() {
    isLoading.value = true
    authError.value = ''

    try {
      // 1. Check server status and whether Spotify credentials are configured
      const statusRes = await fetch(`${API_BASE_URL}/api/auth/status`, {
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
      })

      if (statusRes.ok) {
        const data = await statusRes.json()
        isConfigured.value = data.configured

        if (data.authenticated && data.user) {
          user.value = data.user
          return
        }
      }

      // If token is set but status didn't return user, try /api/auth/me
      if (token.value) {
        const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token.value}`
          }
        })

        if (meRes.ok) {
          user.value = await meRes.json()
        } else {
          // Token is invalid/expired on backend
          logout(false)
        }
      }
    } catch (err) {
      console.error('Failed to check auth status:', err)
      authError.value = 'Backend nicht erreichbar. Bitte stelle sicher, dass der Axum-Server läuft.'
    } finally {
      isLoading.value = false
    }
  }

  function login() {
    // Redirect browser directly to backend Spotify OAuth endpoint
    window.location.href = `${API_BASE_URL}/api/auth/spotify/login`
  }

  async function handleCallbackToken(newToken) {
    if (!newToken) return
    token.value = newToken
    localStorage.setItem('spotify_session_token', newToken)
    await checkAuth()
  }

  async function logout(notifyServer = true) {
    if (notifyServer && token.value) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.value}`
          }
        })
      } catch (e) {
        console.warn('Backend logout error:', e)
      }
    }

    token.value = ''
    user.value = null
    localStorage.removeItem('spotify_session_token')
  }

  return {
    API_BASE_URL,
    token,
    user,
    isAuthenticated,
    isConfigured,
    isLoading,
    authError,
    login,
    logout,
    checkAuth,
    handleCallbackToken
  }
}
