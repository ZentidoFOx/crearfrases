"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './auth-context'
import { usersAPI, type AssignedWebsite } from '@/lib/api/users'

interface WebsiteContextType {
  websites: AssignedWebsite[]
  activeWebsite: AssignedWebsite | null
  setActiveWebsite: (website: AssignedWebsite | null) => void
  loading: boolean
  refreshWebsites: () => Promise<void>
}

const WebsiteContext = createContext<WebsiteContextType | undefined>(undefined)

export function WebsiteProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [websites, setWebsites] = useState<AssignedWebsite[]>([])
  const [activeWebsite, setActiveWebsiteState] = useState<AssignedWebsite | null>(null)
  const [loading, setLoading] = useState(false)

  // Load websites when user changes
  useEffect(() => {
    if (user) {
      loadWebsites()
    } else {
      // Al hacer logout, limpiar el estado pero MANTENER el localStorage
      // para que al volver a iniciar sesión, se recupere el dominio seleccionado
      setWebsites([])
      setActiveWebsiteState(null)
      // NO eliminar: localStorage.removeItem('active_website')
    }
  }, [user])

  // Load active website from localStorage
  useEffect(() => {
    if (websites.length > 0) {
      const savedWebsiteId = localStorage.getItem('active_website')
      if (savedWebsiteId) {
        const website = websites.find(w => w.id === parseInt(savedWebsiteId))
        if (website) {
          setActiveWebsiteState(website)
          return
        }
      }
      // If no saved website or not found, set first active website
      const firstActive = websites.find(w => w.is_active)
      if (firstActive) {
        setActiveWebsiteState(firstActive)
      } else if (websites.length > 0) {
        setActiveWebsiteState(websites[0])
      }
    }
  }, [websites])

  const loadWebsites = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Editors load their assigned websites
      // Admins and Superadmins can load all websites (optional)
      if (user.role_slug === 'editor') {
        const response = await usersAPI.getUserWebsites(user.id)
        if (response.success) {
          setWebsites(response.data)
        }
      } else {
        // For admin/superadmin, you can load all websites or their assigned ones
        // For now, we'll load their assigned websites too
        const response = await usersAPI.getUserWebsites(user.id)
        if (response.success) {
          setWebsites(response.data)
        }
      }
    } catch (error) {
      console.error('Error loading websites:', error)
    } finally {
      setLoading(false)
    }
  }

  const setActiveWebsite = (website: AssignedWebsite | null) => {
    setActiveWebsiteState(website)
    if (website) {
      localStorage.setItem('active_website', website.id.toString())
    } else {
      localStorage.removeItem('active_website')
    }
  }

  const refreshWebsites = async () => {
    await loadWebsites()
  }

  return (
    <WebsiteContext.Provider
      value={{
        websites,
        activeWebsite,
        setActiveWebsite,
        loading,
        refreshWebsites
      }}
    >
      {children}
    </WebsiteContext.Provider>
  )
}

export function useWebsite() {
  const context = useContext(WebsiteContext)
  if (context === undefined) {
    throw new Error('useWebsite must be used within a WebsiteProvider')
  }
  return context
}
