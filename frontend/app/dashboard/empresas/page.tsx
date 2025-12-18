"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { FiltersDropdown } from "@/components/empresas/filters-dropdown"
import { CompaniesTable } from "@/components/empresas/companies-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Download } from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"
import { ExportDialog } from "@/components/empresas/export-dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Empresa {
  id: number
  razon_social: string
  cuit_cuil: string
  estado: string
  tipo_empresa?: string
  exporta?: string
  categoria_matriz?: string
  departamento?: string
  provincia?: string
  rubro_principal?: string
  correo?: string
  telefono?: string
  fecha_creacion: string
}

export default function EmpresasPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [filters, setFilters] = useState<any>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmpresas, setSelectedEmpresas] = useState<number[]>([])
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [empresaAEliminar, setEmpresaAEliminar] = useState<Empresa | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  // Removemos la paginación - cargaremos todas las empresas
  const [allEmpresas, setAllEmpresas] = useState<Empresa[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10) // Solo para mostrar en la tabla, no para la API

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
        return
      }
      
      // Verificar si el usuario tiene permiso para acceder al dashboard
      const rolNombre = user.rol?.nombre || ""
      const canAccessDashboard = 
        user.is_superuser || 
        user.type === "admin" || 
        user.type === "staff" ||
        rolNombre.toLowerCase().includes("admin") ||
        rolNombre.toLowerCase().includes("administrador") ||
        rolNombre.toLowerCase().includes("analista") ||
        rolNombre.toLowerCase().includes("consulta") ||
        rolNombre.toLowerCase().includes("consultor")
      
      if (!canAccessDashboard) {
        router.push("/perfil-empresa")
        return
      }
    }
  }, [user, authLoading, router])

  const loadEmpresas = async () => {
    console.log('[DEBUG] Cargando todas las empresas')
    console.log('[DEBUG] Filtros actuales:', filters)
    try {
      setLoading(true)
      const params: any = {
        // No enviar paginación - queremos todas las empresas
        page_size: 10000, // Número muy grande para obtener todas
      }

      // Búsqueda mejorada - busca en múltiples campos
      if (searchQuery) {
        params.search = searchQuery
      }

      // Filtros
      if (filters.tipo_empresa && filters.tipo_empresa !== 'all') {
        params.tipo_empresa = filters.tipo_empresa
      }

      if (filters.rubro && filters.rubro !== 'all') {
        params.rubro = filters.rubro
      }

      if (filters.subRubro && filters.subRubro !== 'all') {
        params.sub_rubro = filters.subRubro
      }

      if (filters.departamento && filters.departamento !== 'all') {
        params.departamento = filters.departamento
      }

      if (filters.categoria_matriz && filters.categoria_matriz !== 'all') {
        params.categoria_matriz = filters.categoria_matriz
      }

      if (filters.exporta && filters.exporta !== 'all') {
        // El backend espera 'Sí' para exportadoras
        params.exporta = filters.exporta === 'si' ? 'Sí' : ''
      }

      if (filters.importa && filters.importa !== 'all') {
        params.importa = filters.importa === 'si' ? 'true' : 'false'
      }

      if (filters.promo2idiomas && filters.promo2idiomas !== 'all') {
        params.promo2idiomas = filters.promo2idiomas === 'si' ? 'true' : 'false'
      }

      if (filters.certificadopyme && filters.certificadopyme !== 'all') {
        params.certificadopyme = filters.certificadopyme === 'si' ? 'true' : 'false'
      }

     console.log('[DEBUG] Params enviados al backend:', params)
const response = await api.getEmpresas(params)
console.log('[DEBUG] Response completa:', response)
console.log('[Empresas Page] Response received:', response)

// Obtener todas las empresas sin paginación
let allEmpresasData: Empresa[] = []

if (response.results) {
  console.log('[Empresas Page] Results count:', response.results.length)
  allEmpresasData = response.results.map((empresa: any) => {
    if (!empresa.id) {
      console.warn('[Empresas Page] Empresa without ID:', empresa)
    }
    return empresa
  })
} else if (Array.isArray(response)) {
  console.log('[Empresas Page] Array response, count:', response.length)
  allEmpresasData = response
} else {
  console.warn('[Empresas Page] Unexpected response format:', response)
  allEmpresasData = []
}

// Guardar todas las empresas
setAllEmpresas(allEmpresasData)

// Calcular paginación solo para la visualización
const totalCount = allEmpresasData.length
const totalPages = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 1

// Obtener las empresas de la página actual
const startIndex = (currentPage - 1) * pageSize
const endIndex = startIndex + pageSize
const empresasForPage = allEmpresasData.slice(startIndex, endIndex)

setEmpresas(empresasForPage)
} catch (error: any) {
  // Manejar errores de autenticación silenciosamente
  const errorMessage = error?.message || String(error)
  const isNoAuthError = error?.noAuth || 
                        error?.silent ||
                        error?.status === 401 ||
                        errorMessage.includes('No hay sesión activa') ||
                        errorMessage.includes('credenciales') || 
                        errorMessage.includes('autenticación') || 
                        errorMessage.includes('401') ||
                        errorMessage.includes('Sesión expirada')
  
  if (isNoAuthError) {
    // Error de autenticación - no mostrar en consola, solo limpiar datos
    setEmpresas([])
    // El useEffect de autenticación se encargará de redirigir
  } else {
    // Otro tipo de error - mostrar en consola
    console.error("Error loading empresas:", error)
    setEmpresas([])
  }
} finally {
  setLoading(false)
}
  }

  // Cargar todas las empresas cuando cambian los filtros o búsqueda
  useEffect(() => {
    // Solo cargar empresas si el usuario está autenticado y tiene permisos
    if (!authLoading && user) {
      const rolNombre = user.rol?.nombre || ""
      const canAccessDashboard = 
        user.is_superuser || 
        user.type === "admin" || 
        user.type === "staff" ||
        rolNombre.toLowerCase().includes("admin") ||
        rolNombre.toLowerCase().includes("administrador") ||
        rolNombre.toLowerCase().includes("analista") ||
        rolNombre.toLowerCase().includes("consulta") ||
        rolNombre.toLowerCase().includes("consultor")
      
      if (canAccessDashboard) {
        loadEmpresas()
        setCurrentPage(1) // Reset a la primera página cuando cambian los filtros
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery, user, authLoading])

  // Actualizar empresas mostradas cuando cambia la página actual
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const empresasForPage = allEmpresas.slice(startIndex, endIndex)
    setEmpresas(empresasForPage)
  }, [currentPage, allEmpresas, pageSize])

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters })
    setCurrentPage(1) // Reset to first page
  }

  const handleClearFilters = () => {
    setFilters({})
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1) // Reset to first page
  }

  const handleExport = () => {
    if (selectedEmpresas.length === 0) {
      toast({
        title: "Ninguna empresa seleccionada",
        description: "Por favor selecciona al menos una empresa para exportar",
        variant: "destructive",
      })
      return
    }
    
    // Verificar que las empresas seleccionadas existan en la lista actual
    const empresasToExport = empresas.filter(e => selectedEmpresas.includes(e.id))
    console.log('[Export] Empresas seleccionadas (IDs):', selectedEmpresas)
    console.log('[Export] Empresas a exportar:', empresasToExport.length, empresasToExport.map(e => e.razon_social))
    
    if (empresasToExport.length === 0) {
      toast({
        title: "Error",
        description: "No se encontraron las empresas seleccionadas. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
      return
    }
    
    setShowExportDialog(true)
  }

  const handlePageChange = (page: number) => {
    // Validar que la página esté en el rango válido
    const totalPages = allEmpresas.length > 0 ? Math.ceil(allEmpresas.length / pageSize) : 1
    if (page < 1 || page > totalPages) {
      console.warn(`Intento de acceder a página inválida: ${page}. Total páginas: ${totalPages}`)
      return
    }
    setCurrentPage(page)
    // Las selecciones se mantienen porque están en el estado global
  }

  const handleDelete = async (id: number) => {
  // Buscar la empresa para obtener su información
  const empresa = empresas.find(e => e.id === id)
  if (!empresa) {
    toast({
      title: "Empresa no encontrada",
      description: "No se pudo encontrar la empresa especificada",
      variant: "destructive",
    })
    return
  }

  // Guardar la empresa y mostrar el diálogo de confirmación
  setEmpresaAEliminar(empresa)
  setShowDeleteDialog(true)
}

const confirmarEliminacion = async () => {
  if (!empresaAEliminar) return

  try {
    // Determinar el tipo de empresa desde los datos
    let tipoEmpresa = empresaAEliminar.tipo_empresa
    if (!tipoEmpresa) {
      // Intentar obtener desde la API
      try {
        const empresaDetalle = await api.getEmpresaById(empresaAEliminar.id)
        tipoEmpresa = empresaDetalle.tipo_empresa_valor || empresaDetalle.tipo_empresa
      } catch (e) {
        console.error('Error obteniendo tipo de empresa:', e)
      }
    }

    await api.deleteEmpresa(empresaAEliminar.id, tipoEmpresa)
    
    toast({
      title: "Empresa eliminada",
      description: `La empresa "${empresaAEliminar.razon_social}" ha sido eliminada exitosamente`,
      variant: "default",
    })
    
    // Cerrar diálogo y limpiar estado
    setShowDeleteDialog(false)
    setEmpresaAEliminar(null)
    
    // Recargar la lista
    await loadEmpresas()
  } catch (error: any) {
    console.error("Error deleting empresa:", error)
    toast({
      title: "Error al eliminar",
      description: error.message || "Error al eliminar la empresa. Por favor, intenta nuevamente.",
      variant: "destructive",
    })
  }
}

  // Mostrar carga mientras se verifica el usuario
  if (authLoading || !user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-[#6B7280]">Cargando...</p>
          </div>
        </div>
      </MainLayout>
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
        {/* Header */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Empresas</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Gestiona todas las empresas registradas en el sistema
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por razón social, CUIT, email, teléfono, dirección, departamento, rubro..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <FiltersDropdown 
              onFilterChange={handleFilterChange} 
              onClearFilters={handleClearFilters}
              filters={filters}
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleExport}
              disabled={selectedEmpresas.length === 0}
            >
              <Download className="h-4 w-4" />
              Exportar ({selectedEmpresas.length})
            </Button>
            <Link href="/dashboard/nueva-empresa">
              <Button size="sm" className="flex items-center gap-2 bg-[#3259B5] hover:bg-[#3259B5]/90">
                <Plus className="h-4 w-4" />
                Nueva Empresa
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <CompaniesTable 
            empresas={empresas}
            loading={loading}
            filters={filters}
            searchQuery={searchQuery}
            selectedEmpresas={selectedEmpresas}
            onSelectionChange={setSelectedEmpresas}
            onDelete={handleDelete}
            onRefresh={loadEmpresas}
            pagination={{
              page: currentPage,
              pageSize: pageSize,
              total: allEmpresas.length,
              totalPages: allEmpresas.length > 0 ? Math.ceil(allEmpresas.length / pageSize) : 1,
            }}
            onPageChange={handlePageChange}
            allEmpresas={allEmpresas}
          />
        </div>

        {/* Export Dialog */}
        <ExportDialog
          open={showExportDialog}
          onClose={() => {
            setShowExportDialog(false)
            console.log('[Export] Dialog cerrado')
          }}
          empresas={allEmpresas.filter(e => selectedEmpresas.includes(e.id))}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription asChild>
  <div className="space-y-2">
    <p>
      Estás a punto de eliminar la empresa{" "}
      <span className="font-semibold text-foreground">
        {empresaAEliminar?.razon_social}
      </span>
      .
    </p>
    <p className="text-destructive">
      Esta acción no se puede deshacer y eliminará permanentemente todos los datos asociados.
    </p>
  </div>
</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEmpresaAEliminar(null)}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmarEliminacion}
                className="bg-destructive hover:bg-destructive/90"
              >
                Eliminar empresa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        
      </div>
    </MainLayout>
  )
}
