/** Base da API REST (proxy Vite em dev: /api/v1 → backend). */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

/** Mock local — defina VITE_USE_MOCK_API=true para desligar o backend. */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

export function isBackendApiEnabled(): boolean {
  return !USE_MOCK_API
}
