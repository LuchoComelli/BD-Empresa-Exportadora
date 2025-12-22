"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Save, Globe, Loader2, AlertCircle, Map } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useDashboardAuth, handleAuthError } from "@/hooks/use-dashboard-auth"
import { useRouter } from "next/navigation"

interface Configuracion {
  id: number
  nombre_sistema: string
  institucion: string
  email_contacto: string
  telefono: string
  direccion: string
  paises_destino: number
  valor_exportado: string
  beneficio1_titulo: string
  beneficio1_descripcion: string
  beneficio2_titulo: string
  beneficio2_descripcion: string
  beneficio3_titulo: string
  beneficio3_descripcion: string
  densidad_baja_max?: number
  densidad_media_max?: number
  densidad_alta_max?: number
  densidad_muy_alta_min?: number
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useDashboardAuth()
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre_sistema: "",
    institucion: "",
    email_contacto: "",
    telefono: "",
    direccion: "",
    paises_destino: 0,
    valor_exportado: "",
    beneficio1_titulo: "",
    beneficio1_descripcion: "",
    beneficio2_titulo: "",
    beneficio2_descripcion: "",
    beneficio3_titulo: "",
    beneficio3_descripcion: "",
    densidad_baja_max: 5,
    densidad_media_max: 20,
    densidad_alta_max: 40,
    densidad_muy_alta_min: 41
  })
  const { toast } = useToast()

  // Verificar si el usuario es admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
        return
      }
      
      const isAdmin = user.is_superuser || 
                     user.type === "admin" ||
                     user.rol?.nombre?.toLowerCase().includes("admin") ||
                     user.rol?.nombre?.toLowerCase().includes("administrador")
      
      if (!isAdmin) {
        router.push("/dashboard")
        return
      }
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadConfiguracion()
    }
  }, [user])

  const loadConfiguracion = async () => {
    try {
      setLoading(true)
      const data = await api.getConfiguracion()
      setConfiguracion(data)
      setFormData({
        nombre_sistema: data.nombre_sistema || "",
        institucion: data.institucion || "",
        email_contacto: data.email_contacto || "",
        telefono: data.telefono || "",
        direccion: data.direccion || "",
        paises_destino: data.paises_destino || 0,
        valor_exportado: data.valor_exportado || "",
        beneficio1_titulo: data.beneficio1_titulo || "",
        beneficio1_descripcion: data.beneficio1_descripcion || "",
        beneficio2_titulo: data.beneficio2_titulo || "",
        beneficio2_descripcion: data.beneficio2_descripcion || "",
        beneficio3_titulo: data.beneficio3_titulo || "",
        beneficio3_descripcion: data.beneficio3_descripcion || "",
        densidad_baja_max: data.densidad_baja_max ?? 5,
        densidad_media_max: data.densidad_media_max ?? 20,
        densidad_alta_max: data.densidad_alta_max ?? 40,
        densidad_muy_alta_min: data.densidad_muy_alta_min ?? 41
      })
    } catch (error: any) {
      if (!handleAuthError(error)) {
        console.error("Error cargando configuración:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la configuración del sistema",
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Validar rangos antes de guardar
    if (formData.densidad_baja_max < 1) {
      toast({
        title: "Error de validación",
        description: "La densidad baja debe ser al menos 1 empresa.",
        variant: "destructive",
      })
      return
    }
    
    if (formData.densidad_media_max <= formData.densidad_baja_max) {
      toast({
        title: "Error de validación",
        description: `La densidad media (${formData.densidad_media_max}) debe ser mayor que la densidad baja (${formData.densidad_baja_max}).`,
        variant: "destructive",
      })
      return
    }
    
    if (formData.densidad_alta_max <= formData.densidad_media_max) {
      toast({
        title: "Error de validación",
        description: `La densidad alta (${formData.densidad_alta_max}) debe ser mayor que la densidad media (${formData.densidad_media_max}).`,
        variant: "destructive",
      })
      return
    }
    
    if (formData.densidad_muy_alta_min <= formData.densidad_alta_max) {
      toast({
        title: "Error de validación",
        description: `La densidad muy alta (${formData.densidad_muy_alta_min}) debe ser mayor que la densidad alta (${formData.densidad_alta_max}).`,
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)
      console.log("Guardando configuración:", formData)
      const updated = await api.updateConfiguracion(formData)
      console.log("Configuración guardada:", updated)
      setConfiguracion(updated)
      setFormData({
        nombre_sistema: updated.nombre_sistema || "",
        institucion: updated.institucion || "",
        email_contacto: updated.email_contacto || "",
        telefono: updated.telefono || "",
        direccion: updated.direccion || "",
        paises_destino: updated.paises_destino || 0,
        valor_exportado: updated.valor_exportado || "",
        beneficio1_titulo: updated.beneficio1_titulo || "",
        beneficio1_descripcion: updated.beneficio1_descripcion || "",
        beneficio2_titulo: updated.beneficio2_titulo || "",
        beneficio2_descripcion: updated.beneficio2_descripcion || "",
        beneficio3_titulo: updated.beneficio3_titulo || "",
        beneficio3_descripcion: updated.beneficio3_descripcion || "",
        densidad_baja_max: updated.densidad_baja_max ?? 5,
        densidad_media_max: updated.densidad_media_max ?? 20,
        densidad_alta_max: updated.densidad_alta_max ?? 40,
        densidad_muy_alta_min: updated.densidad_muy_alta_min ?? 41
      })
      toast({
        title: "Éxito",
        description: "Configuración guardada correctamente",
      })
    } catch (error: any) {
      if (!handleAuthError(error)) {
        console.error("Error guardando configuración:", error)
        const errorMessage = error?.message || error?.detail || "No se pudo guardar la configuración"
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setSaving(false)
    }
  }

  // Mostrar carga mientras se verifica el usuario
  if (authLoading || !user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#3259B5] mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Verificar si el usuario es admin
  const isAdmin = user.is_superuser || 
                 user.type === "admin" ||
                 user.rol?.nombre?.toLowerCase().includes("admin") ||
                 user.rol?.nombre?.toLowerCase().includes("administrador")

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                <div>
                  <h2 className="text-xl font-bold text-[#222A59] mb-2">Acceso Denegado</h2>
                  <p className="text-sm text-muted-foreground">
                    No tienes permisos para acceder a esta página. Solo los administradores pueden modificar la configuración del sistema.
                  </p>
                </div>
                <Button onClick={() => router.push("/dashboard")} className="mt-4">
                  Volver al Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-[#222A59]">Configuración del Sistema</h1>
            <p className="text-muted-foreground mt-2">Administra las preferencias y configuraciones generales</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#3259B5]" />
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#222A59]">Configuración del Sistema</h1>
          <p className="text-muted-foreground mt-2">Administra las preferencias y configuraciones generales</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59] flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Configuración General
            </CardTitle>
            <CardDescription>Ajustes básicos del sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nombre-sistema">Nombre del Sistema</Label>
              <Input
                id="nombre-sistema"
                value={formData.nombre_sistema}
                onChange={(e) => setFormData({ ...formData, nombre_sistema: e.target.value })}
                placeholder="Nombre del Sistema"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institucion">Institución</Label>
              <Input
                id="institucion"
                value={formData.institucion}
                onChange={(e) => setFormData({ ...formData, institucion: e.target.value })}
                placeholder="Nombre de la Institución"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-contacto">Email de Contacto</Label>
              <Input
                id="email-contacto"
                type="email"
                value={formData.email_contacto}
                onChange={(e) => setFormData({ ...formData, email_contacto: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+54 383 4123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="San Martín 320, San Fernando del Valle de Catamarca"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="paises-destino">Países de Destino</Label>
                <Input
                  id="paises-destino"
                  type="number"
                  value={formData.paises_destino}
                  onChange={(e) => setFormData({ ...formData, paises_destino: parseInt(e.target.value) || 0 })}
                  placeholder="12"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor-exportado">Valor Exportado</Label>
                <Input
                  id="valor-exportado"
                  value={formData.valor_exportado}
                  onChange={(e) => setFormData({ ...formData, valor_exportado: e.target.value })}
                  placeholder="$2.5M"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59] flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Beneficios
            </CardTitle>
            <CardDescription>Configura las tarjetas de beneficios que se muestran en el home</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border-l-4 border-[#C3C840] pl-4 space-y-4">
                <h4 className="font-semibold text-[#222A59]">Beneficio 1</h4>
                <div className="space-y-2">
                  <Label htmlFor="beneficio1-titulo">Título</Label>
                  <Input
                    id="beneficio1-titulo"
                    value={formData.beneficio1_titulo}
                    onChange={(e) => setFormData({ ...formData, beneficio1_titulo: e.target.value })}
                    placeholder="Evaluación de Perfil Exportador"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beneficio1-descripcion">Descripción</Label>
                  <Textarea
                    id="beneficio1-descripcion"
                    value={formData.beneficio1_descripcion}
                    onChange={(e) => setFormData({ ...formData, beneficio1_descripcion: e.target.value })}
                    placeholder="Conoce tu nivel de preparación para exportar mediante nuestra matriz de clasificación"
                    rows={3}
                  />
                </div>
              </div>

              <div className="border-l-4 border-[#629BD2] pl-4 space-y-4">
                <h4 className="font-semibold text-[#222A59]">Beneficio 2</h4>
                <div className="space-y-2">
                  <Label htmlFor="beneficio2-titulo">Título</Label>
                  <Input
                    id="beneficio2-titulo"
                    value={formData.beneficio2_titulo}
                    onChange={(e) => setFormData({ ...formData, beneficio2_titulo: e.target.value })}
                    placeholder="Acceso a Mercados Internacionales"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beneficio2-descripcion">Descripción</Label>
                  <Textarea
                    id="beneficio2-descripcion"
                    value={formData.beneficio2_descripcion}
                    onChange={(e) => setFormData({ ...formData, beneficio2_descripcion: e.target.value })}
                    placeholder="Conecta con oportunidades de exportación y participa en ferias internacionales"
                    rows={3}
                  />
                </div>
              </div>

              <div className="border-l-4 border-[#807DA1] pl-4 space-y-4">
                <h4 className="font-semibold text-[#222A59]">Beneficio 3</h4>
                <div className="space-y-2">
                  <Label htmlFor="beneficio3-titulo">Título</Label>
                  <Input
                    id="beneficio3-titulo"
                    value={formData.beneficio3_titulo}
                    onChange={(e) => setFormData({ ...formData, beneficio3_titulo: e.target.value })}
                    placeholder="Capacitación y Asesoramiento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beneficio3-descripcion">Descripción</Label>
                  <Textarea
                    id="beneficio3-descripcion"
                    value={formData.beneficio3_descripcion}
                    onChange={(e) => setFormData({ ...formData, beneficio3_descripcion: e.target.value })}
                    placeholder="Recibe apoyo técnico y capacitación para mejorar tu capacidad exportadora"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[#222A59] flex items-center gap-2">
              <Map className="h-5 w-5" />
              Configuración del Mapa de Calor
            </CardTitle>
            <CardDescription>Define los rangos de densidad para el mapa de calor de empresas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Los rangos deben ser consecutivos. Si la densidad baja es hasta 10 empresas, 
                la densidad media debe comenzar en 11, y así sucesivamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="densidad-baja">
                  Densidad Baja - Máximo
                  <span className="text-muted-foreground text-xs ml-2">(1 hasta este valor)</span>
                </Label>
                <Input
                  id="densidad-baja"
                  type="number"
                  min="1"
                  value={formData.densidad_baja_max}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    setFormData({ 
                      ...formData, 
                      densidad_baja_max: value,
                      // Ajustar densidad_media_max si es necesario
                      densidad_media_max: Math.max(formData.densidad_media_max, value + 1)
                    })
                  }}
                  className={formData.densidad_baja_max >= formData.densidad_media_max ? "border-red-500" : ""}
                />
                {formData.densidad_baja_max >= formData.densidad_media_max && (
                  <p className="text-xs text-red-500">
                    Debe ser menor que la densidad media ({formData.densidad_media_max})
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Color: Verde (#10b981)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="densidad-media">
                  Densidad Media - Máximo
                  <span className="text-muted-foreground text-xs ml-2">
                    ({formData.densidad_baja_max + 1} hasta este valor)
                  </span>
                </Label>
                <Input
                  id="densidad-media"
                  type="number"
                  min={formData.densidad_baja_max + 1}
                  value={formData.densidad_media_max}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || formData.densidad_baja_max + 1
                    const minValue = formData.densidad_baja_max + 1
                    const actualValue = Math.max(minValue, value)
                    setFormData({ 
                      ...formData, 
                      densidad_media_max: actualValue,
                      // Ajustar densidad_alta_max si es necesario
                      densidad_alta_max: Math.max(formData.densidad_alta_max, actualValue + 1)
                    })
                  }}
                  className={
                    formData.densidad_media_max <= formData.densidad_baja_max || 
                    formData.densidad_media_max >= formData.densidad_alta_max 
                      ? "border-red-500" 
                      : ""
                  }
                />
                {(formData.densidad_media_max <= formData.densidad_baja_max || 
                  formData.densidad_media_max >= formData.densidad_alta_max) && (
                  <p className="text-xs text-red-500">
                    Debe ser mayor que {formData.densidad_baja_max} y menor que {formData.densidad_alta_max}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Color: Amarillo (#fbbf24)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="densidad-alta">
                  Densidad Alta - Máximo
                  <span className="text-muted-foreground text-xs ml-2">
                    ({formData.densidad_media_max + 1} hasta este valor)
                  </span>
                </Label>
                <Input
                  id="densidad-alta"
                  type="number"
                  min={formData.densidad_media_max + 1}
                  value={formData.densidad_alta_max}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || formData.densidad_media_max + 1
                    const minValue = formData.densidad_media_max + 1
                    const actualValue = Math.max(minValue, value)
                    setFormData({ 
                      ...formData, 
                      densidad_alta_max: actualValue,
                      // Ajustar densidad_muy_alta_min si es necesario
                      densidad_muy_alta_min: Math.max(formData.densidad_muy_alta_min, actualValue + 1)
                    })
                  }}
                  className={
                    formData.densidad_alta_max <= formData.densidad_media_max ||
                    formData.densidad_alta_max >= formData.densidad_muy_alta_min
                      ? "border-red-500" 
                      : ""
                  }
                />
                {(formData.densidad_alta_max <= formData.densidad_media_max ||
                  formData.densidad_alta_max >= formData.densidad_muy_alta_min) && (
                  <p className="text-xs text-red-500">
                    Debe ser mayor que {formData.densidad_media_max} y menor que {formData.densidad_muy_alta_min}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Color: Naranja (#f97316)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="densidad-muy-alta">
                  Densidad Muy Alta - Mínimo
                  <span className="text-muted-foreground text-xs ml-2">
                    (desde {formData.densidad_alta_max + 1} en adelante)
                  </span>
                </Label>
                <Input
                  id="densidad-muy-alta"
                  type="number"
                  min={formData.densidad_alta_max + 1}
                  value={formData.densidad_muy_alta_min}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || formData.densidad_alta_max + 1
                    const minValue = formData.densidad_alta_max + 1
                    setFormData({ 
                      ...formData, 
                      densidad_muy_alta_min: Math.max(minValue, value)
                    })
                  }}
                  className={formData.densidad_muy_alta_min <= formData.densidad_alta_max ? "border-red-500" : ""}
                />
                {formData.densidad_muy_alta_min <= formData.densidad_alta_max && (
                  <p className="text-xs text-red-500">
                    Debe ser mayor que la densidad alta ({formData.densidad_alta_max})
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Color: Rojo (#ef4444)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Desde este valor en adelante
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Resumen de Rangos:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Sin empresas:</strong> 0 empresas (Gris claro - No modificable)</li>
                <li>• <strong>Baja:</strong> 1 - {formData.densidad_baja_max} empresas (Verde)</li>
                <li>• <strong>Media:</strong> {formData.densidad_baja_max + 1} - {formData.densidad_media_max} empresas (Amarillo)</li>
                <li>• <strong>Alta:</strong> {formData.densidad_media_max + 1} - {formData.densidad_alta_max} empresas (Naranja)</li>
                <li>• <strong>Muy Alta:</strong> {formData.densidad_muy_alta_min}+ empresas (Rojo)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            onClick={handleSave}
            className="bg-[#3259B5] hover:bg-[#222A59] gap-2"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
