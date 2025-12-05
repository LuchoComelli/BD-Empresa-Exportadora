"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import { MainLayout } from "@/components/layout/main-layout"
import { StatsCard } from "@/components/dashboard/stats-card"
import { RecentCompaniesTable } from "@/components/dashboard/recent-companies-table"
import { CategoryChart } from "@/components/dashboard/category-chart"
import { SectorDistribution } from "@/components/dashboard/sector-distribution"
import { Building2, TrendingUp, Users, FileCheck } from "lucide-react"

interface DashboardStats {
  total_empresas: number
  exportadoras: number
  potencial_exportadora: number
  etapa_inicial: number
  pendientes: number
  aprobadas: number
  rechazadas: number
  en_revision: number
  recientes_30_dias: number
  tipo_producto: number
  tipo_servicio: number
  tipo_mixta: number
  con_certificado_pyme: number
  empresas_recientes: Array<{
    id: number
    nombre: string
    categoria: string
    ubicacion: string
    fecha: string
    estado: string
  }>
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    // Verificar si el usuario tiene permiso para acceder al dashboard
    if (!isLoading) {
      if (!user) {
        // Si no hay usuario, redirigir al login
        router.push("/login")
        return
      }
      
      // Verificar si el usuario tiene permiso para acceder al dashboard
      const canAccessDashboard = 
        user.is_superuser || 
        user.type === "admin" || 
        user.type === "staff" ||
        user.rol?.nombre?.toLowerCase().includes("admin") ||
        user.rol?.nombre?.toLowerCase().includes("administrador") ||
        user.rol?.nombre?.toLowerCase().includes("analista") ||
        user.rol?.nombre?.toLowerCase().includes("consulta") ||
        user.rol?.nombre?.toLowerCase().includes("consultor")
      
      if (!canAccessDashboard) {
        // Si no tiene permiso, redirigir al perfil de empresa
        router.push("/perfil-empresa")
        return
      }
      
      // Cargar estadísticas del dashboard
      loadDashboardStats()
    }
  }, [user, isLoading, router])

  const loadDashboardStats = async () => {
    try {
      setLoadingStats(true)
      const data = await api.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  // Mostrar carga mientras se verifica el usuario
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#6B7280]">Cargando...</p>
        </div>
      </div>
    )
  }

  // Verificar permisos final
  const canAccessDashboard = 
    user.is_superuser || 
    user.type === "admin" || 
    user.type === "staff" ||
    user.rol?.nombre?.toLowerCase().includes("admin") ||
    user.rol?.nombre?.toLowerCase().includes("administrador") ||
    user.rol?.nombre?.toLowerCase().includes("analista") ||
    user.rol?.nombre?.toLowerCase().includes("consulta") ||
    user.rol?.nombre?.toLowerCase().includes("consultor")

  if (!canAccessDashboard) {
    return null
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Bienvenido al Sistema de Gestión de Empresas Exportadoras
            {user.rol?.nombre && (
              <span className="ml-2 text-[#3259B5] font-medium">
                - {user.rol.nombre}
              </span>
            )}
            {user.is_superuser && (
              <span className="ml-2 text-[#C3C840] font-medium">
                (Superusuario)
              </span>
            )}
          </p>
        </div>

        {/* Stats Cards */}
        {loadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatsCard
              title="Total Empresas"
              value={stats.total_empresas}
              icon={Building2}
              color="#3259B5"
            />
            <StatsCard
              title="Exportadoras"
              value={stats.exportadoras}
              icon={TrendingUp}
              color="#C3C840"
            />
            <StatsCard
              title="Potencial Exportadora"
              value={stats.potencial_exportadora}
              icon={FileCheck}
              color="#C0217E"
            />
            <StatsCard
              title="Etapa Inicial"
              value={stats.etapa_inicial}
              icon={Users}
              color="#629BD2"
            />
          </div>
        ) : null}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <CategoryChart stats={stats} />
          <SectorDistribution stats={stats} />
        </div>

        {/* Recent Companies Table */}
        <RecentCompaniesTable companies={stats?.empresas_recientes || []} />
      </div>
    </MainLayout>
  )
}
