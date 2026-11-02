// Dynamic API base URL:
// In dev (port 9000), point to backend port 3000.
// In production (served by Axum or behind a reverse proxy/domain), use window.location.origin.
export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.port === '9000') {
      return `http://${window.location.hostname}:3000`
    }
    return window.location.origin
  }
  return 'http://127.0.0.1:3000'
}

export const API_BASE_URL = getApiBaseUrl()

