/**
 * Token Manager
 * Handles storage and retrieval of authentication tokens
 */

export class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token'
  private static REFRESH_TOKEN_KEY = 'refresh_token'
  private static USER_KEY = 'user_data'

  /**
   * Save tokens to localStorage and cookies
   */
  static saveTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return

    // Save to localStorage
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken)
    
    // Save access token to cookie for middleware
    document.cookie = `access_token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
  }

  /**
   * Get access token
   */
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.ACCESS_TOKEN_KEY)
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(this.REFRESH_TOKEN_KEY)
  }

  /**
   * Save user data
   */
  static saveUser(user: any): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.USER_KEY, JSON.stringify(user))
  }

  /**
   * Get user data
   */
  static getUser(): any | null {
    if (typeof window === 'undefined') return null
    
    const userData = localStorage.getItem(this.USER_KEY)
    if (!userData) return null

    try {
      return JSON.parse(userData)
    } catch {
      return null
    }
  }

  /**
   * Clear all tokens and user data
   */
  static clearAll(): void {
    if (typeof window === 'undefined') return

    localStorage.removeItem(this.ACCESS_TOKEN_KEY)
    localStorage.removeItem(this.REFRESH_TOKEN_KEY)
    localStorage.removeItem(this.USER_KEY)
    
    // Clear cookie
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.getAccessToken()
  }
}
