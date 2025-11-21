"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, User, LogOut } from "lucide-react"
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
  const router = useRouter()

  return (
    <header className="fixed top-0 left-0 right-0 h-16 md:h-20 bg-[#222A59] text-white flex items-center justify-between px-3 md:px-6 shadow-md z-50">
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden text-white hover:bg-white/10 flex-shrink-0">
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/dashboard" className="flex-shrink-0 hover:opacity-90 transition-opacity">
          <div className="relative w-32 h-12 md:w-40 md:h-16 max-h-[48px] md:max-h-[64px]">
            <Image
              src="/logo.png"
              alt="Logo Catamarca"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-xs md:text-sm leading-tight truncate">Dirección de Intercambio Comercial Internacional y Regional</span>
          <span className="text-xs text-white/80 hidden sm:inline">Provincia de Catamarca</span>
        </div>
      </div>

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
          <DropdownMenuItem onClick={() => router.push('/dashboard/perfil')}>
            Perfil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard/configuracion-usuario')}>
            Configuración
          </DropdownMenuItem>
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
