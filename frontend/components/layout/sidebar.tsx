"use client"

import { cn } from "@/lib/utils"
import { Building2, LayoutDashboard, FileText, BarChart3, Settings, Users, MapPin, Clock, FileBarChart } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const allMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    permission: null, // Todos pueden ver el dashboard
  },
  {
    title: "Empresas",
    icon: Building2,
    href: "/dashboard/empresas",
    permission: null, // Todos pueden ver empresas
  },
  {
    title: "Empresas Pendientes",
    icon: Clock,
    href: "/dashboard/empresas-pendientes",
    permission: 'puede_ver_empresas_pendientes',
  },
  {
    title: "Nueva Empresa",
    icon: FileText,
    href: "/dashboard/nueva-empresa",
    permission: 'puede_crear_empresas',
  },
  {
    title: "Matriz de Clasificación",
    icon: BarChart3,
    href: "/dashboard/matriz",
    permission: 'puede_ver_matriz',
  },
  {
    title: "Mapa",
    icon: MapPin,
    href: "/dashboard/mapa",
    permission: 'puede_ver_mapa',
  },
  {
    title: "Reportes",
    icon: FileBarChart,
    href: "/dashboard/reportes",
    permission: 'puede_ver_reportes',
  },
  {
    title: "Usuarios",
    icon: Users,
    href: "/dashboard/usuarios",
    permission: 'puede_ver_usuarios',
  },
  {
    title: "Configuración",
    icon: Settings,
    href: "/dashboard/configuracion",
    permission: 'puede_ver_configuracion',
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  
  // Función helper para verificar permisos
  const hasPermission = (permission: string | null): boolean => {
    if (!permission) return true // Sin permiso específico = todos pueden ver
    
    if (!user?.rol) return false
    
    // Superusuarios tienen todos los permisos
    if (user.is_superuser) return true
    
    // Verificar permiso específico en el rol
    const rol = user.rol as any
    return rol[permission] === true
  }
  
  // Filtrar items del menú según permisos del rol
  const menuItems = allMenuItems.filter(item => hasPermission(item.permission))

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-16 md:top-20 left-0 bottom-0 w-56 md:w-64 bg-white border-r border-border z-40 transition-transform duration-300 lg:translate-x-0 overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <nav className="p-3 md:p-4 space-y-1 md:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            // Lógica mejorada para detectar la ruta activa
            let isActive = false
            if (item.href === "/dashboard") {
              // Solo activo si es exactamente /dashboard
              isActive = pathname === "/dashboard"
            } else {
              // Para otras rutas, activo si coincide exactamente o es una subruta
              isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-colors",
                  isActive ? "bg-[#222A59] text-white" : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
