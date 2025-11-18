"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { FiltersSidebar } from "@/components/empresas/filters-sidebar"
import { CompaniesTable } from "@/components/empresas/companies-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Download } from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"
import { ExportDialog } from "@/components/empresas/export-dialog"

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
    try {
      setLoading(true)
      const params: any = {
        estado: 'aprobada', // Solo mostrar empresas aprobadas
        page: pagination.page,
        page_size: pagination.pageSize,
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      if (filters.categoria && filters.categoria !== 'all') {
        if (filters.categoria === 'exportadora') {
          params.exporta = 'si'
        } else if (filters.categoria === 'potencial') {
          params.exporta = 'en-proceso'
        } else if (filters.categoria === 'inicial') {
          params.exporta = 'no'
        }
      }

      if (filters.sector && filters.sector !== 'all') {
        params.rubro = filters.sector
      }

      if (filters.departamento && filters.departamento !== 'all') {
        params.departamento = filters.departamento
      }

      const response = await api.getEmpresas(params)
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
        setEmpresas(empresasWithIds)
        setPagination(prev => ({
          ...prev,
          total: response.count || response.results.length,
          totalPages: Math.ceil((response.count || response.results.length) / prev.pageSize),
        }))
      } else if (Array.isArray(response)) {
        // Si es un array simple
        console.log('[Empresas Page] Array response, count:', response.length)
        setEmpresas(response)
        setPagination(prev => ({
          ...prev,
          total: response.length,
          totalPages: Math.ceil(response.length / prev.pageSize),
        }))
      } else {
        // Si viene en otro formato
        console.warn('[Empresas Page] Unexpected response format:', response)
        setEmpresas([])
        setPagination(prev => ({
          ...prev,
          total: 0,
          totalPages: 0,
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
      alert("Por favor selecciona al menos una empresa para exportar")
      return
    }
    setShowExportDialog(true)
  }

  const handlePageChange = (page: number) => {
    setPagination({ ...pagination, page })
  }

  const handleDelete = async (id: number) => {
    try {
      // Buscar la empresa para obtener su tipo
      const empresa = empresas.find(e => e.id === id)
      if (!empresa) {
        alert('Empresa no encontrada')
        return
      }

      if (!confirm(`¿Estás seguro de que deseas eliminar la empresa "${empresa.razon_social}"? Esta acción no se puede deshacer.`)) {
        return
      }

      await api.deleteEmpresa(id, empresa.tipo_empresa)
      alert('Empresa eliminada correctamente')
      loadEmpresas() // Recargar la lista
    } catch (error: any) {
      console.error("Error deleting empresa:", error)
      alert(error.message || "Error al eliminar la empresa. Por favor, intenta nuevamente.")
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
                placeholder="Buscar empresas..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
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
            <Link href="/dashboard/empresas/nueva">
              <Button size="sm" className="flex items-center gap-2 bg-[#3259B5] hover:bg-[#3259B5]/90">
                <Plus className="h-4 w-4" />
                Nueva Empresa
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          <FiltersSidebar 
            onFilterChange={handleFilterChange} 
            onClearFilters={handleClearFilters}
            filters={filters}
          />
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
