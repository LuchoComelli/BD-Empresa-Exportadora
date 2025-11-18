"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { MatrizClasificacion } from "@/components/matriz/matriz-clasificacion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Building2, MapPin, Phone, Mail } from "lucide-react"
import api from "@/lib/api"

interface Empresa {
  id: number
  razon_social: string
  tipo_empresa: string
  rubro_nombre?: string
  departamento_nombre?: string
  municipio_nombre?: string
  telefono?: string
  correo?: string
}

export default function MatrizPage() {
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>("")
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmpresas()
  }, [])

  const loadEmpresas = async () => {
    try {
      setLoading(true)
      const response = await api.getEmpresas({ estado: 'aprobada', page_size: 100 })
      setEmpresas(response.results || [])
    } catch (error) {
      console.error("Error loading empresas:", error)
    } finally {
      setLoading(false)
    }
  }

  const empresaActual = empresas.find((e) => e.id.toString() === empresaSeleccionada)


  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Matriz de Clasificación</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Sistema de evaluación del perfil exportador de empresas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59]">Seleccionar Empresa</CardTitle>
            <CardDescription>Elige una empresa para evaluar o modificar su matriz de clasificación</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={empresaSeleccionada} onValueChange={setEmpresaSeleccionada}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una empresa..." />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>
                    Cargando empresas...
                  </SelectItem>
                ) : empresas.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    No hay empresas disponibles
                  </SelectItem>
                ) : (
                  empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id.toString()}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#3259B5]" />
                        <span>{empresa.razon_social}</span>
                        {empresa.rubro_nombre && (
                          <span className="text-xs text-muted-foreground">- {empresa.rubro_nombre}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {empresaActual && (
              <div className="mt-4 p-4 bg-[#629BD2]/5 border border-[#629BD2]/20 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg text-[#222A59]">{empresaActual.razon_social}</h3>
                      <Badge variant="outline" className="text-xs">
                        {empresaActual.tipo_empresa}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {empresaActual.rubro_nombre && (
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[#3259B5]" />
                          <span>{empresaActual.rubro_nombre}</span>
                        </div>
                      )}
                      {(empresaActual.departamento_nombre || empresaActual.municipio_nombre) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[#3259B5]" />
                          <span>
                            {[empresaActual.municipio_nombre, empresaActual.departamento_nombre]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </div>
                      )}
                      {empresaActual.telefono && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#3259B5]" />
                          <span>{empresaActual.telefono}</span>
                        </div>
                      )}
                      {empresaActual.correo && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#3259B5]" />
                          <span className="truncate">{empresaActual.correo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {empresaSeleccionada ? (
          <MatrizClasificacion empresaId={empresaSeleccionada} />
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-3">
                <Building2 className="h-16 w-16 text-[#3259B5]/30 mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-[#222A59]">Selecciona una empresa</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Elige una empresa del selector superior para evaluar su perfil exportador
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}

