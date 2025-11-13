"use client"

import { Search, ChevronDown, Bell, Settings, HelpCircle, Zap, LogOut, User, Users, LayoutDashboard, Shield, FileText, PenTool, Menu, X } from "lucide-react"
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { WebsiteSelector } from "@/components/header/website-selector"
import Link from "next/link"

export function Header() {
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Get user initials
  const getUserInitials = () => {
    if (!user) return 'U'
    return user.username.substring(0, 2).toUpperCase()
  }

  const handleLogout = async () => {
    await logout()
  }
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#3a3a52] bg-gradient-to-r from-[#2b2b40] via-[#2d2d42] to-[#2b2b40] text-white shadow-xl">
      <div className="flex h-16 items-center gap-2 md:gap-4 px-3 md:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 text-white hover:bg-[#3a3a52]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex h-6 w-6 md:h-8 md:w-8 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 shadow-lg shadow-orange-500/30" />
            <div className="relative h-3 w-3 md:h-4 md:w-4 rounded-full border-2 border-white" />
          </div>
          <span className="text-base md:text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
            LORENZOEXPEDITIONS
          </span>
        </div>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden lg:flex flex-1 items-center gap-2 max-w-2xl mx-4">
          <div className="relative flex-1 group">
            <Input
              type="text"
              placeholder="Introduce tu tarea, sitio web o palabra clave"
              className="h-11 w-full bg-[#3a3a52] border-[#4a4a62] text-white placeholder:text-gray-400 focus:bg-[#424258] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 pr-10"
            />
            <Zap className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
          </div>
          <Button
            size="icon"
            className="h-11 w-11 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-200"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* Website Selector - Hidden on mobile */}
        {user && (
          <div className="hidden md:block shrink-0">
            <WebsiteSelector />
          </div>
        )}

        {/* Right Navigation */}
        <div className="flex items-center gap-1 md:gap-3 shrink-0 ml-auto">
          <Button className="hidden bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 px-5 transition-all duration-200">
            Actualizar
          </Button>

          <div className="hidden md:block h-6 w-px bg-gray-600/50" />

          <Button
            variant="ghost"
            className="hidden text-sm text-gray-300 hover:text-white hover:bg-[#3a3a52] transition-colors px-3"
          >
            Precios
          </Button>

          <Button
            variant="ghost"
            className="hidden text-sm text-gray-300 hover:text-white hover:bg-[#3a3a52] transition-colors px-3"
          >
            Empresas
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden text-sm text-gray-300 hover:text-white hover:bg-[#3a3a52] transition-colors px-3 py-2 rounded-md focus:outline-none items-center gap-1">
                Más
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#2b2b40] border-[#3a3a52] text-white">
              <DropdownMenuLabel className="text-gray-400">Recursos</DropdownMenuLabel>
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer">
                Centro de ayuda
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer">
                Academia
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer">Blog</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#3a3a52]" />
              <DropdownMenuLabel className="text-gray-400">Comunidad</DropdownMenuLabel>
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer">Foro</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer">
                Webinars
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:block h-6 w-px bg-gray-600/50" />

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-9 w-9 text-gray-300 hover:text-white hover:bg-[#3a3a52] transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 text-gray-300 hover:text-white hover:bg-[#3a3a52] transition-colors rounded-md focus:outline-none relative flex items-center justify-center">
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-500 text-[9px] md:text-[10px] border-2 border-[#2b2b40]">
                  3
                </Badge>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-[#2b2b40] border-[#3a3a52] text-white">
              <DropdownMenuLabel className="text-gray-400">Notificaciones</DropdownMenuLabel>
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer flex-col items-start py-3">
                <div className="font-medium">Nuevo informe disponible</div>
                <div className="text-xs text-gray-400 mt-1">Tu análisis SEO semanal está listo</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer flex-col items-start py-3">
                <div className="font-medium">Actualización de ranking</div>
                <div className="text-xs text-gray-400 mt-1">3 palabras clave mejoraron posiciones</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer flex-col items-start py-3">
                <div className="font-medium">Límite de créditos</div>
                <div className="text-xs text-gray-400 mt-1">Has usado el 80% de tus créditos mensuales</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#3a3a52]" />
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer justify-center text-purple-400">
                Ver todas las notificaciones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex h-9 w-9 text-gray-300 hover:text-white hover:bg-[#3a3a52] transition-colors rounded-md focus:outline-none items-center justify-center">
                <Settings className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#2b2b40] border-[#3a3a52] text-white">
              <DropdownMenuLabel className="text-gray-400">Configuración</DropdownMenuLabel>
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer">
                Preferencias
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer">
                Integraciones
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer">API</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#3a3a52]" />
              <DropdownMenuItem className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer">
                Facturación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none">
                <Avatar className="h-8 w-8 md:h-9 md:w-9 bg-gradient-to-br from-purple-500 to-purple-600 ring-2 ring-purple-400/30 cursor-pointer hover:ring-purple-400/60 transition-all duration-200">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold text-xs md:text-sm">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 bg-[#2b2b40] border-[#3a3a52] text-white p-2">
              {/* User Info Header */}
              <div className="px-2 py-3 mb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 ring-2 ring-purple-400/30">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold text-lg">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.username}
                    </p>
                    <p className="text-xs text-purple-400 truncate">{user?.role_name}</p>
                  </div>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-[#3a3a52] my-2" />

              {/* Quick Links - Personalized by Role */}
              <DropdownMenuLabel className="text-gray-400 text-xs uppercase tracking-wider px-2 py-1">
                {user?.role_name ? `Accesos de ${user.role_name}` : 'Acceso Rápido'}
              </DropdownMenuLabel>

              {/* Superadmin Links */}
              {user?.role_slug === 'superadmin' && (
                <>
                  <DropdownMenuItem asChild className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer rounded-md mx-1 px-2 py-2">
                    <Link href="/perfil/usuarios" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Gestionar Usuarios</div>
                        <div className="text-xs text-gray-400">Administrar todos los usuarios</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer rounded-md mx-1 px-2 py-2">
                    <Link href="/perfil/modelos-ia" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
                        <Zap className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Modelos IA</div>
                        <div className="text-xs text-gray-400">Configuración de IA</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer rounded-md mx-1 px-2 py-2">
                    <Link href="/perfil/estadisticas" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center mr-3">
                        <Shield className="h-4 w-4 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Estadísticas</div>
                        <div className="text-xs text-gray-400">Métricas del sistema</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              {/* Admin Links */}
              {user?.role_slug === 'admin' && (
                <>
                  <DropdownMenuItem asChild className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer rounded-md mx-1 px-2 py-2">
                    <Link href="/perfil/usuarios" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Gestionar Usuarios</div>
                        <div className="text-xs text-gray-400">Administrar usuarios</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer rounded-md mx-1 px-2 py-2">
                    <Link href="/perfil/modelos-ia" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
                        <Zap className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Modelos IA</div>
                        <div className="text-xs text-gray-400">Configuración de IA</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer rounded-md mx-1 px-2 py-2">
                    <Link href="/perfil/estadisticas" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3">
                        <LayoutDashboard className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Estadísticas</div>
                        <div className="text-xs text-gray-400">Panel de métricas</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer rounded-md mx-1 px-2 py-2">
                    <Link href="/contenido" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-lg bg-orange-500/20 flex items-center justify-center mr-3">
                        <FileText className="h-4 w-4 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Contenido</div>
                        <div className="text-xs text-gray-400">Gestionar contenido</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              {/* Editor Links */}
              {user?.role_slug === 'editor' && (
                <>
                  <DropdownMenuItem asChild className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer rounded-md mx-1 px-2 py-2">
                    <Link href="/contenido" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center mr-3">
                        <FileText className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Mis Contenidos</div>
                        <div className="text-xs text-gray-400">Ver todos mis artículos</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer rounded-md mx-1 px-2 py-2">
                    <Link href="/contenido/planner" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
                        <PenTool className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Crear Contenido</div>
                        <div className="text-xs text-gray-400">Nuevo artículo con IA</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer rounded-md mx-1 px-2 py-2">
                    <Link href="/perfil/estadisticas" className="flex items-center w-full">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3">
                        <LayoutDashboard className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Mis Estadísticas</div>
                        <div className="text-xs text-gray-400">Ver métricas</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                </>
              )}

              {/* Mi Perfil - Common for all roles */}
              <DropdownMenuItem asChild className="hover:bg-[#3a3a52] focus:bg-[#3a3a52] cursor-pointer rounded-md mx-1 px-2 py-2">
                <Link href="/perfil/cuenta" className="flex items-center w-full">
                  <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center mr-3">
                    <User className="h-4 w-4 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Mi Perfil</div>
                    <div className="text-xs text-gray-400">Configuración personal</div>
                  </div>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[#3a3a52] my-2" />

              {/* Logout Button */}
              <DropdownMenuItem 
                onClick={handleLogout}
                className="hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer text-red-400 rounded-md mx-1 px-2 py-2.5 font-medium"
              >
                <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center mr-3">
                  <LogOut className="h-4 w-4 text-red-400" />
                </div>
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
