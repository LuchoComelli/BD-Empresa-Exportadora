"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { FiltersDropdown } from "@/components/empresas/filters-dropdown"
import { CompaniesTable } from "@/components/empresas/companies-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Download, Mail, AlertTriangle } from "lucide-react"
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
  eliminado?: boolean
  ultima_notificacion_credenciales?: string
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
  const [notificando, setNotificando] = useState(false)
  const [showNotificarDialog, setShowNotificarDialog] = useState(false)
  const [showNotificarSeleccionadasDialog, setShowNotificarSeleccionadasDialog] = useState(false)
  const [resultadoNotificacion, setResultadoNotificacion] = useState<{
    enviados: number
    fallidos: number
    total: number
    errores?: Array<{empresa_id: number, razon_social: string, error: string}>
  } | null>(null)
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

      // Filtro de empresas eliminadas
      if (filters.eliminado) {
        if (filters.eliminado === 'eliminadas') {
          params.eliminado = 'true'
        } else if (filters.eliminado === 'todas') {
          // No enviar el parámetro para mostrar todas (activas y eliminadas)
          // Pero necesitamos usar all_objects en el backend
          params.eliminado = 'all'
        }
        // Si es 'activas', no enviar el parámetro (comportamiento por defecto)
      }

      // Filtro de notificación
      if (filters.notificada && filters.notificada !== 'all') {
        params.notificada = filters.notificada
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

const handleNotificar = async () => {
  if (selectedEmpresas.length === 0) {
    // Si no hay seleccionadas, mostrar diálogo para confirmar notificación masiva
    setShowNotificarDialog(true)
    return
  }
  
  // Mostrar diálogo de confirmación para empresas seleccionadas
  setShowNotificarSeleccionadasDialog(true)
}

const notificarEmpresasSeleccionadas = async () => {
  setNotificando(true)
  setResultadoNotificacion(null)
  setShowNotificarSeleccionadasDialog(false)
  
  try {
    const response = await api.notificarEmpresas(selectedEmpresas)
    
    setResultadoNotificacion({
      enviados: response.enviados || 0,
      fallidos: response.fallidos || 0,
      total: response.total || selectedEmpresas.length,
      errores: response.errores || []
    })
    
    if (response.enviados > 0) {
      toast({
        title: "Notificación enviada",
        description: `Se enviaron ${response.enviados} email(s) exitosamente${response.fallidos > 0 ? `, ${response.fallidos} fallaron` : ''}.`,
        variant: "default",
      })
    }
    
    if (response.fallidos > 0) {
      toast({
        title: "Algunos emails fallaron",
        description: `${response.fallidos} email(s) no pudieron ser enviados. Revisa los detalles.`,
        variant: "destructive",
      })
    }
    
    // Limpiar selección después de notificar
    setSelectedEmpresas([])
  } catch (error: any) {
    console.error("Error notificando empresas:", error)
    toast({
      title: "Error al notificar",
      description: error?.message || "Error al enviar las notificaciones. Por favor, intenta nuevamente.",
      variant: "destructive",
    })
  } finally {
    setNotificando(false)
  }
}

const notificarTodasLasEmpresas = async () => {
  setNotificando(true)
  setResultadoNotificacion(null)
  setShowNotificarDialog(false)
  
  try {
    const response = await api.notificarEmpresas(undefined, true)
    
    setResultadoNotificacion({
      enviados: response.enviados || 0,
      fallidos: response.fallidos || 0,
      total: response.total || 0,
      errores: response.errores || []
    })
    
    if (response.enviados > 0) {
      toast({
        title: "Notificación masiva completada",
        description: `Se enviaron ${response.enviados} email(s) exitosamente${response.fallidos > 0 ? `, ${response.fallidos} fallaron` : ''}.`,
        variant: "default",
      })
    }
    
    if (response.fallidos > 0) {
      toast({
        title: "Algunos emails fallaron",
        description: `${response.fallidos} email(s) no pudieron ser enviados. Revisa los detalles.`,
        variant: "destructive",
      })
    }
  } catch (error: any) {
    console.error("Error notificando todas las empresas:", error)
    toast({
      title: "Error al notificar",
      description: error?.message || "Error al enviar las notificaciones. Por favor, intenta nuevamente.",
      variant: "destructive",
    })
  } finally {
    setNotificando(false)
  }
}

const handleRestore = async (id: number) => {
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

  try {
    await api.restoreEmpresa(id)
    
    toast({
      title: "Empresa activada",
      description: `La empresa "${empresa.razon_social}" ha sido activada exitosamente`,
      variant: "default",
    })
    
    // Recargar la lista
    await loadEmpresas()
  } catch (error: any) {
    console.error("Error restoring empresa:", error)
    toast({
      title: "Error al activar",
      description: error.message || "Error al activar la empresa. Por favor, intenta nuevamente.",
      variant: "destructive",
    })
  }
}

  // Mostrar carga mientras se verifica el usuario
  if (authLoading || !user) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <p className="text-sm sm:text-base md:text-lg text-[#6B7280]">Cargando...</p>
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
      <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full max-w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:gap-3 md:gap-4 w-full">
          <div className="w-full">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#222A59] leading-tight">
              Empresas
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1">
              Gestiona todas las empresas registradas en el sistema
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:gap-3 w-full">
            {/* Barra de búsqueda - siempre ancho completo */}
            <div className="relative w-full">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empresas..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 sm:pl-9 w-full text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10"
              />
            </div>
            {/* Botones de acción - responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2 w-full">
              <div className="col-span-2 sm:col-span-1 min-w-0">
                <FiltersDropdown 
                  onFilterChange={handleFilterChange} 
                  onClearFilters={handleClearFilters}
                  filters={filters}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                onClick={handleExport}
                disabled={selectedEmpresas.length === 0}
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Exportar</span>
                <span className="sm:hidden">Exp.</span>
                {selectedEmpresas.length > 0 && (
                  <span className="ml-0.5 sm:ml-1 text-xs">({selectedEmpresas.length})</span>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                onClick={handleNotificar}
                disabled={notificando || (selectedEmpresas.length === 0 && allEmpresas.length === 0)}
              >
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden md:inline text-xs md:text-sm">
                  {notificando ? "Enviando..." : selectedEmpresas.length > 0 ? "Notificar" : "Notificar Todas"}
                </span>
                <span className="hidden sm:inline md:hidden">
                  {notificando ? "..." : selectedEmpresas.length > 0 ? "Notif." : "Todas"}
                </span>
                <span className="sm:hidden">
                  {notificando ? "..." : selectedEmpresas.length > 0 ? "Notif." : "Todas"}
                </span>
                {selectedEmpresas.length > 0 && (
                  <span className="ml-0.5 sm:ml-1 text-xs">({selectedEmpresas.length})</span>
                )}
              </Button>
              <Link href="/dashboard/nueva-empresa" className="col-span-2 sm:col-span-1 min-w-0">
                <Button 
                  size="sm" 
                  className="flex items-center justify-center gap-1 sm:gap-1.5 bg-[#3259B5] hover:bg-[#3259B5]/90 w-full text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
                >
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">Nueva Empresa</span>
                  <span className="sm:hidden">Nueva</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 w-full max-w-full overflow-x-hidden">
          <CompaniesTable 
            empresas={empresas}
            loading={loading}
            filters={filters}
            searchQuery={searchQuery}
            selectedEmpresas={selectedEmpresas}
            onSelectionChange={setSelectedEmpresas}
            onDelete={handleDelete}
            onRestore={handleRestore}
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

        {/* Notificar Empresas Seleccionadas Confirmation Dialog */}
        <AlertDialog open={showNotificarSeleccionadasDialog} onOpenChange={setShowNotificarSeleccionadasDialog}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <AlertDialogTitle className="text-lg sm:text-xl text-blue-900">
                  Confirmar Notificación de Empresas Seleccionadas
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm sm:text-base mt-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="font-semibold text-blue-900 mb-2">
                      ¿Estás seguro de que deseas notificar a las empresas seleccionadas?
                    </p>
                    <p className="text-blue-800 mb-3">
                      Se enviarán emails de notificación a <strong className="text-blue-900">{selectedEmpresas.length}</strong> empresa{selectedEmpresas.length !== 1 ? 's' : ''} con sus credenciales de acceso.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700 text-sm mt-3">
                      <li>Los emails se enviarán de forma gradual</li>
                      <li>Esta acción no se puede deshacer</li>
                    </ul>
                  </div>
                  {selectedEmpresas.length > 100 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-amber-800 font-medium text-sm">
                        ⚠️ Advertencia: Se intentará notificar más de 100 empresas. 
                        Este proceso puede tardar varios minutos.
                      </p>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
              <AlertDialogCancel 
                className="w-full sm:w-auto order-2 sm:order-1"
                onClick={() => setShowNotificarSeleccionadasDialog(false)}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={notificarEmpresasSeleccionadas}
                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto order-1 sm:order-2 font-semibold"
                disabled={notificando}
              >
                {notificando ? "Enviando..." : "Sí, Notificar Empresas"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Notificar Todas Confirmation Dialog */}
        <AlertDialog open={showNotificarDialog} onOpenChange={setShowNotificarDialog}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <AlertDialogTitle className="text-lg sm:text-xl text-amber-900">
                  Confirmar Notificación Masiva
                </AlertDialogTitle>
              </div>
              <AlertDialogDescription asChild>
                <div className="space-y-3 text-sm sm:text-base mt-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="font-semibold text-amber-900 mb-2">
                      ⚠️ ¿Estás seguro de que deseas notificar a TODAS las empresas?
                    </p>
                    <p className="text-amber-800 mb-3">
                      Se enviarán emails de notificación a <strong className="text-amber-900">{allEmpresas.length}</strong> empresas con sus credenciales de acceso.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-amber-700 text-sm">
                      <li>Este proceso puede tardar varios minutos</li>
                      <li>Los emails se enviarán de forma gradual, con una pequeña pausa entre cada envío para evitar sobrecargar el servidor</li>
                      <li>Esta acción no se puede deshacer</li>
                    </ul>
                  </div>
                  {allEmpresas.length > 500 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 font-medium text-sm">
                        ⚠️ Advertencia: Se intentará notificar más de 500 empresas. 
                        Esto puede exceder el límite diario de Gmail (500 emails/día para cuentas gratuitas).
                      </p>
                    </div>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
              <AlertDialogCancel 
                className="w-full sm:w-auto order-2 sm:order-1"
                onClick={() => setShowNotificarDialog(false)}
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={notificarTodasLasEmpresas}
                className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto order-1 sm:order-2 font-semibold"
                disabled={notificando}
              >
                {notificando ? "Enviando..." : "Sí, Notificar Todas"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Resultado de Notificación Dialog */}
        {resultadoNotificacion && (
          <AlertDialog open={!!resultadoNotificacion} onOpenChange={() => setResultadoNotificacion(null)}>
            <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg sm:text-xl">Resultado de Notificación</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-sm sm:text-base">
                    <div className="space-y-1">
                      <p><strong className="text-green-600">✓ Enviados:</strong> {resultadoNotificacion.enviados}</p>
                      {resultadoNotificacion.fallidos > 0 && (
                        <p><strong className="text-red-600">✗ Fallidos:</strong> {resultadoNotificacion.fallidos}</p>
                      )}
                      <p><strong>Total procesadas:</strong> {resultadoNotificacion.total}</p>
                    </div>
                    {resultadoNotificacion.errores && resultadoNotificacion.errores.length > 0 && (
                      <div className="mt-3 p-3 bg-red-50 rounded-md max-h-40 overflow-y-auto">
                        <p className="font-semibold text-red-600 mb-2">Errores:</p>
                        <ul className="space-y-1 text-xs">
                          {resultadoNotificacion.errores.slice(0, 5).map((error, idx) => (
                            <li key={idx} className="text-red-700">
                              {error.razon_social}: {error.error}
                            </li>
                          ))}
                          {resultadoNotificacion.errores.length > 5 && (
                            <li className="text-red-600 italic">
                              ... y {resultadoNotificacion.errores.length - 5} más
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction
                  onClick={() => setResultadoNotificacion(null)}
                  className="w-full sm:w-auto"
                >
                  Cerrar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm sm:text-base">
                  <p>
                    Estás a punto de eliminar la empresa{" "}
                    <span className="font-semibold text-foreground break-words">
                      {empresaAEliminar?.razon_social}
                    </span>
                    .
                  </p>
                  <p className="text-muted-foreground">
                    La empresa será marcada como eliminada y dejará de aparecer en las listas. 
                    Los datos se conservan en el sistema y pueden ser restaurados si es necesario.
                  </p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel 
                onClick={() => setEmpresaAEliminar(null)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmarEliminacion}
                className="bg-destructive hover:bg-destructive/90 w-full sm:w-auto order-1 sm:order-2"
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
