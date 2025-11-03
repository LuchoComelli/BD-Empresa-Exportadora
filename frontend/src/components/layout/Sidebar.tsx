import { cn } from '@/lib/utils';
import { Building2, LayoutDashboard, FileText, BarChart3, Settings, Users, MapPin, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    title: 'Empresas',
    icon: Building2,
    href: '/empresas',
  },
  {
    title: 'Empresas Pendientes',
    icon: Clock,
    href: '/empresas-pendientes',
  },
  {
    title: 'Nueva Empresa',
    icon: FileText,
    href: '/empresas/nueva',
  },
  {
    title: 'Matriz de Clasificación',
    icon: BarChart3,
    href: '/matriz',
  },
  {
    title: 'Mapa',
    icon: MapPin,
    href: '/mapa',
  },
  {
    title: 'Usuarios',
    icon: Users,
    href: '/usuarios',
  },
  {
    title: 'Configuración',
    icon: Settings,
    href: '/configuracion',
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-ministerio-navy text-white' : 'text-gray-900 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}