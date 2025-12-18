"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { handleAuthError } from "@/hooks/use-dashboard-auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Package,
  Award,
  LogOut,
  User,
  Briefcase,
  TrendingUp,
  Edit,
  Save,
  X,
  Plus,
  Eye,
  EyeOff,
  AlertCircle,
  Instagram,
  Linkedin,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CompanyMap } from "@/components/map/company-map"
import { LocationPicker } from "@/components/map/location-picker"

export default function PerfilEmpresaPage() {
  const { user, logout, refreshUser, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [empresaData, setEmpresaData] = useState<any>(null)
  const [solicitudId, setSolicitudId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Estados para el modal de cambio de contraseña obligatorio
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false)
  const [passwordChangeData, setPasswordChangeData] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Estados para selectores dinámicos
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [municipios, setMunicipios] = useState<any[]>([])
  const [localidades, setLocalidades] = useState<any[]>([])
  const [rubros, setRubros] = useState<any[]>([])
  const [subRubros, setSubRubros] = useState<any[]>([])
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [loadingRubros, setLoadingRubros] = useState(false)

  // Estado para configuración del footer
  const [configuracion, setConfiguracion] = useState({
    institucion: "Dirección de Intercambio Comercial Internacional y Regional",
    email_contacto: "info@desarrolloproductivo.catamarca.gob.ar",
    telefono: "(0383) 4437390",
    direccion: "San Martín 320, San Fernando del Valle de Catamarca",
  })

  // Verificar autenticación y si debe cambiar la contraseña
  useEffect(() => {
    console.log("[Perfil] Verificando autenticación y cambio de contraseña:", {
      authLoading,
      user: user ? {
        id: user.id,
        email: user.email,
        type: user.type,
        debe_cambiar_password: user.debe_cambiar_password,
        rol: user.rol
      } : null
    })
    
    if (!authLoading) {
      if (!user) {
        console.log("[Perfil] No hay usuario, redirigiendo a login")
        router.push("/login")
        return
      }
      
      // Si el usuario es empresa y debe cambiar la contraseña, mostrar el modal
      console.log("[Perfil] Verificando condiciones:", {
        isEmpresa: user.type === "empresa",
        debeCambiarPassword: user.debe_cambiar_password,
        shouldShowModal: user.type === "empresa" && user.debe_cambiar_password
      })
      
      if (user.type === "empresa" && user.debe_cambiar_password) {
        console.log("[Perfil] Usuario debe cambiar contraseña, mostrando modal")
        setShowPasswordChangeModal(true)
      } else {
        console.log("[Perfil] No se debe mostrar el modal:", {
          reason: user.type !== "empresa" ? "No es empresa" : "No debe cambiar contraseña"
        })
      }
    }
  }, [user, authLoading, router])

  // Cargar configuración para el footer
  useEffect(() => {
    const loadConfiguracion = async () => {
      try {
        const data = await api.getConfiguracion()
        setConfiguracion({
          institucion: data.institucion || "Dirección de Intercambio Comercial Internacional y Regional",
          email_contacto: data.email_contacto || "info@desarrolloproductivo.catamarca.gob.ar",
          telefono: data.telefono || "(0383) 4437390",
          direccion: data.direccion || "San Martín 320, San Fernando del Valle de Catamarca",
        })
      } catch (error) {
        console.error("Error cargando configuración:", error)
        // Mantener valores por defecto en caso de error
      }
    }
    loadConfiguracion()
  }, [])

  // Recargar datos del usuario al montar el componente
  useEffect(() => {
    const loadEmpresaData = async () => {
      if (!user || authLoading) return
      
      try {
        setIsLoading(true)
        console.log('[Perfil] Iniciando carga de datos...')
        console.log('[Perfil] Token:', localStorage.getItem('access_token') ? 'Presente' : 'Ausente')
        
        const userData = await api.getCurrentUser()
        console.log('[Perfil] Respuesta completa del API:', JSON.stringify(userData, null, 2))
        console.log('[Perfil] Datos del usuario:', userData)
        console.log('[Perfil] Datos de empresa:', userData.empresa)
        
        if (userData.empresa) {
          console.log('[Perfil] Estableciendo datos de empresa:', userData.empresa)
          
          // Normalizar datos de empresa - mapear snake_case a formato esperado por el frontend
          const empresa = userData.empresa
          const normalizedEmpresa: any = {
            // Campos básicos - mantener ambos formatos para compatibilidad
            id: empresa.id,
            razon_social: empresa.razon_social || empresa.razonSocial,
            razonSocial: empresa.razon_social || empresa.razonSocial,
            nombre_fantasia: empresa.nombre_fantasia || empresa.nombreFantasia,
            nombreFantasia: empresa.nombre_fantasia || empresa.nombreFantasia,
            cuit_cuil: empresa.cuit_cuil || empresa.cuit,
            cuit: empresa.cuit_cuil || empresa.cuit,
            tipo_sociedad: empresa.tipo_sociedad || empresa.tipoSociedad,
            tipoSociedad: empresa.tipo_sociedad || empresa.tipoSociedad,
            tipo_empresa: empresa.tipo_empresa || empresa.tipoEmpresa,
            tipo_empresa_valor: empresa.tipo_empresa_valor || empresa.tipoEmpresaValor,
            tipo_empresa_detalle: empresa.tipo_empresa_detalle || empresa.tipoEmpresaDetalle,
            estado: empresa.estado,
            
            // Ubicación
            direccion: empresa.direccion,
            codigo_postal: empresa.codigo_postal || empresa.codigoPostal,
            codigoPostal: empresa.codigo_postal || empresa.codigoPostal,
            direccion_comercial: empresa.direccion_comercial || empresa.direccionComercial,
            codigo_postal_comercial: empresa.codigo_postal_comercial || empresa.codigoPostalComercial,
            departamento: empresa.departamento,
            departamento_nombre: empresa.departamento_nombre || (typeof empresa.departamento === 'object' ? empresa.departamento.nombre : null),
            municipio: empresa.municipio,
            municipio_nombre: empresa.municipio_nombre || (typeof empresa.municipio === 'object' ? empresa.municipio.nombre : null),
            localidad: empresa.localidad,
            localidad_nombre: empresa.localidad_nombre || (typeof empresa.localidad === 'object' ? empresa.localidad.nombre : null),
            geolocalizacion: empresa.geolocalizacion,
            
            // Contacto
            telefono: empresa.telefono,
            correo: empresa.correo || empresa.email,
            email: empresa.correo || empresa.email,
            sitioweb: empresa.sitioweb || empresa.paginaWeb,
            paginaWeb: empresa.sitioweb || empresa.paginaWeb,
            
            // Rubro
            id_rubro: empresa.id_rubro || empresa.rubro,
            rubro: empresa.id_rubro || empresa.rubro,
            rubro_nombre: empresa.rubro_nombre || (typeof empresa.id_rubro === 'object' ? empresa.id_rubro.nombre : null) || empresa.rubro,
            id_subrubro: empresa.id_subrubro || empresa.subRubro,
            sub_rubro_nombre: empresa.sub_rubro_nombre || empresa.subRubroNombre,
            
            // Exportación/Importación
            exporta: empresa.exporta,
            destinoexporta: empresa.destinoexporta || empresa.destino_exportacion || empresa.destinosExportacion,
            destinosExportacion: Array.isArray(empresa.destinosExportacion) 
              ? empresa.destinosExportacion 
              : (typeof empresa.destinoexporta === 'string'
                  ? empresa.destinoexporta.split(',').map((d: string) => d.trim()).filter((d: string) => d)
                  : []),
            importa: empresa.importa,
            interes_exportar: empresa.interes_exportar || empresa.interesExportar,
            
            // Certificaciones
            certificadopyme: empresa.certificadopyme || empresa.certificadoMiPyme,
            certificadoMiPyme: empresa.certificadopyme || empresa.certificadoMiPyme,
            certificaciones: empresa.certificaciones
              ? (Array.isArray(empresa.certificaciones)
                  ? empresa.certificaciones
                  : typeof empresa.certificaciones === 'string'
                  ? empresa.certificaciones.split(',').map((c: string) => c.trim()).filter((c: string) => c)
                  : [])
              : [],
            promo2idiomas: empresa.promo2idiomas || empresa.materialPromocion2Idiomas,
            materialPromocion2Idiomas: empresa.promo2idiomas || empresa.materialPromocion2Idiomas,
            idiomas_trabaja: empresa.idiomas_trabaja || empresa.idiomasTrabajo,
            idiomasTrabajo: empresa.idiomas_trabaja || empresa.idiomasTrabajo,
            
            // Productos - normalizar formato
            productos: (() => {
              const productos = empresa.productos || empresa.productos_empresa || empresa.productos_mixta || []
              if (Array.isArray(productos)) {
                return productos.map((p: any) => ({
                  id: p.id,
                  nombre_producto: p.nombre_producto || p.nombre || '',
                  nombre: p.nombre_producto || p.nombre || '',
                  descripcion: p.descripcion || '',
                  capacidad_productiva: p.capacidad_productiva || p.capacidadProductiva || '',
                  unidad_medida: p.unidad_medida || p.unidadMedida || '',
                  periodo_capacidad: p.periodo_capacidad || p.periodoCapacidad || '',
                  posicion_arancelaria: p.posicion_arancelaria || null,
                  es_principal: p.es_principal || p.esPrincipal || false,
                }))
              }
              return []
            })(),
            
            // Servicios - normalizar formato
            servicios: (() => {
              const servicios = empresa.servicios || empresa.servicios_empresa || empresa.servicios_mixta || []
              if (Array.isArray(servicios)) {
                return servicios.map((s: any) => ({
                  id: s.id,
                  nombre_servicio: s.nombre_servicio || s.nombre || '',
                  nombre: s.nombre_servicio || s.nombre || '',
                  descripcion: s.descripcion || '',
                  tipo_servicio: s.tipo_servicio || s.tipoServicio || '',
                  sector_atendido: s.sector_atendido || (Array.isArray(s.sectores) ? s.sectores.join(', ') : s.sectores) || '',
                  alcance_servicio: s.alcance_servicio || s.alcanceGeografico || s.alcance_geografico || '',
                  forma_contratacion: s.forma_contratacion || s.formaContratacion || '',
                  es_principal: s.es_principal || s.esPrincipal || false,
                }))
              }
              return []
            })(),
            servicios_ofrecidos: empresa.servicios_ofrecidos || empresa.servicios || [],
            
            // Contactos
            contacto_principal_nombre: empresa.contacto_principal_nombre || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.nombre : null),
            contacto_principal_cargo: empresa.contacto_principal_cargo || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.cargo : null),
            contacto_principal_telefono: empresa.contacto_principal_telefono || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.telefono : null),
            contacto_principal_email: empresa.contacto_principal_email || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.email : null),
            contactos: Array.isArray(empresa.contactos) ? empresa.contactos : (empresa.contactos || []),
            
            // Actividades de promoción
            actividades_promocion_internacional: empresa.actividades_promocion_internacional || empresa.feriasAsistidas || [],
            feriasAsistidas: empresa.actividades_promocion_internacional || empresa.feriasAsistidas || [],
            
            // Redes sociales
            instagram: empresa.instagram,
            facebook: empresa.facebook,
            linkedin: empresa.linkedin,
            
            // Otros
            observaciones: empresa.observaciones,
            categoria_matriz: empresa.categoria_matriz,
            fecha_creacion: empresa.fecha_creacion,
            fecha_actualizacion: empresa.fecha_actualizacion,
          }
          
          setEmpresaData(normalizedEmpresa)
          
          // Obtener el ID de la empresa para poder actualizarla
          if (userData.empresa.id) {
            setSolicitudId(userData.empresa.id)
          } else {
            // Fallback: intentar obtener desde mi_perfil
            try {
              const perfilCompleto = await api.getMiPerfil()
              if (perfilCompleto && perfilCompleto.id) {
                setSolicitudId(perfilCompleto.id)
              }
            } catch (error) {
              console.error('[Perfil] Error al obtener ID de solicitud:', error)
            }
          }
        } else {
          console.warn('[Perfil] No se encontraron datos de empresa en la respuesta')
          setEmpresaData(null)
        }
      } catch (error: any) {
        if (!handleAuthError(error)) {
          console.error('[Perfil] Error al cargar datos:', error)
          console.error('[Perfil] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
        }
        setEmpresaData(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (user && !authLoading) {
      loadEmpresaData()
      loadDepartamentosData()
      loadRubrosData()
    }
  }, [user, authLoading])

  // Cargar municipios cuando cambia departamento en edición
  useEffect(() => {
    if (isEditing && editedData?.departamento) {
      const deptId = typeof editedData.departamento === 'object' 
        ? editedData.departamento.id 
        : editedData.departamento
      if (deptId) {
        loadMunicipiosData(deptId)
      }
    }
  }, [isEditing, editedData?.departamento])

  // Cargar localidades cuando cambia municipio en edición
  useEffect(() => {
    if (isEditing && editedData?.municipio) {
      const munId = typeof editedData.municipio === 'object'
        ? editedData.municipio.id
        : editedData.municipio
      if (munId) {
        loadLocalidadesData(munId)
      }
    }
  }, [isEditing, editedData?.municipio])

  // Cargar subrubros cuando cambia rubro en edición
  useEffect(() => {
    if (isEditing && editedData?.id_rubro) {
      const rubroId = typeof editedData.id_rubro === 'object'
        ? editedData.id_rubro.id
        : editedData.id_rubro
      if (rubroId) {
        loadSubRubrosData(rubroId)
      }
    }
  }, [isEditing, editedData?.id_rubro])

  const loadDepartamentosData = async () => {
    try {
      const data = await api.getDepartamentos()
      const departamentosArray = Array.isArray(data) ? data : (data?.results || [])
      setDepartamentos(departamentosArray)
    } catch (error) {
      console.error('Error loading departamentos:', error)
    }
  }

  const loadMunicipiosData = async (departamentoId: any) => {
    try {
      setLoadingGeo(true)
      const data = await api.getMunicipiosPorDepartamento(departamentoId)
      const municipiosArray = Array.isArray(data) ? data : (data?.results || [])
      setMunicipios(municipiosArray)
    } catch (error) {
      console.error('Error loading municipios:', error)
    } finally {
      setLoadingGeo(false)
    }
  }

  const loadLocalidadesData = async (municipioId: any) => {
    try {
      setLoadingGeo(true)
      const data = await api.getLocalidadesPorMunicipio(municipioId)
      const localidadesArray = Array.isArray(data) ? data : (data?.results || [])
      setLocalidades(localidadesArray)
    } catch (error) {
      console.error('Error loading localidades:', error)
    } finally {
      setLoadingGeo(false)
    }
  }

  const loadRubrosData = async () => {
    try {
      setLoadingRubros(true)
      const data = await api.getRubros()
      const rubrosArray = Array.isArray(data) ? data : (data?.results || [])
      setRubros(rubrosArray)
    } catch (error) {
      console.error('Error loading rubros:', error)
    } finally {
      setLoadingRubros(false)
    }
  }

  const loadSubRubrosData = async (rubroId: any) => {
    try {
      setLoadingRubros(true)
      const data = await api.getSubRubrosPorRubro(rubroId)
      const subRubrosArray = Array.isArray(data) ? data : (data?.results || [])
      setSubRubros(subRubrosArray)
    } catch (error) {
      console.error('Error loading subrubros:', error)
      setSubRubros([])
    } finally {
      setLoadingRubros(false)
    }
  }

  // Mostrar carga mientras se verifica el usuario
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB]">
        <header className="border-b bg-[#222A59] sticky top-0 z-50 shadow-md">
          <div className="container mx-auto px-4 py-2 md:py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
                <div className="relative w-32 h-10 md:w-40 md:h-12 max-h-[40px] md:max-h-[48px]">
                  <Image
                    src="/logo.png"
                    alt="Logo Catamarca"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 md:py-8">
          <Card className="p-6 md:p-8 text-center">
            <p className="text-lg text-[#6B7280]">Cargando...</p>
          </Card>
        </main>
        {/* Footer */}
        <footer className="bg-[#222A59] text-white py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
              <div>
                <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Contacto</h4>
                <p className="text-white/80 text-sm mb-2">{configuracion.direccion}</p>
                <p className="text-white/80 text-sm mb-2">{configuracion.telefono}</p>
                <p className="text-white/80 text-sm">{configuracion.email_contacto}</p>
              </div>
              <div>
                <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Enlaces Útiles</h4>
                <ul className="space-y-2 text-sm text-white/80">
                  <li>
                    <Link href="/login" className="hover:text-white transition-colors">
                      Iniciar Sesión
                    </Link>
                  </li>
                  <li>
                    <Link href="/registro" className="hover:text-white transition-colors">
                      Registrar Empresa
                    </Link>
                  </li>
                  <li>
                    <Link href="/#beneficios" className="hover:text-white transition-colors">
                      Beneficios
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Redes Sociales</h4>
                <div className="flex gap-4">
                  <a 
                    href="https://www.instagram.com/min.integracionregional.cat?igsh=MTIzdTZkczVpZ2o4bQ=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a 
                    href="https://www.linkedin.com/company/sec-relaciones-internacionales-catamarca/posts/?feedView=all"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-2xl h-auto">
                <img
                  src="/footer.png"
                  alt="Footer Catamarca"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  // Si está cargando, mostrar mensaje
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB]">
        <header className="border-b bg-[#222A59] sticky top-0 z-50 shadow-md">
          <div className="container mx-auto px-4 py-2 md:py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
                <div className="relative w-32 h-10 md:w-40 md:h-12 max-h-[40px] md:max-h-[48px]">
                  <Image
                    src="/logo.png"
                    alt="Logo Catamarca"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 md:py-8">
          <Card className="p-6 md:p-8 text-center">
            <p className="text-lg text-[#6B7280]">Cargando datos de la empresa...</p>
          </Card>
        </main>
      </div>
    )
  }

  // Si no hay datos de empresa, mostrar mensaje
  if (!empresaData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB]">
        <header className="bg-[#222A59] text-white shadow-lg">
          <div className="container mx-auto px-4 py-4 md:py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 md:w-8 md:h-8 text-[#222A59]" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">Perfil de Empresa</h1>
                  <p className="text-xs md:text-sm text-white/80">Dirección de Intercambio Comercial Internacional y Regional</p>
                </div>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm md:text-base"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 md:py-8">
          <Card className="p-6 md:p-8 text-center">
            <p className="text-lg text-[#6B7280]">No se encontraron datos de empresa asociados a tu cuenta.</p>
            <p className="text-sm text-[#6B7280] mt-2">Por favor, contacta al administrador del sistema.</p>
          </Card>
        </main>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB]">
      {/* Header */}
      <header className="border-b bg-[#222A59] sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-2 md:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <div className="relative w-32 h-10 md:w-40 md:h-12 max-h-[40px] md:max-h-[48px]">
                <Image
                  src="/logo.png"
                  alt="Logo Catamarca"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
          <div className="flex gap-2 flex-shrink-0">
              {!isEditing ? (
                <Button
                  onClick={() => {
                    console.log('[Perfil] ===== DATOS COMPLETOS DE EMPRESA =====')
                    console.log('[Perfil] Renderizando con datos de empresa:', empresaData)
                    console.log('[Perfil] Razón Social:', empresaData?.razonSocial)
                    console.log('[Perfil] CUIT:', empresaData?.cuit)
                    console.log('[Perfil] Productos:', empresaData?.productos)
                    console.log('[Perfil] ===== GEOLOCALIZACIÓN =====')
                    console.log('[Perfil] Geolocalización completa:', empresaData?.geolocalizacion)
                    console.log('[Perfil] Tipo:', typeof empresaData?.geolocalizacion)
                    console.log('[Perfil] ¿Es null?', empresaData?.geolocalizacion === null)
                    console.log('[Perfil] ¿Es undefined?', empresaData?.geolocalizacion === undefined)
                    if (empresaData?.geolocalizacion && typeof empresaData.geolocalizacion === 'object') {
                      console.log('[Perfil] Geolocalización lat:', empresaData.geolocalizacion.lat, 'tipo:', typeof empresaData.geolocalizacion.lat)
                      console.log('[Perfil] Geolocalización lng:', empresaData.geolocalizacion.lng, 'tipo:', typeof empresaData.geolocalizacion.lng)
                    }
                    // Preparar datos para edición, asegurando que todos los campos estén presentes
                    const dataToEdit = {
                      ...empresaData,
                      nombreFantasia: empresaData?.nombreFantasia || '',
                      tipoSociedad: empresaData?.tipoSociedad || '',
                      direccion: empresaData?.direccion || '',
                      codigoPostal: empresaData?.codigoPostal || '',
                      provincia: empresaData?.provincia || '',
                      departamento: empresaData?.departamento || '',
                      municipio: empresaData?.municipio || '',
                      localidad: empresaData?.localidad || '',
                      telefono: empresaData?.telefono || '',
                      paginaWeb: empresaData?.paginaWeb || '',
                      rubro: empresaData?.rubro || '',
                      subRubro: empresaData?.subRubro || '',
                      descripcionActividad: empresaData?.descripcionActividad || '',
                      productos: empresaData?.productos || [],
                      contactos: empresaData?.contactos || [],
                      certificaciones: empresaData?.certificaciones || [],
                      instagram: empresaData?.instagram || '',
                      facebook: empresaData?.facebook || '',
                      linkedin: empresaData?.linkedin || '',
                      exporta: empresaData?.exporta || false,
                      destinosExportacion: empresaData?.destinosExportacion || [],
                      importa: empresaData?.importa || false,
                      tipoImportacion: empresaData?.tipoImportacion || '',
                      certificadoMiPyme: empresaData?.certificadoMiPyme || false,
                      materialPromocion2Idiomas: empresaData?.materialPromocion2Idiomas || false,
                      idiomasTrabajo: empresaData?.idiomasTrabajo || '',
                      observaciones: empresaData?.observaciones || '',
                      feriasAsistidas: empresaData?.feriasAsistidas || [],
                      geolocalizacion: empresaData?.geolocalizacion ? {
                        lat: empresaData.geolocalizacion.lat || null,
                        lng: empresaData.geolocalizacion.lng || null
                      } : null,
                    }
                    setIsEditing(true)
                    setEditedData(dataToEdit)
                  }}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm md:text-base"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      setEditedData(null)
                    }}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm md:text-base"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!solicitudId) {
                        toast({
                          title: "Error",
                          description: "No se pudo obtener el ID de la solicitud. Por favor, recarga la página.",
                          variant: "destructive",
                        })
                        return
                      }
                      
                      try {
                        setIsSaving(true)
                        
                        // Preparar datos para enviar al backend
                        const updateData: any = {
                          razon_social: editedData.razon_social || editedData.razonSocial || empresaData?.razon_social || empresaData?.razonSocial,
                          nombre_fantasia: editedData.nombre_fantasia || editedData.nombreFantasia || null,
                          tipo_sociedad: editedData.tipo_sociedad || editedData.tipoSociedad || null,
                          direccion: editedData.direccion || '',
                          codigo_postal: editedData.codigo_postal || editedData.codigoPostal || null,
                          direccion_comercial: editedData.direccion_comercial || editedData.direccionComercial || null,
                          codigo_postal_comercial: editedData.codigo_postal_comercial || editedData.codigoPostalComercial || null,
                          // Normalizar relaciones a IDs
                          departamento: typeof editedData.departamento === 'object' 
                            ? editedData.departamento.id 
                            : editedData.departamento || null,
                          municipio: editedData.municipio 
                            ? (typeof editedData.municipio === 'object' 
                                ? editedData.municipio.id 
                                : editedData.municipio)
                            : null,
                          localidad: editedData.localidad 
                            ? (typeof editedData.localidad === 'object' 
                                ? editedData.localidad.id 
                                : editedData.localidad)
                            : null,
                          geolocalizacion: editedData.geolocalizacion && 
                            editedData.geolocalizacion.lat !== null && 
                            editedData.geolocalizacion.lat !== undefined &&
                            editedData.geolocalizacion.lng !== null && 
                            editedData.geolocalizacion.lng !== undefined ? 
                            `${editedData.geolocalizacion.lat},${editedData.geolocalizacion.lng}` : 
                            (empresaData?.geolocalizacion && 
                              empresaData.geolocalizacion.lat !== null && 
                              empresaData.geolocalizacion.lng !== null ?
                              `${empresaData.geolocalizacion.lat},${empresaData.geolocalizacion.lng}` : 
                              null),
                          telefono: (editedData.telefono && editedData.telefono.trim() !== '') ? editedData.telefono.trim() : (empresaData?.telefono || ''),
                          correo: editedData.correo || editedData.email || empresaData?.correo || empresaData?.email,
                          sitioweb: editedData.sitioweb || editedData.paginaWeb || null,
                          // Normalizar rubro y subrubro a IDs
                          id_rubro: typeof editedData.id_rubro === 'object' 
                            ? editedData.id_rubro.id 
                            : editedData.id_rubro || editedData.rubro || null,
                          id_subrubro: editedData.id_subrubro 
                            ? (typeof editedData.id_subrubro === 'object' 
                                ? editedData.id_subrubro.id 
                                : editedData.id_subrubro)
                            : editedData.subRubro || null,
                          descripcion_actividad: editedData.descripcionActividad || null,
                          // Redes sociales - pueden venir como objeto o campos individuales
                          instagram: editedData.instagram || (editedData.redes_sociales?.instagram) || null,
                          facebook: editedData.facebook || (editedData.redes_sociales?.facebook) || null,
                          linkedin: editedData.linkedin || (editedData.redes_sociales?.linkedin) || null,
                          exporta: editedData.exporta ? (typeof editedData.exporta === 'string' ? editedData.exporta : 'Sí') : 'No, solo ventas nacionales',
                          destinoexporta: editedData.destinosExportacion || editedData.destinoexporta ? 
                            (Array.isArray(editedData.destinosExportacion) ? 
                              editedData.destinosExportacion.join(', ') : 
                              (typeof editedData.destinosExportacion === 'string' ? editedData.destinosExportacion : 
                               (editedData.destinoexporta || String(editedData.destinosExportacion || '')))) : null,
                          importa: editedData.importa === true || editedData.importa === 'si' || editedData.importa === 'Sí',
                          interes_exportar: editedData.interes_exportar === true || editedData.interes_exportar === 'si',
                          tipo_importacion: editedData.tipoImportacion || null,
                          certificado_pyme: editedData.certificadoMiPyme ? (typeof editedData.certificadoMiPyme === 'string' ? editedData.certificadoMiPyme : 'si') : 'no',
                          certificaciones: editedData.certificaciones ? 
                            Array.isArray(editedData.certificaciones) ? 
                              editedData.certificaciones.join(', ') : 
                              editedData.certificaciones : null,
                          material_promocional_idiomas: editedData.materialPromocion2Idiomas ? (typeof editedData.materialPromocion2Idiomas === 'string' ? editedData.materialPromocion2Idiomas : 'si') : 'no',
                          idiomas_trabajo: editedData.idiomasTrabajo || null,
                          observaciones: editedData.observaciones || null,
                        }
                        
                        // Preparar contacto principal - SIEMPRE debe existir y tener teléfono
                        let contactoPrincipal = null
                        
                        // Primero buscar en editedData
                        if (editedData.contactos && editedData.contactos.length > 0) {
                          contactoPrincipal = editedData.contactos.find((c: any) => c.tipo === 'Principal')
                        }
                        
                        // Si no está en editedData, usar el original
                        if (!contactoPrincipal) {
                          contactoPrincipal = empresaData.contactos?.find((c: any) => c.tipo === 'Principal')
                        }
                        
                        // Validar que existe y tiene datos requeridos
                        if (!contactoPrincipal) {
                          throw new Error('No se encontró el contacto principal. Por favor, recarga la página.')
                        }
                        
                        // Validar y preparar teléfono - debe ser un string no vacío
                        let telefonoValue = contactoPrincipal.telefono
                        
                        // Si el teléfono está vacío, null o undefined, usar el original de empresaData
                        if (!telefonoValue || telefonoValue === '' || telefonoValue === null || telefonoValue === undefined) {
                          const contactoOriginal = empresaData.contactos?.find((c: any) => c.tipo === 'Principal')
                          telefonoValue = contactoOriginal?.telefono || ''
                        }
                        
                        // Convertir a string y limpiar
                        telefonoValue = String(telefonoValue || '').trim()
                        
                        // Validar que después de limpiar no esté vacío
                        if (!telefonoValue || telefonoValue === '') {
                          console.error('[Perfil] Teléfono del contacto principal vacío después de limpiar:', {
                            'contactoPrincipal.telefono': contactoPrincipal.telefono,
                            'contactoPrincipal': contactoPrincipal,
                            'empresaData.contactos': empresaData.contactos,
                            'contactoOriginal': empresaData.contactos?.find((c: any) => c.tipo === 'Principal')
                          })
                          throw new Error('El teléfono del contacto principal es obligatorio y no puede estar vacío. Por favor, ingresa un teléfono válido.')
                        }
                        
                        // Validar y preparar nombre
                        let nombreValue = contactoPrincipal.nombre
                        if (nombreValue === null || nombreValue === undefined) {
                          const contactoOriginal = empresaData.contactos?.find((c: any) => c.tipo === 'Principal')
                          nombreValue = contactoOriginal?.nombre || ''
                        }
                        nombreValue = String(nombreValue || '').trim()
                        
                        if (!nombreValue || nombreValue === '') {
                          throw new Error('El nombre del contacto principal es obligatorio y no puede estar vacío')
                        }
                        
                        // Preparar datos del contacto principal - SIEMPRE enviar ambos formatos
                        const emailContacto = contactoPrincipal.email || empresaData.contactos?.find((c: any) => c.tipo === 'Principal')?.email || ''
                        
                        // Formato anidado (para el serializer)
                        updateData.contacto_principal = {
                          nombre: nombreValue,
                          cargo: contactoPrincipal.cargo ? String(contactoPrincipal.cargo).trim() : '',
                          telefono: telefonoValue,
                          email: emailContacto, // Read-only pero necesario para estructura
                        }
                        
                        // Formato plano (para el serializer también)
                        updateData.nombre_contacto = nombreValue
                        updateData.cargo_contacto = contactoPrincipal.cargo ? String(contactoPrincipal.cargo).trim() : ''
                        updateData.telefono_contacto = telefonoValue
                        
                        // Asegurarse de que el teléfono no esté vacío
                        if (!updateData.telefono_contacto || updateData.telefono_contacto.trim() === '') {
                          console.error('[Perfil] ERROR: Teléfono vacío antes de enviar:', {
                            telefonoValue,
                            contactoPrincipal,
                            empresaDataContacto: empresaData.contactos?.find((c: any) => c.tipo === 'Principal')
                          })
                          throw new Error('El teléfono del contacto principal no puede estar vacío. Por favor, verifica los datos.')
                        }
                        
                        console.log('[Perfil] Guardando cambios:', editedData)
                        console.log('[Perfil] Contacto principal preparado:', {
                          nombre: updateData.nombre_contacto,
                          cargo: updateData.cargo_contacto,
                          telefono: updateData.telefono_contacto,
                          email: emailContacto,
                          'contacto_principal': updateData.contacto_principal
                        })
                        
                        // Preparar contactos secundarios
                        const contactosSecundarios = editedData.contactos ? 
                          editedData.contactos
                            .filter((c: any) => c.tipo === 'Secundario')
                            .map((c: any) => ({
                              nombre: c.nombre || '',
                              cargo: c.cargo || '',
                              telefono: c.telefono || '',
                              email: c.email || '',
                            })) : []
                        updateData.contactos_secundarios = contactosSecundarios
                        
                        // Preparar productos - mapear de camelCase a snake_case
                        updateData.productos = (editedData.productos || []).map((producto: any) => {
                          const productData: any = {
                            nombre_producto: producto.nombre_producto || producto.nombre || '',
                            descripcion: producto.descripcion || '',
                            capacidad_productiva: producto.capacidad_productiva || producto.capacidadProductiva || null,
                            unidad_medida: producto.unidad_medida || producto.unidadMedida || 'kg',
                            periodo_capacidad: producto.periodo_capacidad || producto.periodoCapacidad || 'mensual',
                          }
                          // Posición arancelaria puede ser objeto o string
                          if (producto.posicion_arancelaria) {
                            if (typeof producto.posicion_arancelaria === 'object') {
                              productData.posicion_arancelaria_codigo = producto.posicion_arancelaria.codigo_arancelario || ''
                            } else {
                              productData.posicion_arancelaria_codigo = producto.posicion_arancelaria || producto.posicionArancelaria || ''
                            }
                          }
                          return productData
                        })
                        
                        // Preparar servicios
                        if (editedData.servicios || editedData.servicios_ofrecidos) {
                          const servicios = editedData.servicios || editedData.servicios_ofrecidos || []
                          updateData.servicios = Array.isArray(servicios) ? servicios.map((servicio: any) => ({
                            nombre_servicio: servicio.nombre_servicio || servicio.nombre || '',
                            descripcion: servicio.descripcion || '',
                            tipo_servicio: Array.isArray(servicio.tipo_servicio) ? servicio.tipo_servicio.join(', ') : (servicio.tipo_servicio || ''),
                            sector_atendido: servicio.sector_atendido || (Array.isArray(servicio.sectores) ? servicio.sectores.join(', ') : servicio.sectores || ''),
                            alcance_geografico: servicio.alcance_geografico || servicio.alcance_servicio || 'local',
                            forma_contratacion: Array.isArray(servicio.forma_contratacion) ? servicio.forma_contratacion.join(', ') : (servicio.forma_contratacion || 'hora'),
                          })) : []
                        }
                        
                        // Preparar actividades de promoción internacional
                        updateData.actividades_promocion_internacional = editedData.actividades_promocion_internacional || editedData.feriasAsistidas || []
                        
                        console.log('[Perfil] Datos a enviar:', JSON.stringify(updateData, null, 2))
                        console.log('[Perfil] Verificando teléfono antes de enviar:', {
                          'telefono_contacto': updateData.telefono_contacto,
                          'tipo': typeof updateData.telefono_contacto,
                          'longitud': updateData.telefono_contacto?.length,
                          'contacto_principal.telefono': updateData.contacto_principal?.telefono,
                          'contacto_principal': updateData.contacto_principal
                        })
                        
                        // Enviar actualización - usar el endpoint de empresa si tenemos el ID
                        let updated
                        if (solicitudId) {
                          // Intentar actualizar usando el endpoint de empresa
                          try {
                            updated = await api.updateEmpresa(solicitudId, updateData)
                          } catch (error) {
                            // Fallback: usar el endpoint de solicitud si falla
                            console.warn('[Perfil] Error actualizando empresa, intentando con solicitud:', error)
                            updated = await api.updatePerfil(solicitudId, updateData)
                          }
                        } else {
                          // Si no hay ID, usar el endpoint de solicitud
                          const perfilCompleto = await api.getMiPerfil()
                          if (perfilCompleto && perfilCompleto.id) {
                            updated = await api.updatePerfil(perfilCompleto.id, updateData)
                          } else {
                            throw new Error('No se pudo obtener el ID de la empresa o solicitud')
                          }
                        }
                        console.log('[Perfil] Actualización exitosa:', updated)
                        
                        // Recargar datos
                        const userData = await api.getCurrentUser()
                        if (userData.empresa) {
                          setEmpresaData(userData.empresa)
                        }
                        
                        setIsEditing(false)
                        setEditedData(null)
                        toast({
                          title: "Éxito",
                          description: "Perfil actualizado exitosamente",
                        })
                      } catch (error: any) {
                        console.error('[Perfil] Error al guardar:', error)
                        console.error('[Perfil] Error completo:', JSON.stringify(error, null, 2))
                        
                        // Mostrar error detallado
                        let errorMessage = error.message || 'Error desconocido'
                        if (error.message && error.message.includes('\n')) {
                          // Si hay múltiples errores, mostrarlos todos
                          errorMessage = error.message.split('\n').join(' ')
                        }
                        
                        toast({
                          title: "Error al guardar",
                          description: errorMessage,
                          variant: "destructive",
                        })
                      } finally {
                        setIsSaving(false)
                      }
                    }}
                    variant="outline"
                    disabled={isSaving}
                    className="bg-green-500/20 border-green-500/50 text-white hover:bg-green-500/30 text-sm md:text-base disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </>
              )}
              <Button
                onClick={logout}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm md:text-base"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Company Header */}
        <Card className="p-6 md:p-8 mb-6 bg-gradient-to-r from-[#3259B5] to-[#629BD2] text-white">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{empresaData?.razonSocial || 'Empresa'}</h2>
              {empresaData.nombreFantasia && (
                <p className="text-sm md:text-base text-white/80 mb-2">Nombre de Fantasía: {empresaData.nombreFantasia}</p>
              )}
              <p className="text-sm md:text-base text-white/90 mb-4">CUIT: {empresaData.cuit || 'N/A'}</p>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="inline-flex w-full sm:w-auto overflow-x-auto gap-2 flex-nowrap">
            <TabsTrigger value="general" className="flex-shrink-0">Información General</TabsTrigger>
            <TabsTrigger value="ubicacion" className="flex-shrink-0">Ubicación</TabsTrigger>
            <TabsTrigger value="comercial" className="flex-shrink-0">Actividad Comercial</TabsTrigger>
            <TabsTrigger value="productos-servicios" className="flex-shrink-0">Productos/Servicios</TabsTrigger>
            <TabsTrigger value="certificaciones" className="flex-shrink-0">Certificaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Datos de la Empresa</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Razón Social */}
                <div>
                  <Label>Razón Social</Label>
                  {isEditing ? (
                    <Input
                      value={editedData?.razon_social || editedData?.razonSocial || ''}
                      onChange={(e) => setEditedData(editedData ? { ...editedData, razon_social: e.target.value, razonSocial: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{empresaData?.razon_social || empresaData?.razonSocial}</p>
                  )}
                </div>

                {/* Nombre de Fantasía */}
                <div>
                  <Label>Nombre de Fantasía</Label>
                  {isEditing ? (
                    <Input
                      value={editedData?.nombre_fantasia || editedData?.nombreFantasia || ''}
                      onChange={(e) => setEditedData(editedData ? { ...editedData, nombre_fantasia: e.target.value, nombreFantasia: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{empresaData?.nombre_fantasia || empresaData?.nombreFantasia || 'N/A'}</p>
                  )}
                </div>

                {/* CUIT */}
                <div>
                  <Label>CUIT</Label>
                  {isEditing ? (
                    <Input
                      value={editedData?.cuit_cuil || editedData?.cuit || ''}
                      onChange={(e) => setEditedData(editedData ? { ...editedData, cuit_cuil: e.target.value, cuit: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{empresaData?.cuit_cuil || empresaData?.cuit}</p>
                  )}
                </div>

                {/* Tipo de Sociedad */}
                <div>
                  <Label>Tipo de Sociedad</Label>
                  {isEditing ? (
                    <Select
                      value={editedData?.tipo_sociedad || editedData?.tipoSociedad || ''}
                      onValueChange={(value) => setEditedData(editedData ? { ...editedData, tipo_sociedad: value, tipoSociedad: value } : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="S.A.">Sociedad Anónima (S.A.)</SelectItem>
                        <SelectItem value="S.R.L.">Sociedad de Responsabilidad Limitada (S.R.L.)</SelectItem>
                        <SelectItem value="S.C.S.">Sociedad en Comandita Simple (S.C.S.)</SelectItem>
                        <SelectItem value="S.C.A.">Sociedad en Comandita por Acciones (S.C.A.)</SelectItem>
                        <SelectItem value="S.C.">Sociedad Colectiva (S.C.)</SelectItem>
                        <SelectItem value="A.E.">Asociación Empresaria (A.E.)</SelectItem>
                        <SelectItem value="Monotributo">Monotributo</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-semibold">{empresaData?.tipo_sociedad || empresaData?.tipoSociedad || 'N/A'}</p>
                  )}
                </div>

                {/* Rubro */}
                <div>
                  <Label>Rubro</Label>
                  {isEditing ? (
                    <Select
                      value={editedData?.id_rubro ? String(typeof editedData.id_rubro === 'object' ? editedData.id_rubro.id : editedData.id_rubro) : ''}
                      onValueChange={(value) => {
                        setEditedData(editedData ? { 
                          ...editedData, 
                          id_rubro: parseInt(value),
                          id_subrubro: null
                        } : null)
                        loadSubRubrosData(parseInt(value))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rubro" />
                      </SelectTrigger>
                      <SelectContent>
                        {rubros.map((rubro) => (
                          <SelectItem key={rubro.id} value={String(rubro.id)}>
                            {rubro.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-semibold">
                      {empresaData?.rubro_nombre || 
                       (typeof empresaData?.id_rubro === 'object' ? empresaData.id_rubro.nombre : empresaData?.id_rubro) || 
                       empresaData?.rubro || 
                       'N/A'}
                    </p>
                  )}
                </div>

                {/* SubRubro */}
                <div>
                  <Label>SubRubro</Label>
                  {isEditing ? (
                    <Select
                      value={editedData?.id_subrubro 
                        ? String(typeof editedData.id_subrubro === 'object' ? editedData.id_subrubro.id : editedData.id_subrubro)
                        : ''}
                      onValueChange={(value) => {
                        setEditedData(editedData ? { 
                          ...editedData, 
                          id_subrubro: parseInt(value)
                        } : null)
                      }}
                      disabled={loadingRubros || !editedData?.id_rubro || subRubros.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          loadingRubros 
                            ? "Cargando..." 
                            : !editedData?.id_rubro 
                            ? "Selecciona primero un rubro" 
                            : subRubros.length === 0 
                            ? "No hay subrubros disponibles" 
                            : "Selecciona un subrubro"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {subRubros.length > 0 ? (
                          subRubros.map((subRubro) => (
                            <SelectItem key={subRubro.id} value={String(subRubro.id)}>
                              {subRubro.nombre}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No hay subrubros disponibles
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-semibold">
                      {empresaData?.sub_rubro_nombre || 
                       (typeof empresaData?.id_subrubro === 'object' 
                         ? empresaData.id_subrubro.nombre 
                         : empresaData?.id_subrubro) || 
                       empresaData?.subRubro || 
                       'N/A'}
                    </p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <Label>Teléfono</Label>
                  {isEditing ? (
                    <Input
                      value={editedData?.telefono || ''}
                      onChange={(e) => setEditedData(editedData ? { ...editedData, telefono: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{empresaData?.telefono || 'N/A'}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedData?.correo || editedData?.email || ''}
                      onChange={(e) => setEditedData(editedData ? { ...editedData, correo: e.target.value, email: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{empresaData?.correo || empresaData?.email || 'N/A'}</p>
                  )}
                </div>

                {/* Sitio Web */}
                <div>
                  <Label>Sitio Web</Label>
                  {isEditing ? (
                    <Input
                      type="url"
                      value={editedData?.sitioweb || editedData?.paginaWeb || ''}
                      onChange={(e) => setEditedData(editedData ? { ...editedData, sitioweb: e.target.value, paginaWeb: e.target.value } : null)}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">
                      {(empresaData?.sitioweb || empresaData?.paginaWeb) ? (
                        <a href={empresaData.sitioweb || empresaData.paginaWeb} target="_blank" rel="noopener noreferrer" className="text-[#3259B5] hover:underline">
                          {empresaData.sitioweb || empresaData.paginaWeb}
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </p>
                  )}
                </div>

                {/* Redes Sociales */}
                {(empresaData?.instagram || empresaData?.facebook || empresaData?.linkedin || isEditing) && (
                  <div className="md:col-span-2">
                    <Label>Redes Sociales</Label>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Instagram</span>
                        {isEditing ? (
                          <Input
                            value={editedData?.instagram || ''}
                            onChange={(e) => setEditedData(editedData ? { ...editedData, instagram: e.target.value } : null)}
                            placeholder="usuario o URL"
                          />
                        ) : (
                          empresaData?.instagram ? (
                            <a href={empresaData.instagram.startsWith('http') ? empresaData.instagram : `https://instagram.com/${empresaData.instagram}`} 
                               target="_blank" rel="noopener noreferrer" 
                               className="text-[#3259B5] hover:underline block mt-1">
                              {empresaData.instagram}
                            </a>
                          ) : (
                            <p className="mt-1 font-semibold">N/A</p>
                          )
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Facebook</span>
                        {isEditing ? (
                          <Input
                            value={editedData?.facebook || ''}
                            onChange={(e) => setEditedData(editedData ? { ...editedData, facebook: e.target.value } : null)}
                            placeholder="usuario o URL"
                          />
                        ) : (
                          empresaData?.facebook ? (
                            <a href={empresaData.facebook.startsWith('http') ? empresaData.facebook : `https://facebook.com/${empresaData.facebook}`} 
                               target="_blank" rel="noopener noreferrer" 
                               className="text-[#3259B5] hover:underline block mt-1">
                              {empresaData.facebook}
                            </a>
                          ) : (
                            <p className="mt-1 font-semibold">N/A</p>
                          )
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">LinkedIn</span>
                        {isEditing ? (
                          <Input
                            value={editedData?.linkedin || ''}
                            onChange={(e) => setEditedData(editedData ? { ...editedData, linkedin: e.target.value } : null)}
                            placeholder="usuario o URL"
                          />
                        ) : (
                          empresaData?.linkedin ? (
                            <a href={empresaData.linkedin.startsWith('http') ? empresaData.linkedin : `https://linkedin.com/company/${empresaData.linkedin}`} 
                               target="_blank" rel="noopener noreferrer" 
                               className="text-[#3259B5] hover:underline block mt-1">
                              {empresaData.linkedin}
                            </a>
                          ) : (
                            <p className="mt-1 font-semibold">N/A</p>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contacto Principal */}
                {(empresaData?.contacto_principal_nombre || empresaData?.contacto_principal_cargo || empresaData?.contacto_principal_telefono || empresaData?.contacto_principal_email || 
                  (empresaData?.contactos && empresaData.contactos.length > 0) || isEditing) && (
                  <div className="md:col-span-2">
                    <Label>Contacto Principal</Label>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                      {(() => {
                        const contactoPrincipal = empresaData?.contactos?.find((c: any) => c.tipo === 'Principal') || {
                          nombre: empresaData?.contacto_principal_nombre || '',
                          cargo: empresaData?.contacto_principal_cargo || '',
                          telefono: empresaData?.contacto_principal_telefono || '',
                          email: empresaData?.contacto_principal_email || empresaData?.correo || empresaData?.email || ''
                        }
                        return (
                          <>
                            <div>
                              <span className="text-sm text-muted-foreground">Nombre</span>
                              {isEditing ? (
                                <Input
                                  value={editedData?.contactos?.find((c: any) => c.tipo === 'Principal')?.nombre || contactoPrincipal.nombre || ''}
                                  onChange={(e) => {
                                    const contactos = editedData?.contactos || []
                                    const principalIndex = contactos.findIndex((c: any) => c.tipo === 'Principal')
                                    if (principalIndex >= 0) {
                                      const newContactos = [...contactos]
                                      newContactos[principalIndex] = { ...newContactos[principalIndex], nombre: e.target.value }
                                      setEditedData({ ...editedData, contactos: newContactos })
                                    } else {
                                      setEditedData({ ...editedData, contactos: [...contactos, { tipo: 'Principal', nombre: e.target.value, cargo: '', telefono: '', email: '' }] })
                                    }
                                  }}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{contactoPrincipal.nombre || 'N/A'}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Cargo</span>
                              {isEditing ? (
                                <Input
                                  value={editedData?.contactos?.find((c: any) => c.tipo === 'Principal')?.cargo || contactoPrincipal.cargo || ''}
                                  onChange={(e) => {
                                    const contactos = editedData?.contactos || []
                                    const principalIndex = contactos.findIndex((c: any) => c.tipo === 'Principal')
                                    if (principalIndex >= 0) {
                                      const newContactos = [...contactos]
                                      newContactos[principalIndex] = { ...newContactos[principalIndex], cargo: e.target.value }
                                      setEditedData({ ...editedData, contactos: newContactos })
                                    } else {
                                      setEditedData({ ...editedData, contactos: [...contactos, { tipo: 'Principal', nombre: '', cargo: e.target.value, telefono: '', email: '' }] })
                                    }
                                  }}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{contactoPrincipal.cargo || 'N/A'}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Teléfono</span>
                              {isEditing ? (
                                <Input
                                  value={editedData?.contactos?.find((c: any) => c.tipo === 'Principal')?.telefono || contactoPrincipal.telefono || ''}
                                  onChange={(e) => {
                                    const contactos = editedData?.contactos || []
                                    const principalIndex = contactos.findIndex((c: any) => c.tipo === 'Principal')
                                    if (principalIndex >= 0) {
                                      const newContactos = [...contactos]
                                      newContactos[principalIndex] = { ...newContactos[principalIndex], telefono: e.target.value }
                                      setEditedData({ ...editedData, contactos: newContactos })
                                    } else {
                                      setEditedData({ ...editedData, contactos: [...contactos, { tipo: 'Principal', nombre: '', cargo: '', telefono: e.target.value, email: '' }] })
                                    }
                                  }}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{contactoPrincipal.telefono || 'N/A'}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Email</span>
                              {isEditing ? (
                                <Input
                                  type="email"
                                  value={editedData?.contactos?.find((c: any) => c.tipo === 'Principal')?.email || contactoPrincipal.email || ''}
                                  onChange={(e) => {
                                    const contactos = editedData?.contactos || []
                                    const principalIndex = contactos.findIndex((c: any) => c.tipo === 'Principal')
                                    if (principalIndex >= 0) {
                                      const newContactos = [...contactos]
                                      newContactos[principalIndex] = { ...newContactos[principalIndex], email: e.target.value }
                                      setEditedData({ ...editedData, contactos: newContactos })
                                    } else {
                                      setEditedData({ ...editedData, contactos: [...contactos, { tipo: 'Principal', nombre: '', cargo: '', telefono: '', email: e.target.value }] })
                                    }
                                  }}
                                  disabled
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{contactoPrincipal.email || 'N/A'}</p>
                              )}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ubicacion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Ubicación</CardTitle>
                <CardDescription>Dirección, código postal, departamento, municipio, localidad y geolocalización</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Domicilio del Establecimiento Productivo */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Domicilio del Establecimiento Productivo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dirección */}
                    <div>
                      <Label>Dirección</Label>
                      {isEditing ? (
                        <Input
                          value={editedData?.direccion || ''}
                          onChange={(e) => setEditedData(editedData ? { ...editedData, direccion: e.target.value } : null)}
                          placeholder="Calle y número"
                        />
                      ) : (
                        <p className="mt-1 font-semibold">{empresaData?.direccion || 'N/A'}</p>
                      )}
                    </div>

                    {/* Código Postal */}
                    <div>
                      <Label>Código Postal</Label>
                      {isEditing ? (
                        <Input
                          value={editedData?.codigo_postal || editedData?.codigoPostal || ''}
                          onChange={(e) => setEditedData(editedData ? { ...editedData, codigo_postal: e.target.value, codigoPostal: e.target.value } : null)}
                          placeholder="Ej: 4700"
                        />
                      ) : (
                        <p className="mt-1 font-semibold">{empresaData?.codigo_postal || empresaData?.codigoPostal || 'N/A'}</p>
                      )}
                    </div>

                    {/* Departamento */}
                    <div>
                      <Label>Departamento</Label>
                      {isEditing ? (
                        <Select
                          value={editedData?.departamento ? String(typeof editedData.departamento === 'object' ? editedData.departamento.id : editedData.departamento) : ''}
                          onValueChange={(value) => {
                            setEditedData(editedData ? { 
                              ...editedData, 
                              departamento: parseInt(value),
                              municipio: null,
                              localidad: null
                            } : null)
                            loadMunicipiosData(parseInt(value))
                            setMunicipios([])
                            setLocalidades([])
                          }}
                          disabled={loadingGeo}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingGeo ? "Cargando..." : "Selecciona un departamento"} />
                          </SelectTrigger>
                          <SelectContent>
                            {departamentos.length > 0 ? (
                              departamentos.map((depto) => (
                                <SelectItem key={depto.id} value={String(depto.id)}>
                                  {depto.nomdpto || depto.nombre}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No hay departamentos disponibles</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1 font-semibold">
                          {empresaData?.departamento_nombre || 
                           (typeof empresaData?.departamento === 'object' ? (empresaData.departamento.nomdpto || empresaData.departamento.nombre) : empresaData?.departamento) || 
                           'N/A'}
                        </p>
                      )}
                    </div>

                    {/* Municipio */}
                    <div>
                      <Label>Municipio</Label>
                      {isEditing ? (
                        <Select
                          value={editedData?.municipio ? String(typeof editedData.municipio === 'object' ? editedData.municipio.id : editedData.municipio) : ''}
                          onValueChange={(value) => {
                            setEditedData(editedData ? { 
                              ...editedData, 
                              municipio: parseInt(value),
                              localidad: null
                            } : null)
                            loadLocalidadesData(parseInt(value))
                            setLocalidades([])
                          }}
                          disabled={loadingGeo || !editedData?.departamento || municipios.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loadingGeo ? "Cargando..." : 
                              !editedData?.departamento ? "Selecciona primero un departamento" :
                              municipios.length === 0 ? "No hay municipios disponibles" :
                              "Selecciona un municipio"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {municipios.length > 0 ? (
                              municipios.map((mun) => (
                                <SelectItem key={mun.id} value={String(mun.id)}>
                                  {mun.nommun || mun.nombre}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No hay municipios disponibles</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1 font-semibold">
                          {empresaData?.municipio_nombre || 
                           (typeof empresaData?.municipio === 'object' ? (empresaData.municipio.nommun || empresaData.municipio.nombre) : empresaData?.municipio) || 
                           'N/A'}
                        </p>
                      )}
                    </div>

                    {/* Localidad */}
                    <div>
                      <Label>Localidad</Label>
                      {isEditing ? (
                        <Select
                          value={editedData?.localidad ? String(typeof editedData.localidad === 'object' ? editedData.localidad.id : editedData.localidad) : ''}
                          onValueChange={(value) => {
                            setEditedData(editedData ? { ...editedData, localidad: parseInt(value) } : null)
                          }}
                          disabled={loadingGeo || !editedData?.municipio || localidades.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loadingGeo ? "Cargando..." : 
                              !editedData?.municipio ? "Selecciona primero un municipio" :
                              localidades.length === 0 ? "No hay localidades disponibles" :
                              "Selecciona una localidad"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {localidades.length > 0 ? (
                              localidades.map((loc) => (
                                <SelectItem key={loc.id} value={String(loc.id)}>
                                  {loc.nomloc || loc.nombre}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No hay localidades disponibles</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1 font-semibold">
                          {empresaData?.localidad_nombre || 
                           (typeof empresaData?.localidad === 'object' ? (empresaData.localidad.nomloc || empresaData.localidad.nombre) : empresaData?.localidad) || 
                           'N/A'}
                        </p>
                      )}
                    </div>

                    {/* Geolocalización / Mapa */}
                    {empresaData?.geolocalizacion && (() => {
                      const geoString = empresaData.geolocalizacion
                      let coordinates: { lat: number; lng: number } | null = null
                      if (typeof geoString === 'string' && geoString.trim()) {
                        try {
                          const parts = geoString.split(',').map(v => parseFloat(v.trim()))
                          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                            coordinates = { lat: parts[0], lng: parts[1] }
                          }
                        } catch (error) {
                          console.error('Error parsing geolocalizacion:', error)
                        }
                      } else if (typeof geoString === 'object' && geoString.lat && geoString.lng) {
                        coordinates = { lat: geoString.lat, lng: geoString.lng }
                      }
                      return coordinates ? (
                        <div className="md:col-span-2">
                          <Label>Ubicación en el Mapa</Label>
                          <div className="mt-2 relative z-0">
                            {isEditing ? (
                              <LocationPicker
                                value={(() => {
                                  if (editedData?.geolocalizacion && 
                                      editedData.geolocalizacion.lat !== null && 
                                      editedData.geolocalizacion.lat !== undefined &&
                                      editedData.geolocalizacion.lng !== null && 
                                      editedData.geolocalizacion.lng !== undefined) {
                                    return `${editedData.geolocalizacion.lat},${editedData.geolocalizacion.lng}`
                                  }
                                  if (empresaData?.geolocalizacion && 
                                      empresaData.geolocalizacion.lat !== null && 
                                      empresaData.geolocalizacion.lat !== undefined &&
                                      empresaData.geolocalizacion.lng !== null && 
                                      empresaData.geolocalizacion.lng !== undefined) {
                                    return `${empresaData.geolocalizacion.lat},${empresaData.geolocalizacion.lng}`
                                  }
                                  return ''
                                })()}
                                onChange={(coords) => {
                                  const [lat, lng] = coords.split(',').map((v: string) => parseFloat(v.trim()))
                                  if (!isNaN(lat) && !isNaN(lng)) {
                                    setEditedData({ 
                                      ...editedData, 
                                      geolocalizacion: { lat, lng } 
                                    })
                                  }
                                }}
                              />
                            ) : (
                              <CompanyMap
                                coordinates={coordinates}
                                address={empresaData?.direccion || empresaData?.razon_social || empresaData?.razonSocial}
                              />
                            )}
                          </div>
                        </div>
                      ) : null
                    })()}
                  </div>
                </div>

                {/* Domicilio Comercial */}
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-3">Domicilio Comercial</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dirección Comercial */}
                    <div>
                      <Label>Dirección</Label>
                      {isEditing ? (
                        <Input
                          value={editedData?.direccion_comercial || editedData?.direccionComercial || ''}
                          onChange={(e) => setEditedData(editedData ? { ...editedData, direccion_comercial: e.target.value, direccionComercial: e.target.value } : null)}
                          placeholder="Calle y número (opcional)"
                        />
                      ) : (
                        <p className="mt-1 font-semibold">{empresaData?.direccion_comercial || empresaData?.direccionComercial || 'N/A'}</p>
                      )}
                    </div>

                    {/* Código Postal Comercial */}
                    <div>
                      <Label>Código Postal</Label>
                      {isEditing ? (
                        <Input
                          value={editedData?.codigo_postal_comercial || editedData?.codigoPostalComercial || ''}
                          onChange={(e) => setEditedData(editedData ? { ...editedData, codigo_postal_comercial: e.target.value, codigoPostalComercial: e.target.value } : null)}
                          placeholder="Ej: 4700 (opcional)"
                        />
                      ) : (
                        <p className="mt-1 font-semibold">{empresaData?.codigo_postal_comercial || empresaData?.codigoPostalComercial || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comercial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Actividad Comercial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Datos de exportación/importación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>¿Exporta?</Label>
                    {isEditing ? (
                      <Select
                        value={empresaData?.exporta || ''}
                        onValueChange={(value) => setEditedData(editedData ? { ...editedData, exporta: value } : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sí">Sí</SelectItem>
                          <SelectItem value="No, solo ventas nacionales">No</SelectItem>
                          <SelectItem value="En proceso">En proceso</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="mt-1 font-semibold">{empresaData?.exporta || 'N/A'}</p>
                    )}
                  </div>

                  {/* Mostrar "Interés en Exportar" solo si NO exporta */}
                  {(empresaData?.exporta === "No, solo ventas nacionales" || empresaData?.exporta === "No") && (
                    <div>
                      <Label>¿Interés en Exportar?</Label>
                      {isEditing ? (
                        <Select
                          value={empresaData?.interes_exportar ? 'si' : 'no'}
                          onValueChange={(value) => setEditedData(editedData ? { 
                            ...editedData, 
                            interes_exportar: value === 'si' 
                          } : null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="si">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="mt-1 font-semibold">
                          {empresaData?.interes_exportar === true || empresaData?.interes_exportar === 'true' 
                            ? 'Sí' 
                            : empresaData?.interes_exportar === false || empresaData?.interes_exportar === 'false'
                            ? 'No'
                            : 'N/A'}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <Label>Destino de Exportación</Label>
                    {isEditing ? (
                      <Textarea
                        value={empresaData?.destinoexporta || (Array.isArray(empresaData?.destinosExportacion) ? empresaData.destinosExportacion.join(', ') : '') || ''}
                        onChange={(e) => setEditedData(editedData ? { ...editedData, destinoexporta: e.target.value, destinosExportacion: e.target.value.split(',').map((d: string) => d.trim()).filter((d: string) => d) } : null)}
                        rows={3}
                      />
                    ) : (
                      <p className="mt-1 font-semibold">
                        {empresaData?.destinoexporta || (Array.isArray(empresaData?.destinosExportacion) ? empresaData.destinosExportacion.join(', ') : '') || 'N/A'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>¿Importa?</Label>
                    <p className="mt-1 font-semibold">{empresaData?.importa ? 'Sí' : 'No'}</p>
                  </div>
                  <div>
                    <Label>Idiomas de Trabajo</Label>
                    {isEditing ? (
                      <Input
                        value={empresaData?.idiomas_trabaja || empresaData?.idiomasTrabajo || ''}
                        onChange={(e) => setEditedData(editedData ? { ...editedData, idiomas_trabaja: e.target.value, idiomasTrabajo: e.target.value } : null)}
                      />
                    ) : (
                      <p className="mt-1 font-semibold">{empresaData?.idiomas_trabaja || empresaData?.idiomasTrabajo || 'N/A'}</p>
                    )}
                  </div>
                </div>

                {/* Sección de Actividades de Promoción Internacional */}
                <div className="pt-6 border-t">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-[#222A59]">
                      Actividades de Promoción Internacional
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Ferias, misiones comerciales y rondas de negocios en las que ha participado
                    </p>
                  </div>

                  {empresaData?.actividades_promocion_internacional && 
                   Array.isArray(empresaData.actividades_promocion_internacional) && 
                   empresaData.actividades_promocion_internacional.length > 0 ? (
                    <div className="space-y-3">
                      {empresaData.actividades_promocion_internacional.map((actividad: any, index: number) => (
                        <div
                          key={index}
                          className="p-4 border border-[#3259B5]/30 rounded-lg bg-gradient-to-br from-[#3259B5]/5 to-transparent hover:border-[#3259B5]/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {actividad.tipo === 'feria' && (
                                <div className="flex items-center gap-2 text-[#3259B5]">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <span className="font-semibold text-sm">Feria Internacional</span>
                                </div>
                              )}
                              {actividad.tipo === 'mision' && (
                                <div className="flex items-center gap-2 text-[#66A29C]">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-semibold text-sm">Misión Comercial</span>
                                </div>
                              )}
                              {actividad.tipo === 'ronda' && (
                                <div className="flex items-center gap-2 text-[#807DA1]">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <span className="font-semibold text-sm">Ronda de Negocios</span>
                                </div>
                              )}
                            </div>
                            <span className="px-3 py-1 bg-[#222A59] text-white text-xs font-semibold rounded-full">
                              {actividad.anio || 'N/A'}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-xs text-gray-500">Lugar</p>
                                <p className="font-medium text-[#222A59]">{actividad.lugar || 'No especificado'}</p>
                              </div>
                            </div>
                            
                            {actividad.observaciones && (
                              <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-200">
                                <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-500">Observaciones</p>
                                  <p className="text-sm text-gray-700">{actividad.observaciones}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="font-medium text-gray-600">No hay actividades de promoción registradas</p>
                      <p className="text-sm text-gray-500 mt-1">Esta empresa no ha registrado participación en ferias, misiones o rondas</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="productos-servicios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">
                  {empresaData?.tipo_empresa === 'producto' || empresaData?.tipo_empresa_valor === 'producto' ? 'Productos' : 
                   empresaData?.tipo_empresa === 'servicio' || empresaData?.tipo_empresa_valor === 'servicio' ? 'Servicios' : 
                   'Productos y Servicios'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* PRODUCTOS */}
                {(empresaData?.tipo_empresa === 'producto' || empresaData?.tipo_empresa === 'mixta' || empresaData?.tipo_empresa_valor === 'producto' || empresaData?.tipo_empresa_valor === 'mixta') && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Productos</h3>
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newProducto = {
                              id: `temp-${Date.now()}`,
                              nombre_producto: '',
                              descripcion: '',
                              capacidad_productiva: '',
                              unidad_medida: 'kg',
                              periodo_capacidad: 'mensual',
                              es_principal: false,
                            }
                            setEditedData(editedData ? {
                              ...editedData,
                              productos: [...(editedData.productos || []), newProducto]
                            } : null)
                          }}
                          className="gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Agregar Producto
                        </Button>
                      )}
                    </div>

                    {(isEditing ? editedData?.productos : empresaData?.productos) && (isEditing ? editedData.productos : empresaData.productos).length > 0 ? (
                      <div className="space-y-4">
                        {(isEditing ? editedData.productos : empresaData.productos).map((producto: any, index: number) => (
                          <div key={producto.id || index} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                            {isEditing ? (
                              // MODO EDICIÓN
                              <div className="space-y-4">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 space-y-4">
                                    {/* Nombre del Producto */}
                                    <div>
                                      <Label>Nombre del Producto</Label>
                                      <Input
                                        value={producto.nombre_producto || producto.nombre || ''}
                                        onChange={(e) => {
                                          const updatedProductos = [...(editedData?.productos || [])]
                                          updatedProductos[index] = {
                                            ...updatedProductos[index],
                                            nombre_producto: e.target.value,
                                            nombre: e.target.value
                                          }
                                          setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                                        }}
                                        placeholder="Nombre del producto"
                                      />
                                    </div>

                                    {/* Descripción */}
                                    <div>
                                      <Label>Descripción</Label>
                                      <Textarea
                                        value={producto.descripcion || ''}
                                        onChange={(e) => {
                                          const updatedProductos = [...(editedData?.productos || [])]
                                          updatedProductos[index] = {
                                            ...updatedProductos[index],
                                            descripcion: e.target.value
                                          }
                                          setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                                        }}
                                        placeholder="Descripción del producto"
                                        rows={3}
                                      />
                                    </div>

                                    {/* Capacidad Productiva */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                      <div>
                                        <Label>Capacidad Productiva</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={producto.capacidad_productiva || producto.capacidadProductiva || ''}
                                          onChange={(e) => {
                                            const updatedProductos = [...(editedData?.productos || [])]
                                            updatedProductos[index] = {
                                              ...updatedProductos[index],
                                              capacidad_productiva: e.target.value,
                                              capacidadProductiva: e.target.value
                                            }
                                            setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                                          }}
                                          placeholder="Ej: 1000"
                                        />
                                      </div>

                                      <div>
                                        <Label>Unidad de Medida</Label>
                                        <Select
                                          value={producto.unidad_medida || producto.unidadMedida || 'kg'}
                                          onValueChange={(value) => {
                                            const updatedProductos = [...(editedData?.productos || [])]
                                            updatedProductos[index] = {
                                              ...updatedProductos[index],
                                              unidad_medida: value,
                                              unidadMedida: value
                                            }
                                            setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecciona" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                                            <SelectItem value="tn">Toneladas (tn)</SelectItem>
                                            <SelectItem value="lt">Litros (lt)</SelectItem>
                                            <SelectItem value="m3">Metros cúbicos (m³)</SelectItem>
                                            <SelectItem value="un">Unidades (un)</SelectItem>
                                            <SelectItem value="otro">Otro</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Label>Período</Label>
                                        <Select
                                          value={producto.periodo_capacidad || producto.periodoCapacidad || 'mensual'}
                                          onValueChange={(value) => {
                                            const updatedProductos = [...(editedData?.productos || [])]
                                            updatedProductos[index] = {
                                              ...updatedProductos[index],
                                              periodo_capacidad: value,
                                              periodoCapacidad: value
                                            }
                                            setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecciona" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="mensual">Mensual</SelectItem>
                                            <SelectItem value="anual">Anual</SelectItem>
                                            <SelectItem value="semanal">Semanal</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    {/* Posición Arancelaria */}
                                    {producto.posicion_arancelaria && (
                                      <div>
                                        <Label>Posición Arancelaria</Label>
                                        <Input
                                          value={typeof producto.posicion_arancelaria === 'object' 
                                            ? producto.posicion_arancelaria.codigo_arancelario 
                                            : producto.posicion_arancelaria || producto.posicionArancelaria || ''}
                                          onChange={(e) => {
                                            const updatedProductos = [...(editedData?.productos || [])]
                                            updatedProductos[index] = {
                                              ...updatedProductos[index],
                                              posicion_arancelaria: {
                                                ...updatedProductos[index].posicion_arancelaria,
                                                codigo_arancelario: e.target.value
                                              }
                                            }
                                            setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                                          }}
                                          placeholder="Ej: 1234.56.78"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* Botón Eliminar */}
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => {
                                      const updatedProductos = editedData?.productos?.filter((_, i) => i !== index) || []
                                      setEditedData(editedData ? { ...editedData, productos: updatedProductos } : null)
                                    }}
                                    className="flex-shrink-0"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // MODO LECTURA
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-lg">{producto.nombre_producto || producto.nombre}</p>
                                  {producto.descripcion && (
                                    <p className="text-sm text-muted-foreground mt-2">{producto.descripcion}</p>
                                  )}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                    {producto.capacidad_productiva && (
                                      <div>
                                        <span className="text-sm font-medium">Capacidad Productiva: </span>
                                        <span className="text-sm">{producto.capacidad_productiva || producto.capacidadProductiva} {producto.unidad_medida || producto.unidadMedida || ''}</span>
                                      </div>
                                    )}
                                    {producto.posicion_arancelaria && (
                                      <div>
                                        <span className="text-sm font-medium">Posición Arancelaria: </span>
                                        <span className="text-sm">
                                          {typeof producto.posicion_arancelaria === 'object' 
                                            ? producto.posicion_arancelaria.codigo_arancelario 
                                            : producto.posicion_arancelaria}
                                        </span>
                                      </div>
                                    )}
                                    {producto.periodo_capacidad && (
                                      <div>
                                        <span className="text-sm font-medium">Período: </span>
                                        <span className="text-sm">{producto.periodo_capacidad || producto.periodoCapacidad}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground py-4">No hay productos registrados</p>
                    )}
                  </div>
                )}

                {/* SERVICIOS */}
                {(empresaData?.tipo_empresa === 'servicio' || empresaData?.tipo_empresa === 'mixta' || empresaData?.tipo_empresa_valor === 'servicio' || empresaData?.tipo_empresa_valor === 'mixta') && (
                  <div className={`space-y-4 ${(empresaData?.tipo_empresa === 'mixta' || empresaData?.tipo_empresa_valor === 'mixta') ? 'mt-6 pt-6 border-t' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Servicios</h3>
                      {isEditing && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newServicio = {
                              id: `temp-${Date.now()}`,
                              nombre_servicio: '',
                              nombre: '',
                              descripcion: '',
                              tipo_servicio: '',
                              sector_atendido: '',
                              alcance_servicio: 'local',
                              forma_contratacion: 'hora',
                              es_principal: false,
                            }
                            const serviciosKey = empresaData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                            const currentServicios = editedData?.[serviciosKey] || []
                            const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                            
                            setEditedData(editedData ? {
                              ...editedData,
                              [serviciosKey]: [...serviciosArray, newServicio]
                            } : null)
                          }}
                          className="gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Agregar Servicio
                        </Button>
                      )}
                    </div>

                    {(() => {
                      const servicios = empresaData?.servicios_ofrecidos 
                        ? (Array.isArray(empresaData.servicios_ofrecidos)
                            ? empresaData.servicios_ofrecidos
                            : (Object.keys(empresaData.servicios_ofrecidos || {}).length ? [empresaData.servicios_ofrecidos] : []))
                        : (empresaData?.servicios || []);
                      
                      return servicios && servicios.length > 0 ? (
                        <div className="space-y-4">
                          {servicios.map((servicio: any, index: number) => (
                            <div key={servicio.id || index} className="p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              {isEditing ? (
                                // MODO EDICIÓN
                                <div className="space-y-4">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 space-y-4">
                                      {/* Nombre del Servicio */}
                                      <div>
                                        <Label>Nombre del Servicio</Label>
                                        <Input
                                          value={servicio.nombre || servicio.nombre_servicio || servicio.descripcion || ''}
                                          onChange={(e) => {
                                            const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                            const currentServicios = editedData?.[serviciosKey] || []
                                            const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                            const updatedServicios = [...serviciosArray]
                                            updatedServicios[index] = {
                                              ...updatedServicios[index],
                                              nombre: e.target.value,
                                              nombre_servicio: e.target.value
                                            }
                                            setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                          }}
                                          placeholder="Nombre del servicio"
                                        />
                                      </div>

                                      {/* Descripción */}
                                      <div>
                                        <Label>Descripción</Label>
                                        <Textarea
                                          value={servicio.descripcion || ''}
                                          onChange={(e) => {
                                            const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                            const currentServicios = editedData?.[serviciosKey] || []
                                            const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                            const updatedServicios = [...serviciosArray]
                                            updatedServicios[index] = {
                                              ...updatedServicios[index],
                                              descripcion: e.target.value
                                            }
                                            setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                          }}
                                          placeholder="Descripción del servicio"
                                          rows={3}
                                        />
                                      </div>

                                      {/* Tipo de Servicio y Sector */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <Label>Tipo de Servicio</Label>
                                          <Select
                                            value={Array.isArray(servicio.tipo_servicio) ? servicio.tipo_servicio[0] : servicio.tipo_servicio || ''}
                                            onValueChange={(value) => {
                                              const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                              const currentServicios = editedData?.[serviciosKey] || []
                                              const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                              const updatedServicios = [...serviciosArray]
                                              updatedServicios[index] = {
                                                ...updatedServicios[index],
                                                tipo_servicio: value
                                              }
                                              setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecciona tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="consultoria">Consultoría y servicios empresariales</SelectItem>
                                              <SelectItem value="tecnologias">Tecnologías de la información (IT)</SelectItem>
                                              <SelectItem value="diseno_marketing">Diseño y marketing</SelectItem>
                                              <SelectItem value="capacitacion">Capacitación y educación online</SelectItem>
                                              <SelectItem value="culturales_eventos">Servicios culturales y eventos</SelectItem>
                                              <SelectItem value="investigacion_desarrollo">Investigación y desarrollo (I+D)</SelectItem>
                                              <SelectItem value="turismo_receptivo">Turismo receptivo</SelectItem>
                                              <SelectItem value="otro">Otro</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div>
                                          <Label>Sector Atendido</Label>
                                          <Input
                                            value={servicio.sector_atendido || (Array.isArray(servicio.sectores) ? servicio.sectores.join(', ') : servicio.sectores || '')}
                                            onChange={(e) => {
                                              const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                              const currentServicios = editedData?.[serviciosKey] || []
                                              const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                              const updatedServicios = [...serviciosArray]
                                              updatedServicios[index] = {
                                                ...updatedServicios[index],
                                                sector_atendido: e.target.value
                                              }
                                              setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                            }}
                                            placeholder="Ej: Minería, Turismo"
                                          />
                                        </div>
                                      </div>

                                      {/* Alcance y Forma de Contratación */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <Label>Alcance Geográfico</Label>
                                          <Select
                                            value={servicio.alcance_geografico || servicio.alcance_servicio || 'local'}
                                            onValueChange={(value) => {
                                              const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                              const currentServicios = editedData?.[serviciosKey] || []
                                              const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                              const updatedServicios = [...serviciosArray]
                                              updatedServicios[index] = {
                                                ...updatedServicios[index],
                                                alcance_geografico: value,
                                                alcance_servicio: value
                                              }
                                              setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecciona alcance" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="local">Local</SelectItem>
                                              <SelectItem value="nacional">Nacional</SelectItem>
                                              <SelectItem value="internacional">Internacional</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>

                                        <div>
                                          <Label>Forma de Contratación</Label>
                                          <Select
                                            value={Array.isArray(servicio.forma_contratacion) ? servicio.forma_contratacion[0] : servicio.forma_contratacion || 'hora'}
                                            onValueChange={(value) => {
                                              const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                              const currentServicios = editedData?.[serviciosKey] || []
                                              const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                              const updatedServicios = [...serviciosArray]
                                              updatedServicios[index] = {
                                                ...updatedServicios[index],
                                                forma_contratacion: value
                                              }
                                              setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Selecciona forma" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="hora">Por Hora</SelectItem>
                                              <SelectItem value="proyecto">Por Proyecto</SelectItem>
                                              <SelectItem value="mensual">Mensual</SelectItem>
                                              <SelectItem value="otro">Otro</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Botón Eliminar */}
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => {
                                        const serviciosKey = editedData?.servicios_ofrecidos ? 'servicios_ofrecidos' : 'servicios'
                                        const currentServicios = editedData?.[serviciosKey] || []
                                        const serviciosArray = Array.isArray(currentServicios) ? currentServicios : [currentServicios]
                                        const updatedServicios = serviciosArray.filter((_, i) => i !== index)
                                        setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                      }}
                                      className="flex-shrink-0"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                // MODO LECTURA
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-semibold text-lg">
                                      {servicio.nombre || servicio.nombre_servicio || servicio.descripcion || `Servicio ${index + 1}`}
                                    </p>
                                    {servicio.descripcion && (servicio.nombre || servicio.nombre_servicio) && (
                                      <p className="text-sm text-muted-foreground mt-2">{servicio.descripcion}</p>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                      {servicio.tipo_servicio && (
                                        <div>
                                          <span className="text-sm font-medium">Tipo: </span>
                                          <span className="text-sm">
                                            {Array.isArray(servicio.tipo_servicio) 
                                              ? servicio.tipo_servicio.join(', ') 
                                              : servicio.tipo_servicio}
                                          </span>
                                        </div>
                                      )}
                                      {(servicio.sector_atendido || (servicio.sectores && servicio.sectores.length > 0)) && (
                                        <div>
                                          <span className="text-sm font-medium">Sectores Atendidos: </span>
                                          <span className="text-sm">
                                            {servicio.sector_atendido || 
                                             (Array.isArray(servicio.sectores) ? servicio.sectores.join(', ') : servicio.sectores)}
                                          </span>
                                        </div>
                                      )}
                                      {(servicio.alcance_geografico || servicio.alcance_servicio) && (
                                        <div>
                                          <span className="text-sm font-medium">Alcance Geográfico: </span>
                                          <span className="text-sm">
                                            {servicio.alcance_geografico || servicio.alcance_servicio || 'N/A'}
                                          </span>
                                        </div>
                                      )}
                                      {servicio.forma_contratacion && (
                                        <div>
                                          <span className="text-sm font-medium">Forma de Contratación: </span>
                                          <span className="text-sm">
                                            {Array.isArray(servicio.forma_contratacion) 
                                              ? servicio.forma_contratacion.join(', ') 
                                              : servicio.forma_contratacion}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground py-4">No hay servicios registrados</p>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificaciones" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Certificaciones</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Certificado MiPyME</Label>
                  <p className="mt-1 font-semibold">{empresaData?.certificadopyme || empresaData?.certificadoMiPyme ? 'Sí' : 'No'}</p>
                </div>
                <div>
                  <Label>Material Promocional en 2 Idiomas</Label>
                  <p className="mt-1 font-semibold">{empresaData?.promo2idiomas || empresaData?.materialPromocion2Idiomas ? 'Sí' : 'No'}</p>
                </div>
                <div className="md:col-span-2">
                  <Label>Certificaciones</Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      {(Array.isArray(editedData?.certificaciones) ? editedData.certificaciones : (editedData?.certificaciones ? editedData.certificaciones.split(',').map((c: string) => c.trim()).filter((c: string) => c) : [])).map((cert: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={cert}
                            onChange={(e) => {
                              const newCerts = [...(Array.isArray(editedData?.certificaciones) ? editedData.certificaciones : (editedData?.certificaciones ? editedData.certificaciones.split(',').map((c: string) => c.trim()).filter((c: string) => c) : []))]
                              newCerts[index] = e.target.value
                              setEditedData({ ...editedData, certificaciones: newCerts })
                            }}
                            className="flex-1"
                            placeholder="Ej: ISO 9001, ISO 14001, etc."
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              const newCerts = (Array.isArray(editedData?.certificaciones) ? editedData.certificaciones : (editedData?.certificaciones ? editedData.certificaciones.split(',').map((c: string) => c.trim()).filter((c: string) => c) : [])).filter((_: any, i: number) => i !== index)
                              setEditedData({ ...editedData, certificaciones: newCerts })
                            }}
                            size="sm"
                            variant="destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        onClick={() => {
                          const newCerts = [...(Array.isArray(editedData?.certificaciones) ? editedData.certificaciones : (editedData?.certificaciones ? editedData.certificaciones.split(',').map((c: string) => c.trim()).filter((c: string) => c) : [])), '']
                          setEditedData({ ...editedData, certificaciones: newCerts })
                        }}
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Agregar Certificación
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-1 font-semibold">
                      {Array.isArray(empresaData?.certificaciones) 
                        ? empresaData.certificaciones.join(', ') 
                        : empresaData?.certificaciones || 'N/A'}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label>Observaciones</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedData?.observaciones || empresaData?.observaciones || ''}
                      onChange={(e) => setEditedData(editedData ? { ...editedData, observaciones: e.target.value } : null)}
                      rows={4}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{empresaData?.observaciones || 'N/A'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-[#222A59] text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          {/* Grid de contenido */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Contacto</h4>
              <p className="text-white/80 text-sm mb-2">{configuracion.direccion}</p>
              <p className="text-white/80 text-sm mb-2">{configuracion.telefono}</p>
              <p className="text-white/80 text-sm">{configuracion.email_contacto}</p>
            </div>
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Enlaces Útiles</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Iniciar Sesión
                  </Link>
                </li>
                <li>
                  <Link href="/registro" className="hover:text-white transition-colors">
                    Registrar Empresa
                  </Link>
                </li>
                <li>
                  <Link href="/#beneficios" className="hover:text-white transition-colors">
                    Beneficios
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Redes Sociales</h4>
              <div className="flex gap-4">
                <a 
                  href="https://www.instagram.com/min.integracionregional.cat?igsh=MTIzdTZkczVpZ2o4bQ=="
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://www.linkedin.com/company/sec-relaciones-internacionales-catamarca/posts/?feedView=all"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Imagen del footer al final */}
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-2xl h-auto">
              <img
                src="/footer.png"
                alt="Footer Catamarca"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </footer>

      {/* Modal obligatorio para cambiar contraseña - NO SE PUEDE CERRAR */}
      <Dialog open={showPasswordChangeModal} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md" 
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertCircle className="h-5 w-5" />
              <DialogTitle>Cambio de Contraseña Obligatorio</DialogTitle>
            </div>
            <DialogDescription>
              Por seguridad, debes cambiar tu contraseña antes de continuar. Tu contraseña actual es el CUIT de tu empresa, que no es segura.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordChangeData.newPassword}
                  onChange={(e) =>
                    setPasswordChangeData({ ...passwordChangeData, newPassword: e.target.value })
                  }
                  placeholder="Mínimo 8 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-[#6B7280] hover:text-[#222A59]"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                La contraseña debe tener al menos 8 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordChangeData.confirmPassword}
                  onChange={(e) =>
                    setPasswordChangeData({ ...passwordChangeData, confirmPassword: e.target.value })
                  }
                  placeholder="Confirma tu nueva contraseña"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-[#6B7280] hover:text-[#222A59]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              onClick={async () => {
                if (!passwordChangeData.newPassword || !passwordChangeData.confirmPassword) {
                  toast({
                    title: "Campos requeridos",
                    description: "Por favor completa todos los campos",
                    variant: "destructive",
                  })
                  return
                }

                if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
                  toast({
                    title: "Error",
                    description: "Las contraseñas no coinciden",
                    variant: "destructive",
                  })
                  return
                }

                if (passwordChangeData.newPassword.length < 8) {
                  toast({
                    title: "Contraseña débil",
                    description: "La contraseña debe tener al menos 8 caracteres",
                    variant: "destructive",
                  })
                  return
                }

                try {
                  setIsChangingPassword(true)
                  
                  if (!user?.id) {
                    throw new Error("No se pudo identificar al usuario")
                  }

                  // Actualizar la contraseña usando el endpoint específico
                  await api.updatePassword(passwordChangeData.newPassword)

                  // Refrescar el usuario para obtener el estado actualizado
                  await refreshUser()
                  
                  // Esperar un momento para que el contexto se actualice
                  await new Promise(resolve => setTimeout(resolve, 300))

                  toast({
                    title: "Éxito",
                    description: "Contraseña actualizada correctamente",
                  })

                  // Cerrar el modal
                  setShowPasswordChangeModal(false)
                  
                  // Limpiar los campos del formulario
                  setPasswordChangeData({ newPassword: "", confirmPassword: "" })
                  
                  // Recargar la página para reflejar los cambios
                  window.location.reload()
                } catch (error: any) {
                  console.error("Error cambiando contraseña:", error)
                  toast({
                    title: "Error",
                    description: error.message || "No se pudo cambiar la contraseña. Por favor, intenta nuevamente.",
                    variant: "destructive",
                  })
                } finally {
                  setIsChangingPassword(false)
                }
              }}
              disabled={
                isChangingPassword ||
                !passwordChangeData.newPassword ||
                !passwordChangeData.confirmPassword ||
                passwordChangeData.newPassword !== passwordChangeData.confirmPassword ||
                passwordChangeData.newPassword.length < 8
              }
              className="w-full bg-[#3259B5] hover:bg-[#3259B5]/90 text-white"
            >
              {isChangingPassword ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
