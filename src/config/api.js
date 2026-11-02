// Dynamic API base URL: Uses the current hostname so mobile devices in the same LAN
// automatically connect to http://<host-ip>:3000 instead of attempting localhost/127.0.0.1
export function getApiBaseUrl() {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:3000`
  }
  return 'http://127.0.0.1:3000'
}

export const API_BASE_URL = getApiBaseUrl()
