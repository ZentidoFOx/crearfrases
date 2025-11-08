"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Shield, 
  Users, 
  Settings, 
  BarChart3, 
  FileText, 
  Key,
  Database,
  Bell,
  LogOut
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface SuperadminHeaderProps {
  user: {
    username: string
  }
  onLogout: () => void
}

export function SuperadminHeader({ user, onLogout }: SuperadminHeaderProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Usuarios', href: '/usuarios', icon: Users },
    { name: 'Roles', href: '/roles', icon: Shield },
    { name: 'Contenido', href: '/contenido', icon: FileText },
    { name: 'API Keys', href: '/api-keys', icon: Key },
    { name: 'Base de Datos', href: '/database', icon: Database },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
  ]

  const initials = user.username.substring(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-gradient-to-r from-red-600 to-red-700 shadow-md">
      <div className="container flex h-16 items-center px-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">AdminResh</h1>
            <p className="text-xs text-red-100">Superadministrador</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="ml-8 hidden lg:flex items-center space-x-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'text-red-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Right Section */}
        <div className="ml-auto flex items-center gap-3">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 hover:bg-white/10 text-white"
              >
                <Avatar className="h-8 w-8 bg-white text-red-600">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-red-100">Superadmin</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.username}</p>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  <Shield className="h-3 w-3" />
                  Superadmin
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/perfil" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Mi perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
