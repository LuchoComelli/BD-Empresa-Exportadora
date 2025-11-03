import { Building2, Menu, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-ministerio-navy text-white flex items-center justify-between px-6 shadow-md">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden text-white hover:bg-white/10"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight">Ministerio de Desarrollo Productivo</span>
            <span className="text-xs text-white/80">Provincia de Catamarca</span>
          </div>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-6">
        <Link to="/dashboard" className="text-sm font-medium hover:text-white/80 transition-colors">
          Dashboard
        </Link>
        <Link to="/empresas" className="text-sm font-medium hover:text-white/80 transition-colors">
          Empresas
        </Link>
        <Link to="/reportes" className="text-sm font-medium hover:text-white/80 transition-colors">
          Reportes
        </Link>
      </nav>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Mi Cuenta</span>
              {user && <span className="text-xs text-ministerio-gray font-normal">{user.email}</span>}
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
  );
}