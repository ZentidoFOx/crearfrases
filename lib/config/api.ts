/**
 * API Configuration
 * ÚNICA FUENTE DE VERDAD para todas las URLs de la API
 * 
 * Cambiar la URL base aquí actualiza TODA la aplicación
 * No duplicar URLs en otros archivos
 */

// ============================================
// CONFIGURACIÓN ÚNICA DEL BACKEND
// ============================================
const BACKEND_URL = 'https://api-writer.turin.dev'
const API_VERSION = 'v1'
const API_BASE_URL = `${BACKEND_URL}/api/${API_VERSION}`

// ============================================
// VALIDACIÓN EN TIEMPO DE COMPILACIÓN
// ============================================
if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== API_BASE_URL) {
  console.warn(
    `⚠️  ADVERTENCIA: NEXT_PUBLIC_API_URL en .env (${process.env.NEXT_PUBLIC_API_URL}) ` +
    `no coincide con la configuración centralizada (${API_BASE_URL}). ` +
    `Usa solo la configuración en /lib/config/api.ts`
  )
}

// ============================================
// ESTRUCTURA DE ENDPOINTS
// ============================================
export const API_CONFIG = {
  // URL base para referencia
  baseURL: API_BASE_URL,
  backendURL: BACKEND_URL,
  
  // ========== AUTH ENDPOINTS ==========
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    logout: `${API_BASE_URL}/auth/logout`,
    refresh: `${API_BASE_URL}/auth/refresh`,
    me: `${API_BASE_URL}/auth/me`,
  },
  
  // ========== USER ENDPOINTS ==========
  user: {
    profile: `${API_BASE_URL}/user/profile`,
    password: `${API_BASE_URL}/user/password`,
    account: `${API_BASE_URL}/user/account`,
    sessions: `${API_BASE_URL}/user/sessions`,
    stats: `${API_BASE_URL}/user/stats`,
    deleteSession: (id: number) => `${API_BASE_URL}/user/sessions/${id}`,
  },
  
  // ========== ADMIN ENDPOINTS ==========
  admin: {
    users: `${API_BASE_URL}/admin/users`,
  },
  
  // ========== ROLES ENDPOINTS ==========
  roles: {
    list: `${BACKEND_URL}/api/roles`,
    permissions: `${BACKEND_URL}/api/roles/permissions`,
    byId: (id: number) => `${BACKEND_URL}/api/roles/${id}`,
  },

  // ========== AI MODELS ENDPOINTS ==========
  aiModels: {
    list: `${API_BASE_URL}/ai-models`,
    active: `${API_BASE_URL}/ai-models/active`,
    providerKey: (provider: string = 'Google') => `${API_BASE_URL}/ai-models/provider-key?provider=${provider}`,
    getOne: (id: number) => `${API_BASE_URL}/ai-models/${id}`,
    create: `${API_BASE_URL}/ai-models`,
    update: (id: number) => `${API_BASE_URL}/ai-models/${id}`,
    delete: (id: number) => `${API_BASE_URL}/ai-models/${id}`,
    toggle: (id: number) => `${API_BASE_URL}/ai-models/${id}/toggle`,
    test: (id: number) => `${API_BASE_URL}/ai-models/${id}/test`,
  },

  // ========== WEBSITES ENDPOINTS ==========
  websites: {
    list: `${API_BASE_URL}/websites`,
    getOne: (id: number) => `${API_BASE_URL}/websites/${id}`,
    create: `${API_BASE_URL}/websites`,
    update: (id: number) => `${API_BASE_URL}/websites/${id}`,
    delete: (id: number) => `${API_BASE_URL}/websites/${id}`,
    toggle: (id: number) => `${API_BASE_URL}/websites/${id}/toggle`,
    verify: (id: number) => `${API_BASE_URL}/websites/${id}/verify`,
    incrementRequest: (id: number) => `${API_BASE_URL}/websites/${id}/increment-request`,
  },

  // ========== DASHBOARD STATS ENDPOINTS ==========
  dashboard: {
    userGrowth: `${API_BASE_URL}/dashboard/user-growth`,
    apiActivity: `${API_BASE_URL}/dashboard/api-activity`,
    overview: `${API_BASE_URL}/dashboard/overview`,
  },

  // ========== ARTICLES ENDPOINTS (Editor) ==========
  articles: {
    list: `${API_BASE_URL}/articles`,
    getOne: (id: number) => `${API_BASE_URL}/articles/${id}`,
    create: `${API_BASE_URL}/articles`,
    update: (id: number) => `${API_BASE_URL}/articles/${id}`,
    delete: (id: number) => `${API_BASE_URL}/articles/${id}`,
    submit: (id: number) => `${API_BASE_URL}/articles/${id}/submit`,
    approve: (id: number) => `${API_BASE_URL}/articles/${id}/approve`,
    reject: (id: number) => `${API_BASE_URL}/articles/${id}/reject`,
  },

  // ========== EDITOR STATS ENDPOINTS ==========
  editor: {
    stats: `${API_BASE_URL}/editor/stats`,
    productivity: `${API_BASE_URL}/editor/productivity`,
  },
}

export function buildApiUrl(path: string): string {
  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`
  }
  return `${API_BASE_URL}/${path}`
}

// ============================================
// EXPORTAR CONFIGURACIÓN
// ============================================
export default API_CONFIG
