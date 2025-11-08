"use client"

import React from 'react'
import { SuperadminHeader } from './SuperadminHeader'
import { AdminHeader } from './AdminHeader'
import { EditorHeader } from './EditorHeader'

interface RoleBasedHeaderProps {
  user: {
    first_name: string
    last_name: string
    email: string
    role_slug?: string
  }
  onLogout: () => void
}

export function RoleBasedHeader({ user, onLogout }: RoleBasedHeaderProps) {
  // Determine which header to show based on role
  switch (user.role_slug) {
    case 'superadmin':
      return <SuperadminHeader user={user} onLogout={onLogout} />
    
    case 'admin':
      return <AdminHeader user={user} onLogout={onLogout} />
    
    case 'editor':
      return <EditorHeader user={user} onLogout={onLogout} />
    
    default:
      // Default to editor header if no role assigned
      return <EditorHeader user={user} onLogout={onLogout} />
  }
}
