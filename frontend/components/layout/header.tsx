"use client"

import { Building2, Menu, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-[#222A59] text-white flex items-center justify-between px-3 md:px-6 shadow-md z-50">
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden text-white hover:bg-white/10 flex-shrink-0">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Building2 className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs md:text-sm leading-tight truncate">Dirección de Intercambio Comercial Internacional y Regional</span>
            <span className="text-xs text-white/80 hidden sm:inline">Provincia de Catamarca</span>
          </div>
        </div>
      </div>

      <nav className="hidden lg:flex items-center gap-4 md:gap-6 flex-shrink-0">
        <a href="/dashboard" className="text-sm font-medium hover:text-white/80 transition-colors">
          Dashboard
        </a>
        <a href="/dashboard/empresas" className="text-sm font-medium hover:text-white/80 transition-colors">
          Empresas
        </a>
        <a href="/dashboard/reportes" className="text-sm font-medium hover:text-white/80 transition-colors">
          Reportes
        </a>
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 flex-shrink-0">
            <User className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Mi Cuenta</span>
              {user && <span className="text-xs text-muted-foreground font-normal">{user.email}</span>}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configuración</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
