"use client"

import type React from "react"
import {
  Home,
  BarChart3,
  Sparkles,
  TrendingUp,
  MapPin,
  FileText,
  Share2,
  Megaphone,
  Radio,
  FileBarChart,
  Grid3x3,
  ChevronRight,
  Users,
  Zap,
  Globe,
  Shield,
  Settings,
  Search,
  Link2,
  Calendar,
  Image,
  Palette,
  Target,
  MessageSquare,
  Bell,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useAuth } from "@/contexts/auth-context"

interface SubMenuItem {
  label: string
  description: string
  href: string
  badge?: string
}

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: boolean
  submenu?: SubMenuItem[]
  roles?: string[] // Roles que pueden ver este ítem
}

const navItems: NavItem[] = [
  {
    icon: Home,
    label: "Inicio",
    href: "/",
    roles: ['superadmin', 'admin', 'editor'],
  },
  
  // Admin Tools
  {
    icon: Users,
    label: "Usuarios",
    href: "/perfil/usuarios",
    roles: ['superadmin', 'admin'],
    submenu: [
      {
        label: "Gestionar Usuarios",
        description: "Crear, editar y eliminar usuarios del sistema",
        href: "/perfil/usuarios",
      },
      {
        label: "Roles y Permisos",
        description: "Administrar roles y permisos de usuarios",
        href: "/perfil/usuarios",
      },
    ],
  },
  
  {
    icon: Globe,
    label: "Sitios Web",
    href: "/perfil/sitios-web",
    roles: ['superadmin', 'admin'],
    submenu: [
      {
        label: "Mis Sitios Web",
        description: "Administrar sitios web conectados",
        href: "/perfil/sitios-web",
      },
      {
        label: "API WordPress",
        description: "Configurar y gestionar API REST",
        href: "/perfil/sitios-web",
      },
    ],
  },
  
  {
    icon: Zap,
    label: "Modelos IA",
    href: "/perfil/modelos-ia",
    roles: ['superadmin', 'admin'],
    badge: true,
    submenu: [
      {
        label: "Configuración IA",
        description: "Configurar modelos de inteligencia artificial",
        href: "/perfil/modelos-ia",
        badge: "Nuevo",
      },
    ],
  },
  
  {
    icon: Globe,
    label: "Mis Dominios",
    href: "/perfil/mis-dominios",
    roles: ['editor'],
    submenu: [
      {
        label: "Dominios Asignados",
        description: "Ver y gestionar los sitios web bajo tu responsabilidad",
        href: "/perfil/mis-dominios",
      },
    ],
  },

  {
    icon: FileText,
    label: "Contenido",
    href: "/contenido",
    roles: ['superadmin', 'admin', 'editor'],
    submenu: [
      {
        label: "Mis Artículos",
        description: "Ver y gestionar todos tus artículos",
        href: "/contenido",
      },
      {
        label: "Planificador de contenido",
        description: "Organiza y crea contenido con IA",
        href: "/contenido/planner",
      },
      {
        label: "Calendario Editorial",
        description: "Planifica y programa tus publicaciones",
        href: "/contenido/calendario",
        badge: "Pronto",
      },
      {
        label: "Plantillas",
        description: "Plantillas predefinidas para artículos",
        href: "/contenido/plantillas",
        badge: "Pronto",
      },
    ],
  },

  {
    icon: Search,
    label: "SEO",
    href: "/seo",
    roles: ['superadmin', 'admin', 'editor'],
    badge: true,
    submenu: [
      {
        label: "Análisis de Keywords",
        description: "Encuentra las mejores palabras clave",
        href: "/seo/keywords",
        badge: "Pronto",
      },
      {
        label: "Audit SEO",
        description: "Auditoría completa de tu sitio",
        href: "/seo/audit",
        badge: "Pronto",
      },
      {
        label: "Competitor Analysis",
        description: "Analiza a tu competencia",
        href: "/seo/competitors",
        badge: "Pronto",
      },
      {
        label: "Backlinks",
        description: "Gestiona y monitorea tus backlinks",
        href: "/seo/backlinks",
        badge: "Pronto",
      },
      {
        label: "Rankings",
        description: "Seguimiento de posiciones en Google",
        href: "/seo/rankings",
        badge: "Pronto",
      },
    ],
  },

  {
    icon: BarChart3,
    label: "Analytics",
    href: "/analytics",
    roles: ['superadmin', 'admin', 'editor'],
    submenu: [
      {
        label: "Dashboard",
        description: "Visión general de métricas",
        href: "/analytics",
        badge: "Pronto",
      },
      {
        label: "Tráfico",
        description: "Análisis de visitas y comportamiento",
        href: "/analytics/traffic",
        badge: "Pronto",
      },
      {
        label: "Conversiones",
        description: "Seguimiento de objetivos y conversiones",
        href: "/analytics/conversions",
        badge: "Pronto",
      },
      {
        label: "Engagement",
        description: "Métricas de interacción del contenido",
        href: "/analytics/engagement",
        badge: "Pronto",
      },
    ],
  },

  {
    icon: Link2,
    label: "Link Building",
    href: "/link-building",
    roles: ['superadmin', 'admin', 'editor'],
    submenu: [
      {
        label: "Oportunidades",
        description: "Encuentra oportunidades de enlaces",
        href: "/link-building/opportunities",
        badge: "Pronto",
      },
      {
        label: "Outreach",
        description: "Gestiona campañas de contacto",
        href: "/link-building/outreach",
        badge: "Pronto",
      },
      {
        label: "Monitor",
        description: "Monitorea tus backlinks activos",
        href: "/link-building/monitor",
        badge: "Pronto",
      },
    ],
  },

  {
    icon: Image,
    label: "Media",
    href: "/media",
    roles: ['superadmin', 'admin', 'editor'],
    submenu: [
      {
        label: "Galería",
        description: "Gestiona imágenes y videos",
        href: "/media/gallery",
        badge: "Pronto",
      },
      {
        label: "Optimización",
        description: "Optimiza imágenes automáticamente",
        href: "/media/optimization",
        badge: "Pronto",
      },
      {
        label: "Generador IA",
        description: "Genera imágenes con inteligencia artificial",
        href: "/media/ai-generator",
        badge: "Pronto",
      },
    ],
  },

  {
    icon: Share2,
    label: "Redes Sociales",
    href: "/social",
    roles: ['superadmin', 'admin', 'editor'],
    submenu: [
      {
        label: "Publicar",
        description: "Programa posts en redes sociales",
        href: "/social/publish",
        badge: "Pronto",
      },
      {
        label: "Analytics Social",
        description: "Métricas de redes sociales",
        href: "/social/analytics",
        badge: "Pronto",
      },
      {
        label: "Calendario Social",
        description: "Planifica tu contenido social",
        href: "/social/calendar",
        badge: "Pronto",
      },
    ],
  },

  {
    icon: Target,
    label: "Campañas",
    href: "/campaigns",
    roles: ['superadmin', 'admin'],
    submenu: [
      {
        label: "Todas las Campañas",
        description: "Gestiona todas tus campañas",
        href: "/campaigns",
        badge: "Pronto",
      },
      {
        label: "Email Marketing",
        description: "Campañas de email marketing",
        href: "/campaigns/email",
        badge: "Pronto",
      },
      {
        label: "Automatizaciones",
        description: "Flujos de trabajo automáticos",
        href: "/campaigns/automation",
        badge: "Pronto",
      },
    ],
  },

  {
    icon: Settings,
    label: "Configuración",
    href: "/settings",
    roles: ['superadmin', 'admin'],
    submenu: [
      {
        label: "General",
        description: "Configuración general del sistema",
        href: "/settings/general",
        badge: "Pronto",
      },
      {
        label: "Integraciones",
        description: "Conecta servicios externos",
        href: "/settings/integrations",
        badge: "Pronto",
      },
      {
        label: "API Keys",
        description: "Gestiona claves de API",
        href: "/settings/api-keys",
        badge: "Pronto",
      },
      {
        label: "Facturación",
        description: "Gestiona tu suscripción",
        href: "/settings/billing",
        badge: "Pronto",
      },
    ],
  },
]

export function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()
  
  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true // Si no tiene roles definidos, se muestra a todos
    if (!user?.role_slug) return false // Si no hay usuario, no mostrar
    return item.roles.includes(user.role_slug)
  })

  // Función para verificar si un item está activo
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }
  
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:fixed md:flex left-0 top-16 z-40 h-[calc(100vh-4rem)] w-20 border-r border-gray-200 bg-white shadow-sm">
        <nav className="flex h-full flex-col items-center py-4 w-full">
          <div className="flex flex-1 flex-col gap-1">
            {filteredNavItems.map((item) => {
              if (item.submenu) {
                return (
                  <HoverCard key={item.href} openDelay={100} closeDelay={200}>
                    <HoverCardTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "relative flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg transition-all",
                          isActive(item.href)
                            ? "bg-purple-50 text-purple-600"
                            : "text-gray-600 hover:bg-gray-100 hover:text-purple-600",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[10px] text-center leading-tight px-1">{item.label}</span>
                        {item.badge && (
                          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
                        )}
                      </Link>
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="right"
                      align="start"
                      sideOffset={8}
                      className="w-96 p-0 border-gray-200 shadow-2xl"
                    >
                      <div className="border-b border-gray-100 px-4 py-3 bg-gradient-to-r from-purple-50 to-white">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-5 w-5 text-purple-600" />
                          <h3 className="font-semibold text-gray-900">{item.label}</h3>
                        </div>
                      </div>

                      <div className="max-h-[calc(100vh-12rem)] overflow-y-auto p-2">
                        <div className="space-y-1">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className={cn(
                                "group block rounded-lg p-3 transition-all duration-200",
                                isActive(subItem.href)
                                  ? "bg-purple-50 border border-purple-200"
                                  : "hover:bg-purple-50 hover:shadow-sm"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={cn(
                                      "font-medium text-sm transition-colors",
                                      isActive(subItem.href)
                                        ? "text-purple-700"
                                        : "text-gray-900 group-hover:text-purple-700"
                                    )}>
                                      {subItem.label}
                                    </span>
                                    {subItem.badge && (
                                      <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                                        {subItem.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className={cn(
                                    "text-xs leading-relaxed transition-colors",
                                    isActive(subItem.href)
                                      ? "text-purple-600"
                                      : "text-gray-500 group-hover:text-gray-700"
                                  )}>
                                    {subItem.description}
                                  </p>
                                </div>
                                <ChevronRight className={cn(
                                  "h-4 w-4 shrink-0 transition-all duration-200",
                                  isActive(subItem.href)
                                    ? "text-purple-600 opacity-100"
                                    : "text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-purple-600 group-hover:translate-x-0.5"
                                )} />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg transition-all",
                    isActive(item.href)
                      ? "bg-purple-50 text-purple-600"
                      : "text-gray-600 hover:bg-gray-100 hover:text-purple-600",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] text-center leading-tight px-1">{item.label}</span>
                  {item.badge && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
                  )}
                </Link>
              )
            })}
          </div>

          <Link
            href="/app"
            className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg text-gray-600 transition-all hover:bg-gray-100 hover:text-purple-600"
          >
            <Grid3x3 className="h-5 w-5" />
            <span className="text-[10px]">App</span>
          </Link>
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-gray-200 bg-white shadow-lg">
        <div className="flex h-full items-center justify-around px-2">
          {filteredNavItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all flex-1 h-full",
                isActive(item.href)
                  ? "text-purple-600 bg-purple-50"
                  : "text-gray-600 hover:text-purple-600",
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[9px] text-center leading-tight">{item.label}</span>
              {item.badge && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white" />
              )}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
