"use client"

import { cn } from "@/lib/utils"
import { Building2, LayoutDashboard, FileText, BarChart3, Settings, Users, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Empresas",
    icon: Building2,
    href: "/dashboard/empresas",
  },
  {
    title: "Empresas Pendientes",
    icon: Clock,
    href: "/dashboard/empresas-pendientes",
  },
  {
    title: "Nueva Empresa",
    icon: FileText,
    href: "/dashboard/empresas/nueva",
  },
  {
    title: "Matriz de Clasificación",
    icon: BarChart3,
    href: "/dashboard/matriz",
  },
  {
    title: "Mapa",
    icon: MapPin,
    href: "/dashboard/mapa",
  },
  {
    title: "Usuarios",
    icon: Users,
    href: "/dashboard/usuarios",
  },
  {
    title: "Configuración",
    icon: Settings,
    href: "/dashboard/configuracion",
  },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-14 md:top-16 left-0 w-56 md:w-64 bg-white border-r border-border z-40 transition-transform duration-300 lg:translate-x-0 overflow-y-auto",
          "h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]",
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
