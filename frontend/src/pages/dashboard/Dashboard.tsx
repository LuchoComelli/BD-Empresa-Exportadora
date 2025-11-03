import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { RecentCompaniesTable } from '@/components/dashboard/recent-companies-table';
import { CategoryChart } from '@/components/dashboard/category-chart';
import { SectorDistribution } from '@/components/dashboard/sector-distribution';
import { Building2, TrendingUp, Users, FileCheck } from 'lucide-react';

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ministerio-navy">Dashboard</h1>
          <p className="text-sm md:text-base text-ministerio-gray mt-1">
            Bienvenido al Sistema de Gestión de Empresas Exportadoras
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard
            title="Total Empresas"
            value={246}
            icon={Building2}
            trend={{ value: 12, isPositive: true }}
            color="#3259B5"
          />
          <StatsCard
            title="Exportadoras"
            value={45}
            icon={TrendingUp}
            trend={{ value: 8, isPositive: true }}
            color="#C3C840"
          />
          <StatsCard
            title="Potencial Exportadora"
            value={78}
            icon={FileCheck}
            trend={{ value: 15, isPositive: true }}
            color="#F59E0B"
          />
          <StatsCard
            title="Etapa Inicial"
            value={123}
            icon={Users}
            trend={{ value: 5, isPositive: false }}
            color="#629BD2"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <CategoryChart />
          <SectorDistribution />
        </div>

        {/* Recent Companies Table */}
        <RecentCompaniesTable />
      </div>
    </MainLayout>
  );
}