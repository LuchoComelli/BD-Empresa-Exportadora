"use client"

import { useState, useEffect } from "react"
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
  const { toast } = useToast()
  const [filters, setFilters] = useState<any>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmpresas, setSelectedEmpresas] = useState<number[]>([])
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  })

  const loadEmpresas = async () => {
    console.log('[DEBUG] Cargando empresas con página:', pagination.page)
  console.log('[DEBUG] Total páginas calculadas:', pagination.totalPages)
  console.log('[DEBUG] Filtros actuales:', filters)
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        page_size: pagination.pageSize,
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

// Si la respuesta tiene paginación (DRF pagination)
if (response.results) {
  console.log('[Empresas Page] Results count:', response.results.length)
  console.log('[Empresas Page] First empresa:', response.results[0])
  
  // Asegurar que cada empresa tenga un ID válido
  const empresasWithIds = response.results.map((empresa: any) => {
    if (!empresa.id) {
      console.warn('[Empresas Page] Empresa without ID:', empresa)
    }
    return empresa
  })
  
  const totalCount = response.count || response.results.length
  const calculatedTotalPages = totalCount > 0 ? Math.ceil(totalCount / pagination.pageSize) : 1
  
  console.log('[DEBUG] Total count:', totalCount)
  console.log('[DEBUG] Page size:', pagination.pageSize)
  console.log('[DEBUG] Calculated total pages:', calculatedTotalPages)
  
  setEmpresas(empresasWithIds)
  setPagination(prev => ({
    ...prev,
    total: totalCount,
    totalPages: calculatedTotalPages,
  }))
} else if (Array.isArray(response)) {
  // Si es un array simple
  console.log('[Empresas Page] Array response, count:', response.length)
  
  const totalCount = response.length
  const calculatedTotalPages = totalCount > 0 ? Math.ceil(totalCount / pagination.pageSize) : 1
  
  setEmpresas(response)
  setPagination(prev => ({
    ...prev,
    total: totalCount,
    totalPages: calculatedTotalPages,
  }))
} else {
  // Si viene en otro formato
  console.warn('[Empresas Page] Unexpected response format:', response)
  setEmpresas([])
  setPagination(prev => ({
    ...prev,
    total: 0,
    totalPages: 1,
  }))
}
} catch (error) {
  console.error("Error loading empresas:", error)
  setEmpresas([])
} finally {
  setLoading(false)
}
  }

  useEffect(() => {
    loadEmpresas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery, pagination.page])

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters })
    setPagination({ ...pagination, page: 1 }) // Reset to first page
  }

  const handleClearFilters = () => {
    setFilters({})
    setPagination({ ...pagination, page: 1 })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setPagination({ ...pagination, page: 1 }) // Reset to first page
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
    setShowExportDialog(true)
  }

  const handlePageChange = (page: number) => {
  // Validar que la página esté en el rango válido
  if (page < 1 || page > pagination.totalPages) {
    console.warn(`Intento de acceder a página inválida: ${page}. Total páginas: ${pagination.totalPages}`)
    return
  }
  setPagination({ ...pagination, page })
}

  const handleDelete = async (id: number) => {
    try {
      // Buscar la empresa para obtener su tipo
      const empresa = empresas.find(e => e.id === id)
      if (!empresa) {
        toast({
          title: "Empresa no encontrada",
          description: "No se pudo encontrar la empresa especificada",
          variant: "destructive",
        })
        return
      }

      if (!confirm(`¿Estás seguro de que deseas eliminar la empresa "${empresa.razon_social}"? Esta acción no se puede deshacer.`)) {
        return
      }

      // Determinar el tipo de empresa desde los datos
      let tipoEmpresa = empresa.tipo_empresa
      if (!tipoEmpresa) {
        // Intentar obtener desde la API
        try {
          const empresaDetalle = await api.getEmpresaById(id)
          tipoEmpresa = empresaDetalle.tipo_empresa_valor || empresaDetalle.tipo_empresa
        } catch (e) {
          console.error('Error obteniendo tipo de empresa:', e)
        }
      }

      await api.deleteEmpresa(id, tipoEmpresa)
      toast({
        title: "Empresa eliminada",
        description: `La empresa "${empresa.razon_social}" ha sido eliminada exitosamente`,
        variant: "default",
      })
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
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Export Dialog */}
        {showExportDialog && (
          <ExportDialog
            open={showExportDialog}
            onClose={() => setShowExportDialog(false)}
            empresas={empresas.filter(e => selectedEmpresas.includes(e.id))}
          />
        )}
      </div>
    </MainLayout>
  )
}
