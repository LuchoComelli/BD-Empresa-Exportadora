"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Eye, Clock } from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

interface EmpresaPendiente {
  id: number
  razon_social: string
  cuit_cuil: string
  rubro_principal?: string
  correo: string
  fecha_creacion: string
  estado: string
  tipo_empresa?: string
}

export default function EmpresasPendientesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [empresas, setEmpresas] = useState<EmpresaPendiente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmpresasPendientes()
  }, [])

  // Recargar cuando se vuelve a la página (después de aprobar/rechazar)
  useEffect(() => {
    const handleFocus = () => {
      loadEmpresasPendientes()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadEmpresasPendientes = async () => {
    try {
      setLoading(true)
      const params: any = {
        estado: 'pendiente', // Solo mostrar solicitudes pendientes
        page: 1,
        page_size: 100,
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await api.getSolicitudes(params)
      
      // Si la respuesta tiene paginación (DRF pagination)
      if (response.results) {
        setEmpresas(response.results)
      } else if (Array.isArray(response)) {
        setEmpresas(response)
      } else {
        setEmpresas([])
      }
    } catch (error) {
      console.error("Error loading empresas pendientes:", error)
      setEmpresas([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Recargar cuando cambia el término de búsqueda
    const timeoutId = setTimeout(() => {
      loadEmpresasPendientes()
    }, 300)
    
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // No filtrar localmente, el backend ya filtra por estado y search
  const filteredEmpresas = empresas

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Empresas Pendientes de Aprobación</h1>
          <p className="text-sm md:text-base text-[#6B7280] mt-2">
            Revisa y aprueba las solicitudes de registro de nuevas empresas
          </p>
        </div>

        <Card className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6B7280] w-4 h-4" />
              <Input
                placeholder="Buscar por razón social, CUIT o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-64" />
                    <Skeleton className="h-4 w-48" />
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </Card>
              ))
            ) : filteredEmpresas.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-[#6B7280] mx-auto mb-4" />
                <p className="text-[#6B7280]">No hay empresas pendientes de aprobación</p>
              </div>
            ) : (
              filteredEmpresas.map((empresa) => (
                <Card key={empresa.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#222A59] text-lg">{empresa.razon_social}</h3>
                          <p className="text-sm text-[#6B7280]">CUIT: {empresa.cuit_cuil}</p>
                        </div>
                        <Badge className="bg-[#F59E0B] text-white">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-[#6B7280]">Rubro:</span>{" "}
                          <span className="font-medium text-[#222A59]">{empresa.rubro_principal || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280]">Tipo:</span>{" "}
                          <span className="font-medium text-[#222A59]">
                            {empresa.tipo_empresa === 'producto' ? 'Productos' : empresa.tipo_empresa === 'servicio' ? 'Servicios' : empresa.tipo_empresa === 'mixta' ? 'Mixta' : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#6B7280]">Email:</span>{" "}
                          <span className="font-medium text-[#222A59]">{empresa.correo}</span>
                        </div>
                        <div>
                          <span className="text-[#6B7280]">Fecha de registro:</span>{" "}
                          <span className="font-medium text-[#222A59]">
                            {new Date(empresa.fecha_creacion).toLocaleDateString("es-AR")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link href={`/dashboard/empresas-pendientes/${empresa.id}`}>
                        <Button className="w-full sm:w-auto bg-[#3259B5] hover:bg-[#3259B5]/90 text-white">
                          <Eye className="w-4 h-4 mr-2" />
                          Revisar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}

