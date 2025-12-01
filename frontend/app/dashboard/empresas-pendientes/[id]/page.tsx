"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CheckCircle, XCircle, Edit2, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface EmpresaPendiente {
  id: number
  razon_social: string
  nombre_fantasia?: string
  cuit_cuil: string
  rubro_principal?: string
  sub_rubro?: string
  direccion: string
  departamento: string
  municipio?: string
  localidad?: string
  departamento_nombre?: string
  municipio_nombre?: string
  localidad_nombre?: string
  correo: string
  telefono: string
  sitioweb?: string
  tipo_empresa?: string
  productos?: Array<{
    nombre: string
    descripcion?: string
    posicion_arancelaria?: string
    capacidad_productiva?: number
  }>
  servicios_ofrecidos?: any
  exporta?: string
  destino_exportacion?: string
  certificado_pyme?: string
  certificaciones?: string
  observaciones?: string
  fecha_creacion: string
  estado: string
  contacto_principal?: {
    nombre: string
    cargo: string
    telefono: string
    email: string
  }
  contactos_secundarios?: Array<{
    nombre: string
    cargo: string
    telefono: string
    email: string
  }>
}

export default function EmpresaPendientePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const resolvedParams = use(params)
  const [empresa, setEmpresa] = useState<EmpresaPendiente | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingAction, setLoadingAction] = useState(false)
  const [observaciones, setObservaciones] = useState("")

  useEffect(() => {
    loadEmpresa()
  }, [resolvedParams.id])

  const loadEmpresa = async () => {
    try {
      setLoading(true)
      const data = await api.get(`/registro/solicitudes/${resolvedParams.id}/`)
      setEmpresa(data)
      setObservaciones(data.observaciones_admin || "")
    } catch (error) {
      console.error("Error loading empresa:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAprobar = async () => {
    try {
      setLoadingAction(true)
      const response = await api.post(`/registro/solicitudes/${resolvedParams.id}/aprobar/`, {
        observaciones: observaciones
      })
      
      // Verificar si la respuesta es exitosa
      if (response && (response.status === 'success' || response.status === 200 || response.empresa_id)) {
        toast({
          title: "Empresa aprobada",
          description: `La empresa "${empresa?.razon_social}" ha sido aprobada exitosamente y se ha creado su cuenta.`,
          variant: "default",
        })
        // Esperar un momento antes de redirigir para que el toast se vea
        setTimeout(() => {
          router.push("/dashboard/empresas-pendientes")
          router.refresh() // Forzar recarga de la página
        }, 1000)
      } else {
        throw new Error("La respuesta del servidor no indica éxito")
      }
    } catch (error: any) {
      console.error("Error aprobando empresa:", error)
      
      // Verificar si el error es solo del email pero la empresa se creó
      const errorMessage = error.response?.data?.error || error.message || "Error al aprobar la empresa"
      
      // Si el error menciona email, puede que la empresa se haya creado igual
      if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('correo')) {
        toast({
          title: "Empresa aprobada con advertencia",
          description: `La empresa fue aprobada pero hubo un problema al enviar el email. La empresa fue creada correctamente.`,
          variant: "default",
        })
        setTimeout(() => {
          router.push("/dashboard/empresas-pendientes")
          router.refresh()
        }, 1000)
      } else {
        toast({
          title: "Error al aprobar",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setLoadingAction(false)
    }
  }

  const handleRechazar = async () => {
    if (!confirm("¿Estás seguro de que deseas rechazar esta solicitud?")) {
      return
    }
    
    try {
      setLoadingAction(true)
      await api.post(`/registro/solicitudes/${resolvedParams.id}/rechazar/`, {
        observaciones: observaciones
      })
      toast({
        title: "Solicitud rechazada",
        description: `La solicitud de "${empresa?.razon_social}" ha sido rechazada.`,
        variant: "default",
      })
      router.push("/dashboard/empresas-pendientes")
    } catch (error: any) {
      console.error("Error rechazando empresa:", error)
      toast({
        title: "Error al rechazar",
        description: error.message || "Error al rechazar la empresa. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoadingAction(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!empresa) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-[#6B7280]">No se encontró la empresa</p>
          <Link href="/dashboard/empresas-pendientes">
            <Button className="mt-4">Volver</Button>
          </Link>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/empresas-pendientes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Revisar Solicitud de Registro</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {empresa.razon_social} - {empresa.cuit_cuil}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleRechazar} 
              variant="destructive" 
              className="gap-2"
              disabled={loadingAction}
            >
              {loadingAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Rechazar
            </Button>
            <Button 
              onClick={handleAprobar} 
              className="bg-[#C3C840] hover:bg-[#C3C840]/90 text-[#222A59] gap-2"
              disabled={loadingAction}
            >
              {loadingAction ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Aprobar
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <Label className="text-sm font-semibold mb-2">Observaciones del Administrador</Label>
          <Textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Agregar observaciones sobre la solicitud..."
            className="min-h-[100px]"
          />
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-[#222A59] mb-4">Información General</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Razón Social</Label>
                  <p className="font-medium">{empresa.razon_social}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Nombre de Fantasía</Label>
                  <p className="font-medium">{empresa.nombre_fantasia || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">CUIT</Label>
                  <p className="font-medium">{empresa.cuit_cuil}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Rubro Principal</Label>
                  <p className="font-medium">{empresa.rubro_principal || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Sub-Rubro</Label>
                  <p className="font-medium">{empresa.sub_rubro || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Tipo de Empresa</Label>
                  <p className="font-medium">
                    {empresa.tipo_empresa === 'producto' ? 'Productos' : 
                     empresa.tipo_empresa === 'servicio' ? 'Servicios' : 
                     empresa.tipo_empresa === 'mixta' ? 'Mixta' : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Dirección</Label>
                  <p className="font-medium">{empresa.direccion}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Departamento</Label>
                  <p className="font-medium">{empresa.departamento_nombre || empresa.departamento}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Municipio</Label>
                  <p className="font-medium">{empresa.municipio_nombre || empresa.municipio || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Localidad</Label>
                  <p className="font-medium">{empresa.localidad_nombre || empresa.localidad || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{empresa.telefono}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{empresa.correo}</p>
                </div>
                {empresa.sitioweb && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Sitio Web</Label>
                    <p className="font-medium">
                      <a href={empresa.sitioweb} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {empresa.sitioweb}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {empresa.productos && empresa.productos.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-[#222A59] mb-4">Productos</h2>
                <div className="space-y-4">
                  {empresa.productos.map((producto, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-[#222A59]">{producto.nombre}</h3>
                      {producto.descripcion && (
                        <p className="text-sm text-muted-foreground mt-1">{producto.descripcion}</p>
                      )}
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        {producto.posicion_arancelaria && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Posición Arancelaria</Label>
                            <p className="font-medium">{producto.posicion_arancelaria}</p>
                          </div>
                        )}
                        {producto.capacidad_productiva && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Capacidad Productiva</Label>
                            <p className="font-medium">{producto.capacidad_productiva}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {empresa.servicios_ofrecidos && (
              (() => {
                const servicios = Array.isArray(empresa.servicios_ofrecidos)
                  ? empresa.servicios_ofrecidos
                  : (Object.keys(empresa.servicios_ofrecidos || {}).length ? [empresa.servicios_ofrecidos] : [])

                if (!servicios || servicios.length === 0) return null

                return (
                  <Card className="p-6">
                    <h2 className="text-xl font-bold text-[#222A59] mb-4">Servicios</h2>
                    <div className="space-y-4">
                      {servicios.map((serv: any, idx: number) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <h3 className="font-semibold text-[#222A59]">{serv.nombre || `Servicio ${idx + 1}`}</h3>
                          {serv.descripcion && (
                            <p className="text-sm text-muted-foreground mt-1">{serv.descripcion}</p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                            {serv.tipo_servicio && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Tipo de Servicio</Label>
                                <p className="font-medium">{serv.tipo_servicio}</p>
                              </div>
                            )}
                            {serv.sector_atendido && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Sectores</Label>
                                <p className="font-medium">{serv.sector_atendido}</p>
                              </div>
                            )}
                            {serv.alcance_geografico && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Alcance Geográfico</Label>
                                <p className="font-medium">{serv.alcance_geografico}</p>
                              </div>
                            )}
                            {serv.paises_destino && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Países Destino</Label>
                                <p className="font-medium">{serv.paises_destino}</p>
                              </div>
                            )}
                            {serv.exporta_servicios && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Exporta Servicios</Label>
                                <p className="font-medium">{serv.exporta_servicios}</p>
                              </div>
                            )}
                            {serv.interes_exportar && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Interés en Exportar</Label>
                                <p className="font-medium">{serv.interes_exportar}</p>
                              </div>
                            )}
                            {serv.idiomas && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Idiomas</Label>
                                <p className="font-medium">{serv.idiomas}</p>
                              </div>
                            )}
                            {serv.forma_contratacion && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Forma de Contratación</Label>
                                <p className="font-medium">{Array.isArray(serv.forma_contratacion) ? serv.forma_contratacion.join(', ') : (() => {
                                  const v = typeof serv.forma_contratacion === 'string' ? serv.forma_contratacion.toLowerCase() : String(serv.forma_contratacion).toLowerCase()
                                  switch (v) {
                                    case 'hora':
                                    case 'por hora':
                                      return 'Por Hora'
                                    case 'proyecto':
                                    case 'por proyecto':
                                      return 'Por Proyecto'
                                    case 'mensual':
                                      return 'Mensual'
                                    case 'otro':
                                      return 'Otro'
                                    default:
                                      return serv.forma_contratacion
                                  }
                                })()}</p>
                              </div>
                            )}
                            {serv.certificaciones_tecnicas && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Certificaciones Técnicas</Label>
                                <p className="font-medium">{serv.certificaciones_tecnicas}</p>
                              </div>
                            )}
                            {typeof serv.equipo_tecnico !== 'undefined' && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Equipo Técnico Especializado</Label>
                                <p className="font-medium">{serv.equipo_tecnico ? 'Sí' : 'No'}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )
              })()
            )}

            {empresa.observaciones && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-[#222A59] mb-4">Observaciones</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{empresa.observaciones}</p>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-[#222A59] mb-4">Estado</h2>
              <Badge className={`${
                empresa.estado === 'pendiente' ? 'bg-[#F59E0B]' :
                empresa.estado === 'aprobada' ? 'bg-green-600' :
                empresa.estado === 'rechazada' ? 'bg-red-600' :
                'bg-gray-600'
              } text-white mb-4`}>
                {empresa.estado.charAt(0).toUpperCase() + empresa.estado.slice(1)}
              </Badge>
              <div className="space-y-2 text-sm">
                <div>
                  <Label className="text-muted-foreground">Fecha de Registro</Label>
                  <p className="font-medium">{new Date(empresa.fecha_creacion).toLocaleDateString("es-AR")}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-[#222A59] mb-4">Contacto Principal</h2>
              <div className="space-y-3">
                {empresa.contacto_principal ? (
                  <>
                    <div>
                      <Label className="text-sm text-muted-foreground">Nombre</Label>
                      <p className="font-medium">{empresa.contacto_principal.nombre}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Cargo</Label>
                      <p className="font-medium">{empresa.contacto_principal.cargo || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Teléfono</Label>
                      <p className="font-medium">{empresa.contacto_principal.telefono}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      <p className="font-medium">{empresa.contacto_principal.email}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      <p className="font-medium">{empresa.correo}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Teléfono</Label>
                      <p className="font-medium">{empresa.telefono}</p>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {empresa.exporta && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-[#222A59] mb-4">Exportación</h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Exporta</Label>
                    <p className="font-medium">
                      {empresa.exporta === 'si' ? 'Sí' : 
                       empresa.exporta === 'no' ? 'No' : 
                       empresa.exporta === 'en-proceso' ? 'En proceso' : 'N/A'}
                    </p>
                  </div>
                  {empresa.destino_exportacion && (
                    <div>
                      <Label className="text-muted-foreground">Destinos</Label>
                      <p className="font-medium">{empresa.destino_exportacion}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

