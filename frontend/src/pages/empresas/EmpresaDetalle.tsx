import { useParams, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProfileHeader } from '@/components/empresas/profile-header';
import { ProfileTabs } from '@/components/empresas/profile-tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function EmpresaDetalle() {
  const { id } = useParams<{ id: string }>();

  // Mock data - in real app, fetch from API
  const company = {
    name: 'Vitivinícola del Valle S.A.',
    category: 'Exportadora' as const,
    score: 16,
    sector: 'Agroindustria',
    location: 'Capital, Catamarca',
    email: 'contacto@vitivinicola.com',
    phone: '+54 383 4123456',
    website: 'https://www.vitivinicola.com',
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/empresas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-ministerio-navy">Perfil de Empresa</h1>
            <p className="text-ministerio-gray mt-1">Información detallada de la empresa</p>
          </div>
        </div>

        <ProfileHeader company={company} />
        <ProfileTabs companyId={id || ''} />
      </div>
    </MainLayout>
  );
}