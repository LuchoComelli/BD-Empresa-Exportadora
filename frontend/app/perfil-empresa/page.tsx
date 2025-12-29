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
  ArrowLeft,
  Loader2,
  Lock,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
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
  // Estados separados para empresas mixtas
  const [rubroProducto, setRubroProducto] = useState<number | null>(null)
  const [rubroServicio, setRubroServicio] = useState<number | null>(null)
  const [subRubrosProductos, setSubRubrosProductos] = useState<any[]>([])
  const [subRubrosServicios, setSubRubrosServicios] = useState<any[]>([])
  const [loadingGeo, setLoadingGeo] = useState(false)
  const [loadingRubros, setLoadingRubros] = useState(false)
  
  // Estado para manejo de archivos
  const [brochure_file, setBrochure_file] = useState<File | null>(null)

  // Estado para actividades de promoción internacional
  const [actividadesPromocion, setActividadesPromocion] = useState<any[]>([])

  // Estados para edición de geolocalización
  const [geoEditMode, setGeoEditMode] = useState<'view' | 'editing'>('view')
  const [tempGeoCoordinates, setTempGeoCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [showGeoConfirmDialog, setShowGeoConfirmDialog] = useState(false)

  // Estados para cambio de email y contraseña
  const [userProfile, setUserProfile] = useState<any>(null)
  const [emailData, setEmailData] = useState({
    newEmail: "",
    confirmEmail: "",
  })
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  })
  const [savingUserConfig, setSavingUserConfig] = useState(false)

  // Funciones para manejar actividades de promoción internacional
  const agregarActividad = (tipo: "feria" | "mision" | "ronda") => {
    setActividadesPromocion([...actividadesPromocion, { 
      id: Date.now().toString(), 
      tipo, 
      lugar: "", 
      anio: "",
      observaciones: ""
    }])
  }

  const eliminarActividad = (id: string) => {
    setActividadesPromocion(actividadesPromocion.filter((a) => a.id !== id))
  }

  const actualizarActividad = (id: string, field: string, value: string) => {
    setActividadesPromocion(actividadesPromocion.map((a) => (a.id === id ? { ...a, [field]: value } : a)))
  }

  const toUpperCase = (value: string) => value.toUpperCase()

  // Cargar perfil de usuario
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const data = await api.getCurrentUser()
        setUserProfile(data)
        setEmailData({
          newEmail: data.email || "",
          confirmEmail: data.email || "",
        })
      } catch (error) {
        console.error("Error cargando perfil de usuario:", error)
      }
    }
    if (user) {
      loadUserProfile()
    }
  }, [user])

  // Función para cambiar email
  const handleChangeEmail = async () => {
    if (!emailData.newEmail || !emailData.confirmEmail) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    if (emailData.newEmail !== emailData.confirmEmail) {
      toast({
        title: "Error",
        description: "Los emails no coinciden",
        variant: "destructive",
      })
      return
    }

    try {
      setSavingUserConfig(true)
      
      await api.updateMe({
        email: emailData.newEmail,
      })

      const updatedData = await api.getCurrentUser()
      setUserProfile(updatedData)
      await refreshUser()

      setEmailData({
        newEmail: updatedData.email || "",
        confirmEmail: updatedData.email || "",
      })

      toast({
        title: "Éxito",
        description: "Email actualizado correctamente. Por favor, inicia sesión nuevamente con tu nuevo email.",
      })
    } catch (error: any) {
      console.error("Error cambiando email:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudo cambiar el email. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSavingUserConfig(false)
    }
  }

  // Función para cambiar contraseña
  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Contraseña débil",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      })
      return
    }

    try {
      setSavingUserConfig(true)
      
      await api.updateMe({
        password: passwordData.newPassword,
      })

      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Éxito",
        description: "Contraseña actualizada correctamente",
      })
    } catch (error: any) {
      console.error("Error cambiando contraseña:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudo cambiar la contraseña. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setSavingUserConfig(false)
    }
  }

  // Función para guardar la nueva geolocalización
  const handleSaveGeoLocation = async () => {
    if (!tempGeoCoordinates || !empresaData || !solicitudId) return

    try {
      setIsSaving(true)
      const geoString = `${tempGeoCoordinates.lat},${tempGeoCoordinates.lng}`
      
      const updatedEmpresa = await api.updateEmpresa(solicitudId, {
        geolocalizacion: geoString
      })

      // Actualizar empresaData con la nueva geolocalización
      setEmpresaData((prev: any) => ({
        ...prev,
        geolocalizacion: geoString
      }))
      
      // También actualizar editedData si está en modo edición para que el cambio se refleje inmediatamente
      if (editedData) {
        setEditedData((prev: any) => ({
          ...prev,
          geolocalizacion: geoString
        }))
      }
      
      setGeoEditMode('view')
      setTempGeoCoordinates(null)
      setShowGeoConfirmDialog(false)
      
      toast({
        title: "Ubicación actualizada",
        description: "La geolocalización se ha actualizado correctamente.",
      })
    } catch (error: any) {
      console.error("Error actualizando geolocalización:", error)
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar la geolocalización.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

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
        // Mostrar el modal inmediatamente y también con un pequeño delay como respaldo
        setShowPasswordChangeModal(true)
        // También usar setTimeout como respaldo para asegurar que el componente esté completamente montado
        const timer = setTimeout(() => {
          setShowPasswordChangeModal(true)
        }, 200)
        return () => clearTimeout(timer)
      } else {
        console.log("[Perfil] No se debe mostrar el modal:", {
          reason: user.type !== "empresa" ? "No es empresa" : "No debe cambiar contraseña",
          userType: user.type,
          debeCambiarPassword: user.debe_cambiar_password
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
            certificadopyme: empresa.certificadopyme === true || empresa.certificadopyme === 'true' || empresa.certificadopyme === 'si',
            certificaciones: empresa.certificaciones
              ? (Array.isArray(empresa.certificaciones)
                  ? empresa.certificaciones
                  : typeof empresa.certificaciones === 'string'
                  ? empresa.certificaciones.split(',').map((c: string) => c.trim()).filter((c: string) => c)
                  : [])
              : [],
            promo2idiomas: empresa.promo2idiomas === true || empresa.promo2idiomas === 'true' || empresa.promo2idiomas === 'si',
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
            
            // Productos mixta - normalizar formato (para empresas mixtas)
            productos_mixta: (() => {
              const tipoEmpresa = empresa.tipo_empresa_valor || empresa.tipo_empresa
              if (tipoEmpresa === 'mixta') {
                const productos = empresa.productos_mixta || empresa.productos || empresa.productos_empresa || []
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
            
            // Servicios mixta - normalizar formato (para empresas mixtas)
            servicios_mixta: (() => {
              const tipoEmpresa = empresa.tipo_empresa_valor || empresa.tipo_empresa
              if (tipoEmpresa === 'mixta') {
                const servicios = empresa.servicios_mixta || empresa.servicios || empresa.servicios_empresa || empresa.servicios_ofrecidos || []
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
              }
              return []
            })(),
            servicios_ofrecidos: empresa.servicios_ofrecidos || empresa.servicios || [],
            
            // Contactos - Construir array asegurando que siempre incluya el contacto principal
            contacto_principal_nombre: empresa.contacto_principal_nombre || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.nombre : null),
            contacto_principal_apellido: empresa.contacto_principal_apellido || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.apellido : null),
            contacto_principal_cargo: empresa.contacto_principal_cargo || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.cargo : null),
            contacto_principal_telefono: empresa.contacto_principal_telefono || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.telefono : null) || empresa.telefono || null,
            contacto_principal_email: empresa.contacto_principal_email || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.email : null) || empresa.correo || empresa.email || null,
            // Contactos secundarios y terciarios - campos individuales
            contacto_secundario_nombre: empresa.contacto_secundario_nombre || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.nombre : null),
            contacto_secundario_apellido: empresa.contacto_secundario_apellido || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.apellido : null),
            contacto_secundario_cargo: empresa.contacto_secundario_cargo || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.cargo : null),
            contacto_secundario_telefono: empresa.contacto_secundario_telefono || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.telefono : null),
            contacto_secundario_email: empresa.contacto_secundario_email || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.email : null),
            contacto_terciario_nombre: empresa.contacto_terciario_nombre || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.nombre : null),
            contacto_terciario_apellido: empresa.contacto_terciario_apellido || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.apellido : null),
            contacto_terciario_cargo: empresa.contacto_terciario_cargo || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.cargo : null),
            contacto_terciario_telefono: empresa.contacto_terciario_telefono || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.telefono : null),
            contacto_terciario_email: empresa.contacto_terciario_email || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.email : null),
            contactos: (() => {
              // Si existe un array de contactos válido
              if (Array.isArray(empresa.contactos) && empresa.contactos.length > 0) {
                // Verificar si ya incluye el contacto principal
                const tienePrincipal = empresa.contactos.some((c: any) => c.tipo === 'Principal')
                if (tienePrincipal) {
                  return empresa.contactos
                }
              }
              
              // Construir array de contactos con el contacto principal
              const contactosArray: any[] = []
              
              // Agregar contacto principal desde campos individuales o desde el array
              const contactoPrincipalDesdeArray = Array.isArray(empresa.contactos) 
                ? empresa.contactos.find((c: any) => c.tipo === 'Principal')
                : null
              
              const contactoPrincipal = {
                tipo: 'Principal',
                nombre: empresa.contacto_principal_nombre || contactoPrincipalDesdeArray?.nombre || '',
                apellido: empresa.contacto_principal_apellido || contactoPrincipalDesdeArray?.apellido || '',
                cargo: empresa.contacto_principal_cargo || contactoPrincipalDesdeArray?.cargo || '',
                telefono: empresa.contacto_principal_telefono || contactoPrincipalDesdeArray?.telefono || empresa.telefono || '',
                email: empresa.contacto_principal_email || contactoPrincipalDesdeArray?.email || empresa.correo || empresa.email || '',
              }
              contactosArray.push(contactoPrincipal)
              
              // Agregar contactos secundarios si existen
              if (Array.isArray(empresa.contactos)) {
                const secundarios = empresa.contactos.filter((c: any) => c.tipo === 'Secundario')
                contactosArray.push(...secundarios)
              }
              
              // Agregar contactos terciarios si existen
              if (Array.isArray(empresa.contactos)) {
                const terciarios = empresa.contactos.filter((c: any) => c.tipo === 'Terciario')
                contactosArray.push(...terciarios)
              }
              
              return contactosArray
            })(),
            
            // Actividades de promoción
            actividades_promocion_internacional: empresa.actividades_promocion_internacional || empresa.feriasAsistidas || [],
            feriasAsistidas: empresa.actividades_promocion_internacional || empresa.feriasAsistidas || [],
            
            // Redes sociales - preservar valores (incluyendo null y undefined)
            instagram: empresa.instagram !== null && empresa.instagram !== undefined ? empresa.instagram : '',
            facebook: empresa.facebook !== null && empresa.facebook !== undefined ? empresa.facebook : '',
            linkedin: empresa.linkedin !== null && empresa.linkedin !== undefined ? empresa.linkedin : '',
            
            // Otros
            observaciones: empresa.observaciones,
            categoria_matriz: empresa.categoria_matriz,
            fecha_creacion: empresa.fecha_creacion,
            fecha_actualizacion: empresa.fecha_actualizacion,
          }
          
          setEmpresaData(normalizedEmpresa)
          
          // Inicializar actividades de promoción internacional
          const actividades = normalizedEmpresa.actividades_promocion_internacional || normalizedEmpresa.feriasAsistidas || []
          if (Array.isArray(actividades) && actividades.length > 0) {
            const actividadesFormateadas = actividades.map((act: any, index: number) => ({
              id: act.id?.toString() || `act-${index}-${Date.now()}`,
              tipo: act.tipo || 'feria',
              lugar: act.lugar || '',
              anio: act.anio?.toString() || '',
              observaciones: act.observaciones || ''
            }))
            setActividadesPromocion(actividadesFormateadas)
          } else {
            setActividadesPromocion([])
          }
          
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

  // Cargar subrubros de productos por rubro
  const loadSubRubrosProductos = async (rubroId: any) => {
    try {
      setLoadingRubros(true)
      console.log('🔍 [loadSubRubrosProductos] Cargando subrubros para rubro productos:', rubroId)
      const data = await api.getSubRubrosPorRubro(rubroId)
      console.log('✅ [loadSubRubrosProductos] SubRubros cargados (raw):', data)
      
      const subRubrosArray = Array.isArray(data) ? data : (data?.results || [])
      console.log('✅ [loadSubRubrosProductos] SubRubros array:', subRubrosArray.length, subRubrosArray)
      
      setSubRubrosProductos(subRubrosArray)
    } catch (error) {
      console.error('❌ [loadSubRubrosProductos] Error loading subrubros:', error)
      setSubRubrosProductos([])
    } finally {
      setLoadingRubros(false)
    }
  }

  // Cargar subrubros de servicios por rubro
  const loadSubRubrosServicios = async (rubroId: any) => {
    try {
      setLoadingRubros(true)
      console.log('🔍 [loadSubRubrosServicios] Cargando subrubros para rubro servicios:', rubroId)
      const data = await api.getSubRubrosPorRubro(rubroId)
      console.log('✅ [loadSubRubrosServicios] SubRubros cargados (raw):', data)
      
      const subRubrosArray = Array.isArray(data) ? data : (data?.results || [])
      console.log('✅ [loadSubRubrosServicios] SubRubros array:', subRubrosArray.length, subRubrosArray)
      
      setSubRubrosServicios(subRubrosArray)
    } catch (error) {
      console.error('❌ [loadSubRubrosServicios] Error loading subrubros:', error)
      setSubRubrosServicios([])
    } finally {
      setLoadingRubros(false)
    }
  }

  // Mostrar carga mientras se verifica el usuario
  if (authLoading || !user) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] w-full max-w-full overflow-x-hidden">
        <header className="border-b bg-[#222A59] sticky top-0 z-50 shadow-md">
          <div className="w-full px-2 sm:px-4 py-2 md:py-3 flex items-center justify-between gap-2">
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
        <main className="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <Card className="p-4 sm:p-6 md:p-8 text-center w-full max-w-full overflow-hidden">
            <p className="text-sm sm:text-base md:text-lg text-[#6B7280]">Cargando...</p>
          </Card>
        </main>
        {/* Footer */}
        <footer className="bg-[#222A59] text-white py-6 sm:py-8 md:py-12">
          <div className="w-full px-2 sm:px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-12">
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
      <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] w-full max-w-full overflow-x-hidden">
        <header className="border-b bg-[#222A59] sticky top-0 z-50 shadow-md">
          <div className="w-full px-2 sm:px-4 py-2 md:py-3 flex items-center justify-between gap-2">
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
        <main className="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <Card className="p-4 sm:p-6 md:p-8 text-center w-full max-w-full overflow-hidden">
            <p className="text-lg text-[#6B7280]">Cargando datos de la empresa...</p>
          </Card>
        </main>
      </div>
    )
  }

  // Si no hay datos de empresa, mostrar mensaje
  if (!empresaData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] w-full max-w-full overflow-x-hidden">
      <header className="bg-[#222A59] text-white shadow-lg">
          <div className="w-full px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 md:w-8 md:h-8 text-[#222A59]" />
              </div>
              <div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Perfil de Empresa</h1>
                  <p className="text-xs sm:text-sm md:text-base text-white/80">Dirección de Intercambio Comercial Internacional y Regional</p>
              </div>
            </div>
            <Button
              onClick={logout}
              variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Cerrar Sesión</span>
                <span className="xs:hidden">Salir</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <Card className="p-4 sm:p-6 md:p-8 text-center w-full max-w-full overflow-hidden">
            <p className="text-sm sm:text-base md:text-lg text-[#6B7280]">No se encontraron datos de empresa asociados a tu cuenta.</p>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-2">Por favor, contacta al administrador del sistema.</p>
          </Card>
        </main>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] overflow-x-hidden">
      {/* Header */}
      <header className="border-b bg-[#222A59] sticky top-0 z-50 shadow-md">
        <div className="w-full px-2 sm:px-4 py-2 md:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1 overflow-hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="flex-shrink-0 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <div className="relative w-28 h-8 sm:w-32 sm:h-10 md:w-40 md:h-12 max-h-[32px] sm:max-h-[40px] md:max-h-[48px]">
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
          <div className="flex gap-1 sm:gap-2 flex-shrink-0 ml-auto">
              {!isEditing ? (
                <Button
                  onClick={() => {
                    console.log('🔵 [handleEdit] INICIANDO EDICIÓN')
                    console.log('🔵 [handleEdit] empresaData:', empresaData)
                    
                    // Preparar datos para edición, usando campos individuales
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
                      productos_mixta: empresaData?.productos_mixta || empresaData?.productos || [],
                      servicios: empresaData?.servicios || [],
                      servicios_mixta: empresaData?.servicios_mixta || empresaData?.servicios || [],
                      certificaciones: empresaData?.certificaciones || [],
                      // Redes sociales - campos individuales
                      instagram: empresaData?.instagram || '',
                      facebook: empresaData?.facebook || '',
                      linkedin: empresaData?.linkedin || '',
                      // Contacto principal - campos individuales
                      contacto_principal_nombre: empresaData?.contacto_principal_nombre || '',
                      contacto_principal_apellido: empresaData?.contacto_principal_apellido || '',
                      contacto_principal_cargo: empresaData?.contacto_principal_cargo || '',
                      contacto_principal_telefono: empresaData?.contacto_principal_telefono || empresaData?.telefono || '',
                      contacto_principal_email: empresaData?.contacto_principal_email || empresaData?.correo || empresaData?.email || '',
                      // Contacto secundario - campos individuales
                      contacto_secundario_nombre: empresaData?.contacto_secundario_nombre || '',
                      contacto_secundario_apellido: empresaData?.contacto_secundario_apellido || '',
                      contacto_secundario_cargo: empresaData?.contacto_secundario_cargo || '',
                      contacto_secundario_telefono: empresaData?.contacto_secundario_telefono || '',
                      contacto_secundario_email: empresaData?.contacto_secundario_email || '',
                      // Contacto terciario - campos individuales
                      contacto_terciario_nombre: empresaData?.contacto_terciario_nombre || '',
                      contacto_terciario_apellido: empresaData?.contacto_terciario_apellido || '',
                      contacto_terciario_cargo: empresaData?.contacto_terciario_cargo || '',
                      contacto_terciario_telefono: empresaData?.contacto_terciario_telefono || '',
                      contacto_terciario_email: empresaData?.contacto_terciario_email || '',
                      exporta: empresaData?.exporta || false,
                      destinosExportacion: empresaData?.destinosExportacion || [],
                      importa: empresaData?.importa || false,
                      tipoImportacion: empresaData?.tipoImportacion || '',
                      certificadopyme: empresaData?.certificadopyme === true || empresaData?.certificadopyme === 'true' || empresaData?.certificadopyme === 'si',
                      promo2idiomas: empresaData?.promo2idiomas === true || empresaData?.promo2idiomas === 'true' || empresaData?.promo2idiomas === 'si',
                      idiomasTrabajo: empresaData?.idiomasTrabajo || '',
                      observaciones: empresaData?.observaciones || '',
                      feriasAsistidas: empresaData?.feriasAsistidas || [],
                      // Inicializar actividades de promoción cuando se entra en modo edición
                      ...(() => {
                        const actividades = empresaData?.actividades_promocion_internacional || empresaData?.feriasAsistidas || []
                        if (Array.isArray(actividades) && actividades.length > 0) {
                          const actividadesFormateadas = actividades.map((act: any, index: number) => ({
                            id: act.id?.toString() || `act-${index}-${Date.now()}`,
                            tipo: act.tipo || 'feria',
                            lugar: act.lugar || '',
                            anio: act.anio?.toString() || '',
                            observaciones: act.observaciones || ''
                          }))
                          setActividadesPromocion(actividadesFormateadas)
                        } else {
                          setActividadesPromocion([])
                        }
                        return {}
                      })(),
                      geolocalizacion: (() => {
                        const geo = empresaData?.geolocalizacion
                        if (!geo) return null
                        // Si es objeto con lat y lng
                        if (typeof geo === 'object' && geo.lat != null && geo.lng != null) {
                          return { lat: geo.lat, lng: geo.lng }
                        }
                        // Si es string, parsearlo
                        if (typeof geo === 'string' && geo.trim()) {
                          try {
                            const parts = geo.split(',').map(v => parseFloat(v.trim()))
                            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                              return { lat: parts[0], lng: parts[1] }
                            }
                          } catch (error) {
                            console.error('Error parsing geolocalizacion:', error)
                          }
                        }
                        return null
                      })(),
                      brochure: empresaData?.brochure || null,
                      brochure_file: null,
                    }
                    
                    setIsEditing(true)
                    setEditedData(dataToEdit)
                    
                    // Cargar municipios si hay departamento
                    if (empresaData?.departamento) {
                      const deptoId = typeof empresaData.departamento === 'object' 
                        ? empresaData.departamento.id 
                        : empresaData.departamento
                      if (deptoId) {
                        console.log('🔵 [handleEdit] Cargando municipios para depto:', deptoId)
                        loadMunicipiosData(deptoId)
                      }
                    }
                    
                    // Cargar localidades si hay municipio
                    if (empresaData?.municipio) {
                      const munId = typeof empresaData.municipio === 'object'
                        ? empresaData.municipio.id
                        : empresaData.municipio
                      if (munId) {
                        console.log('🔵 [handleEdit] Cargando localidades para municipio:', munId)
                        loadLocalidadesData(munId)
                      }
                    }
                    
                    // ⭐ CRÍTICO: Cargar subrubros si hay rubro
                    if (empresaData?.id_rubro) {
                      const rubroId = typeof empresaData.id_rubro === 'object'
                        ? empresaData.id_rubro.id
                        : empresaData.id_rubro
                      if (rubroId) {
                        console.log('🔵 [handleEdit] Cargando subrubros para rubro:', rubroId)
                        loadSubRubrosData(rubroId)
                      }
                    }
                    
                    // Para empresas mixtas: cargar subrubros separados
                    const tipoEmpresa = empresaData?.tipo_empresa_valor || empresaData?.tipo_empresa
                    if (tipoEmpresa === 'mixta') {
                      // Cargar subrubros de productos si existe rubro de productos
                      if (empresaData?.id_rubro_producto) {
                        const rubroProdId = typeof empresaData.id_rubro_producto === 'object'
                          ? empresaData.id_rubro_producto.id
                          : empresaData.id_rubro_producto
                        if (rubroProdId) {
                          console.log('🔵 [handleEdit] Cargando subrubros productos para rubro:', rubroProdId)
                          loadSubRubrosProductos(rubroProdId)
                        }
                      }
                      
                      // Cargar subrubros de servicios si existe rubro de servicios
                      if (empresaData?.id_rubro_servicio) {
                        const rubroServId = typeof empresaData.id_rubro_servicio === 'object'
                          ? empresaData.id_rubro_servicio.id
                          : empresaData.id_rubro_servicio
                        if (rubroServId) {
                          console.log('🔵 [handleEdit] Cargando subrubros servicios para rubro:', rubroServId)
                          loadSubRubrosServicios(rubroServId)
                        }
                      }
                    }
                    
                    console.log('🔵 [handleEdit] EDICIÓN INICIADA')
                  }}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
                >
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Editar Perfil</span>
                  <span className="xs:hidden">Editar</span>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      setEditedData(empresaData ? { ...empresaData } : null)
                      // Limpiar estados de rubros y subrubros para empresas mixtas
                      setRubroProducto(null)
                      setRubroServicio(null)
                      setSubRubrosProductos([])
                      setSubRubrosServicios([])
                      // Limpiar estados de edición de geolocalización
                      setGeoEditMode('view')
                      setTempGeoCoordinates(null)
                      setBrochure_file(null)
                    }}
                    variant="outline"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!editedData || !empresaData || !solicitudId) {
                        toast({
                          title: "Error",
                          description: "No se pudo obtener el ID de la empresa. Por favor, recarga la página.",
                          variant: "destructive",
                        })
                        return
                      }
                      
                      try {
                        setIsSaving(true)
                        
                        console.log('📤 [handleSave] Iniciando guardado')
                        
                        // 0. DETERMINAR TIPO DE EMPRESA PRIMERO
                        const tipoEmpresa = empresaData.tipo_empresa_valor || empresaData.tipo_empresa || 'producto'
                        const esProducto = tipoEmpresa === 'producto'
                        const esServicio = tipoEmpresa === 'servicio'
                        const esMixta = tipoEmpresa === 'mixta'
                        
                        console.log('📦 [handleSave] Tipo de empresa:', tipoEmpresa)
                        
                        // 1. GUARDAR DATOS BÁSICOS DE LA EMPRESA (sin productos/servicios)
                        // ✅ IMPORTANTE: Excluir 'brochure' del destructuring porque es la URL del archivo existente,
                        // no el archivo en sí. El manejo del archivo se hace por separado más abajo.
                        // ✅ IMPORTANTE: Excluir campos duplicados del frontend para evitar conflictos con los campos del backend
                        const { productos, servicios, productos_mixta, servicios_mixta, brochure_file, brochure_filename, brochure, ...empresaDataToSend } = editedData
                        
                        // ✅ CREAR FormData para enviar archivos
                        const formData = new FormData()
                        
                        // ✅ MANEJAR ARCHIVO PDF
                        if (brochure_file) {
                          // Subir nuevo archivo
                          console.log('📎 [handleSave] Agregando archivo brochure:', brochure_file.name)
                          formData.append('brochure', brochure_file)
                        } else if (editedData.brochure === null && empresaData.brochure) {
                          // El usuario eliminó el archivo (brochure es null pero antes existía)
                          console.log('🗑️ [handleSave] Eliminando archivo brochure existente')
                          formData.append('brochure', '') // Enviar string vacío para eliminar
                        }
                        
                        // Preparar contacto principal - usar campos individuales
                        const nombreContacto = editedData?.contacto_principal_nombre || empresaData?.contacto_principal_nombre || ''
                        const apellidoContacto = editedData?.contacto_principal_apellido || empresaData?.contacto_principal_apellido || ''
                        const cargoContacto = editedData?.contacto_principal_cargo || empresaData?.contacto_principal_cargo || ''
                        const telefonoContacto = editedData?.contacto_principal_telefono || empresaData?.contacto_principal_telefono || empresaData?.telefono || ''
                        const emailContacto = editedData?.contacto_principal_email || empresaData?.contacto_principal_email || empresaData?.correo || empresaData?.email || ''
                        
                        // Validar campos requeridos
                        if (!nombreContacto || nombreContacto.trim() === '') {
                          throw new Error('El nombre del contacto principal es obligatorio. Por favor, completa este campo.')
                        }
                        if (!telefonoContacto || telefonoContacto.trim() === '') {
                          throw new Error('El teléfono del contacto principal es obligatorio. Por favor, completa este campo.')
                        }
                        
                        // Normalizar relaciones a IDs
                        const dataToSend: any = {
                          ...empresaDataToSend,
                          razon_social: editedData.razon_social || editedData.razonSocial || empresaData?.razon_social || empresaData?.razonSocial,
                          nombre_fantasia: editedData.nombre_fantasia || editedData.nombreFantasia || null,
                          tipo_sociedad: editedData.tipo_sociedad || editedData.tipoSociedad || null,
                          cuit_cuil: editedData.cuit_cuil || editedData.cuit || empresaData?.cuit_cuil || empresaData?.cuit,
                          direccion: editedData.direccion || '',
                          codigo_postal: editedData.codigo_postal || editedData.codigoPostal || null,
                          direccion_comercial: editedData.direccion_comercial || editedData.direccionComercial || null,
                          codigo_postal_comercial: editedData.codigo_postal_comercial || editedData.codigoPostalComercial || null,
                          departamento: typeof editedData.departamento === 'object' 
                            ? editedData.departamento.id 
                            : editedData.departamento,
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
                          geolocalizacion: (() => {
                            // Primero intentar con editedData
                            if (editedData.geolocalizacion) {
                              const geo = editedData.geolocalizacion
                              // Si es objeto con lat y lng válidos
                              if (typeof geo === 'object' && geo.lat != null && geo.lng != null && !isNaN(geo.lat) && !isNaN(geo.lng)) {
                                return `${geo.lat},${geo.lng}`
                              }
                              // Si es string, usarlo directamente
                              if (typeof geo === 'string' && geo.trim()) {
                                return geo
                              }
                            }
                            // Fallback: usar empresaData
                            if (empresaData?.geolocalizacion) {
                              const geo = empresaData.geolocalizacion
                              // Si es objeto con lat y lng válidos
                              if (typeof geo === 'object' && geo.lat != null && geo.lng != null && !isNaN(geo.lat) && !isNaN(geo.lng)) {
                                return `${geo.lat},${geo.lng}`
                              }
                              // Si es string, usarlo directamente
                              if (typeof geo === 'string' && geo.trim()) {
                                return geo
                              }
                            }
                            return null
                          })(),
                          telefono: (editedData.telefono && editedData.telefono.trim() !== '') ? editedData.telefono.trim() : (empresaData?.telefono || ''),
                          correo: editedData.correo || editedData.email || empresaData?.correo || empresaData?.email,
                          sitioweb: editedData.sitioweb || editedData.paginaWeb || null,
                          id_rubro: typeof editedData.id_rubro === 'object' 
                            ? editedData.id_rubro.id 
                            : editedData.id_rubro || editedData.rubro || null,
                          descripcion_actividad: editedData.descripcionActividad || null,
                          // Redes sociales - enviar solo si tienen valor, null si están vacías
                          instagram: (editedData.instagram && editedData.instagram.trim() !== '') ? editedData.instagram.trim() : null,
                          facebook: (editedData.facebook && editedData.facebook.trim() !== '') ? editedData.facebook.trim() : null,
                          linkedin: (editedData.linkedin && editedData.linkedin.trim() !== '') ? editedData.linkedin.trim() : null,
                          exporta: editedData.exporta ? (typeof editedData.exporta === 'string' ? editedData.exporta : 'Sí') : 'No, solo ventas nacionales',
                          destinoexporta: editedData.destinosExportacion || editedData.destinoexporta ? 
                            (Array.isArray(editedData.destinosExportacion) ? 
                              editedData.destinosExportacion.join(', ') : 
                              (typeof editedData.destinosExportacion === 'string' ? editedData.destinosExportacion : 
                               (editedData.destinoexporta || String(editedData.destinosExportacion || '')))) : null,
                          importa: editedData.importa === true || editedData.importa === 'si' || editedData.importa === 'Sí',
                          interes_exportar: editedData.interes_exportar === true || editedData.interes_exportar === 'si',
                          tipo_importacion: editedData.tipoImportacion || null,
                          certificado_pyme: (editedData.certificadopyme === true || editedData.certificadopyme === 'true' || editedData.certificadopyme === 'si') ? 'si' : 'no',
                          certificaciones: editedData.certificaciones ? 
                            Array.isArray(editedData.certificaciones) ? 
                              editedData.certificaciones.join(', ') : 
                              editedData.certificaciones : null,
                          material_promocional_idiomas: (editedData.promo2idiomas === true || editedData.promo2idiomas === 'true' || editedData.promo2idiomas === 'si') ? 'si' : 'no',
                          idiomas_trabajo: editedData.idiomasTrabajo || null,
                          observaciones: editedData.observaciones || null,
                          // Contacto principal
                          contacto_principal: {
                            nombre: nombreContacto.trim(),
                            apellido: apellidoContacto.trim(),
                            cargo: cargoContacto.trim(),
                            telefono: telefonoContacto.trim(),
                            email: emailContacto.trim(),
                          },
                          nombre_contacto: nombreContacto.trim(),
                          apellido_contacto: apellidoContacto.trim(),
                          cargo_contacto: cargoContacto.trim(),
                          telefono_contacto: telefonoContacto.trim(),
                          // Contactos secundarios y terciarios
                          contacto_secundario_nombre: editedData?.contacto_secundario_nombre || empresaData?.contacto_secundario_nombre || null,
                          contacto_secundario_apellido: editedData?.contacto_secundario_apellido || empresaData?.contacto_secundario_apellido || null,
                          contacto_secundario_cargo: editedData?.contacto_secundario_cargo || empresaData?.contacto_secundario_cargo || null,
                          contacto_secundario_telefono: editedData?.contacto_secundario_telefono || empresaData?.contacto_secundario_telefono || null,
                          contacto_secundario_email: editedData?.contacto_secundario_email || empresaData?.contacto_secundario_email || null,
                          contacto_terciario_nombre: editedData?.contacto_terciario_nombre || empresaData?.contacto_terciario_nombre || null,
                          contacto_terciario_apellido: editedData?.contacto_terciario_apellido || empresaData?.contacto_terciario_apellido || null,
                          contacto_terciario_cargo: editedData?.contacto_terciario_cargo || empresaData?.contacto_terciario_cargo || null,
                          contacto_terciario_telefono: editedData?.contacto_terciario_telefono || empresaData?.contacto_terciario_telefono || null,
                          contacto_terciario_email: editedData?.contacto_terciario_email || empresaData?.contacto_terciario_email || null,
                          actividades_promocion_internacional: actividadesPromocion.length > 0 
                            ? actividadesPromocion.map(a => ({
                                tipo: a.tipo,
                                lugar: a.lugar.trim(),
                                anio: a.anio.trim(),
                                observaciones: a.observaciones?.trim() || ''
                              }))
                            : [],
                        }
                        
                        // ✅ CRÍTICO: Manejar subrubros según tipo de empresa
                        if (esMixta) {
                          // Para empresas mixtas: dos subrubros separados
                          if (editedData.id_subrubro_producto) {
                            dataToSend.id_subrubro_producto = typeof editedData.id_subrubro_producto === 'object'
                              ? editedData.id_subrubro_producto.id
                              : editedData.id_subrubro_producto
                          }
                          if (editedData.id_subrubro_servicio) {
                            dataToSend.id_subrubro_servicio = typeof editedData.id_subrubro_servicio === 'object'
                              ? editedData.id_subrubro_servicio.id
                              : editedData.id_subrubro_servicio
                          }
                          // NO enviar id_subrubro para empresas mixtas
                          delete dataToSend.id_subrubro
                        } else {
                          // Para empresas de producto o servicio único
                          dataToSend.id_subrubro = editedData.id_subrubro 
                            ? (typeof editedData.id_subrubro === 'object' 
                                ? editedData.id_subrubro.id 
                                : editedData.id_subrubro)
                            : editedData.subRubro || null
                          // NO enviar subrubros separados para empresas no mixtas
                          delete dataToSend.id_subrubro_producto
                          delete dataToSend.id_subrubro_servicio
                        }
                        
                        // ✅ AGREGAR TODOS LOS CAMPOS AL FormData
                        for (const [key, value] of Object.entries(dataToSend)) {
                          // Para redes sociales, enviar null como cadena vacía para limpiar el campo
                          if ((key === 'instagram' || key === 'facebook' || key === 'linkedin') && value === null) {
                            console.log(`  ✏️ ${key}: null (limpiando campo)`)
                            formData.append(key, '')
                            continue
                          }
                          // Para geolocalizacion, siempre enviarla si tiene valor (incluso si es del original)
                          if (key === 'geolocalizacion') {
                            if (value !== null && value !== undefined && value !== '') {
                              console.log(`  ✏️ ${key}: ${value}`)
                              formData.append(key, String(value))
                            } else {
                              console.log(`  ⏭️ Saltando ${key}: ${value} (no hay geolocalización)`)
                            }
                            continue
                          }
                          // Saltar otros valores null o undefined
                          if (value === null || value === undefined) {
                            console.log(`  ⏭️ Saltando ${key}: ${value}`)
                            continue
                          }
                          
                          if (typeof value === 'object' && !(value instanceof File) && !Array.isArray(value)) {
                            console.log(`  📄 ${key}: ${JSON.stringify(value)} (JSON)`)
                            formData.append(key, JSON.stringify(value))
                          } else if (Array.isArray(value)) {
                            console.log(`  📋 ${key}: ${JSON.stringify(value)} (Array)`)
                            formData.append(key, JSON.stringify(value))
                          } else {
                            console.log(`  ✏️ ${key}: ${value}`)
                            formData.append(key, String(value))
                          }
                        }
                        
                        console.log('📤 [handleSave] Guardando empresa (datos básicos + archivo)')
                        console.log('📤 [handleSave] Tipo empresa para backend:', tipoEmpresa)
                        
                        // ✅ USAR FormData en lugar de JSON
                        try {
                          await api.updateEmpresa(solicitudId, formData)
                        } catch (error) {
                          // Fallback: usar el endpoint de solicitud si falla
                          console.warn('[Perfil] Error actualizando empresa, intentando con solicitud:', error)
                          // Convertir FormData a JSON para el fallback
                          const jsonData: any = {}
                          for (const [key, value] of Object.entries(dataToSend)) {
                            if (value !== null && value !== undefined) {
                              jsonData[key] = value
                            }
                          }
                          await api.updatePerfil(solicitudId, jsonData)
                        }
                        
                        // 3. GUARDAR PRODUCTOS (para empresas de producto o mixta)
                        if (esProducto || esMixta) {
                          const productosData = esMixta ? (editedData?.productos_mixta || []) : (editedData?.productos || [])
                          
                          if (productosData && Array.isArray(productosData)) {
                            console.log('📦 [handleSave] Procesando productos:', productosData.length)
                            
                            // Obtener IDs de productos actuales
                            const productosActualesIds = productosData
                              .filter((p: any) => p.id && !String(p.id).startsWith('temp-'))
                              .map((p: any) => p.id)
                            
                            // Obtener IDs de productos originales
                            const productosOriginales = esMixta 
                              ? (empresaData?.productos_mixta || [])
                              : (empresaData?.productos || [])
                            const productosOriginalesIds = productosOriginales.map((p: any) => p.id).filter((id: any) => id)
                            
                            // Eliminar productos que ya no están
                            const productosAEliminar = productosOriginalesIds.filter(
                              (id: number) => !productosActualesIds.includes(id)
                            )
                            
                            for (const id of productosAEliminar) {
                              console.log('🗑️ [handleSave] Eliminando producto:', id)
                              if (esMixta) {
                                await api.deleteProductoMixta(id)
                              } else {
                                await api.deleteProducto(id)
                              }
                            }
                            
                            // Crear o actualizar productos
                            for (const producto of productosData) {
                              const productoData: any = {
                                nombre_producto: producto.nombre_producto || producto.nombre || '',
                                descripcion: producto.descripcion || '',
                                capacidad_productiva: producto.capacidad_productiva || producto.capacidadProductiva || null,
                                unidad_medida: producto.unidad_medida || producto.unidadMedida || 'kg',
                                periodo_capacidad: producto.periodo_capacidad || producto.periodoCapacidad || 'mensual',
                                es_principal: producto.es_principal || false,
                                precio_estimado: producto.precio_estimado || null,
                                moneda_precio: producto.moneda_precio || 'ARS',
                                empresa: solicitudId,
                              }
                              
                              // Agregar código arancelario si existe
                              if (producto.posicion_arancelaria) {
                                const codigo = typeof producto.posicion_arancelaria === 'object'
                                  ? producto.posicion_arancelaria.codigo_arancelario
                                  : producto.posicion_arancelaria
                                if (codigo) {
                                  productoData.codigo_arancelario_input = codigo
                                }
                              }
                              
                              if (producto.id && !String(producto.id).startsWith('temp-')) {
                                console.log('✏️ [handleSave] Actualizando producto:', producto.id)
                                if (esMixta) {
                                  await api.updateProductoMixta(producto.id, productoData)
                                } else {
                                  await api.updateProducto(producto.id, productoData)
                                }
                              } else {
                                console.log('➕ [handleSave] Creando producto nuevo')
                                if (esMixta) {
                                  await api.createProductoMixta(productoData)
                                } else {
                                  await api.createProducto(productoData)
                                }
                              }
                            }
                          }
                        }
                        
                        // 4. GUARDAR SERVICIOS (para empresas de servicio o mixta)
                        if (esServicio || esMixta) {
                          const serviciosData = esMixta ? (editedData?.servicios_mixta || []) : (editedData?.servicios || [])
                          
                          if (serviciosData && Array.isArray(serviciosData)) {
                            console.log('🔧 [handleSave] Procesando servicios:', serviciosData.length)
                            
                            const serviciosActualesIds = serviciosData
                              .filter((s: any) => s.id && !String(s.id).startsWith('temp-'))
                              .map((s: any) => s.id)
                            
                            const serviciosOriginales = esMixta
                              ? (empresaData?.servicios_mixta || [])
                              : (empresaData?.servicios || [])
                            const serviciosOriginalesIds = serviciosOriginales.map((s: any) => s.id).filter((id: any) => id)
                            
                            const serviciosAEliminar = serviciosOriginalesIds.filter(
                              (id: number) => !serviciosActualesIds.includes(id)
                            )
                            
                            for (const id of serviciosAEliminar) {
                              console.log('🗑️ [handleSave] Eliminando servicio:', id)
                              if (esMixta) {
                                await api.deleteServicioMixta(id)
                              } else {
                                await api.deleteServicio(id)
                              }
                            }
                            
                            for (const servicio of serviciosData) {
                              const servicioData = {
                                nombre_servicio: servicio.nombre_servicio || servicio.nombre || servicio.descripcion || '',
                                descripcion: servicio.descripcion || '',
                                tipo_servicio: servicio.tipo_servicio || servicio.tipoServicio || '',
                                sector_atendido: servicio.sector_atendido || (Array.isArray(servicio.sectores) ? servicio.sectores.join(', ') : servicio.sectores) || '',
                                alcance_servicio: servicio.alcance_servicio || servicio.alcanceGeografico || servicio.alcance_geografico || 'local',
                                paises_trabaja: servicio.paises_trabaja || servicio.paises_destino || '',
                                exporta_servicios: servicio.exporta_servicios || servicio.exporta_servicios_alias || false,
                                interes_exportar_servicios: servicio.interes_exportar_servicios || servicio.interes_exportar || false,
                                idiomas_trabajo: Array.isArray(servicio.idiomas_trabajo) 
                                  ? servicio.idiomas_trabajo.join(', ') 
                                  : (servicio.idiomas_trabajo || ''),
                                forma_contratacion: Array.isArray(servicio.forma_contratacion)
                                  ? servicio.forma_contratacion[0]
                                  : (servicio.forma_contratacion || 'hora'),
                                certificaciones_tecnicas: servicio.certificaciones_tecnicas || '',
                                tiene_equipo_tecnico: servicio.tiene_equipo_tecnico || false,
                                equipo_tecnico_formacion: servicio.equipo_tecnico_formacion || false,
                                es_principal: servicio.es_principal || false,
                                empresa: solicitudId,
                              }
                              
                              if (servicio.id && !String(servicio.id).startsWith('temp-')) {
                                console.log('✏️ [handleSave] Actualizando servicio:', servicio.id)
                                if (esMixta) {
                                  await api.updateServicioMixta(servicio.id, servicioData)
                                } else {
                                  await api.updateServicio(servicio.id, servicioData)
                                }
                              } else {
                                console.log('➕ [handleSave] Creando servicio nuevo')
                                if (esMixta) {
                                  await api.createServicioMixta(servicioData)
                                } else {
                                  await api.createServicio(servicioData)
                                }
                              }
                            }
                          }
                        }
                        
                        // 5. RECARGAR LA EMPRESA ACTUALIZADA
                        console.log('🔄 [handleSave] Recargando empresa actualizada')
                        try {
                          const updatedEmpresa = await api.getEmpresaById(solicitudId)
                          // Normalizar datos de la empresa actualizada
                          const empresa = updatedEmpresa
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
                            certificadopyme: empresa.certificadopyme === true || empresa.certificadopyme === 'true' || empresa.certificadopyme === 'si',
                            certificaciones: empresa.certificaciones
                              ? (Array.isArray(empresa.certificaciones)
                                  ? empresa.certificaciones
                                  : typeof empresa.certificaciones === 'string'
                                  ? empresa.certificaciones.split(',').map((c: string) => c.trim()).filter((c: string) => c)
                                  : [])
                              : [],
                            promo2idiomas: empresa.promo2idiomas === true || empresa.promo2idiomas === 'true' || empresa.promo2idiomas === 'si',
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
                            
                            // Productos mixta - normalizar formato (para empresas mixtas)
                            productos_mixta: (() => {
                              const tipoEmpresa = empresa.tipo_empresa_valor || empresa.tipo_empresa
                              if (tipoEmpresa === 'mixta') {
                                const productos = empresa.productos_mixta || empresa.productos || empresa.productos_empresa || []
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
                            
                            // Servicios mixta - normalizar formato (para empresas mixtas)
                            servicios_mixta: (() => {
                              const tipoEmpresa = empresa.tipo_empresa_valor || empresa.tipo_empresa
                              if (tipoEmpresa === 'mixta') {
                                const servicios = empresa.servicios_mixta || empresa.servicios || empresa.servicios_empresa || empresa.servicios_ofrecidos || []
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
                              }
                              return []
                            })(),
                            servicios_ofrecidos: empresa.servicios_ofrecidos || empresa.servicios || [],
                            
                            // Contactos - Construir array asegurando que siempre incluya el contacto principal
                            contacto_principal_nombre: empresa.contacto_principal_nombre || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.nombre : null),
                            contacto_principal_apellido: empresa.contacto_principal_apellido || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.apellido : null),
                            contacto_principal_cargo: empresa.contacto_principal_cargo || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.cargo : null),
                            contacto_principal_telefono: empresa.contacto_principal_telefono || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.telefono : null) || empresa.telefono || null,
                            contacto_principal_email: empresa.contacto_principal_email || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.email : null) || empresa.correo || empresa.email || null,
                            // Contactos secundarios y terciarios - campos individuales
                            contacto_secundario_nombre: empresa.contacto_secundario_nombre || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.nombre : null),
                            contacto_secundario_apellido: empresa.contacto_secundario_apellido || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.apellido : null),
                            contacto_secundario_cargo: empresa.contacto_secundario_cargo || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.cargo : null),
                            contacto_secundario_telefono: empresa.contacto_secundario_telefono || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.telefono : null),
                            contacto_secundario_email: empresa.contacto_secundario_email || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.email : null),
                            contacto_terciario_nombre: empresa.contacto_terciario_nombre || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.nombre : null),
                            contacto_terciario_apellido: empresa.contacto_terciario_apellido || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.apellido : null),
                            contacto_terciario_cargo: empresa.contacto_terciario_cargo || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.cargo : null),
                            contacto_terciario_telefono: empresa.contacto_terciario_telefono || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.telefono : null),
                            contacto_terciario_email: empresa.contacto_terciario_email || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.email : null),
                            contactos: (() => {
                              // Si existe un array de contactos válido
                              if (Array.isArray(empresa.contactos) && empresa.contactos.length > 0) {
                                // Verificar si ya incluye el contacto principal
                                const tienePrincipal = empresa.contactos.some((c: any) => c.tipo === 'Principal')
                                if (tienePrincipal) {
                                  return empresa.contactos
                                }
                              }
                              
                              // Construir array de contactos con el contacto principal
                              const contactosArray: any[] = []
                              
                              // Agregar contacto principal desde campos individuales o desde el array
                              const contactoPrincipalDesdeArray = Array.isArray(empresa.contactos) 
                                ? empresa.contactos.find((c: any) => c.tipo === 'Principal')
                                : null
                              
                              const contactoPrincipal = {
                                tipo: 'Principal',
                                nombre: empresa.contacto_principal_nombre || contactoPrincipalDesdeArray?.nombre || '',
                                apellido: empresa.contacto_principal_apellido || contactoPrincipalDesdeArray?.apellido || '',
                                cargo: empresa.contacto_principal_cargo || contactoPrincipalDesdeArray?.cargo || '',
                                telefono: empresa.contacto_principal_telefono || contactoPrincipalDesdeArray?.telefono || empresa.telefono || '',
                                email: empresa.contacto_principal_email || contactoPrincipalDesdeArray?.email || empresa.correo || empresa.email || '',
                              }
                              contactosArray.push(contactoPrincipal)
                              
                              // Agregar contactos secundarios si existen
                              if (Array.isArray(empresa.contactos)) {
                                const secundarios = empresa.contactos.filter((c: any) => c.tipo === 'Secundario')
                                contactosArray.push(...secundarios)
                              }
                              
                              // Agregar contactos terciarios si existen
                              if (Array.isArray(empresa.contactos)) {
                                const terciarios = empresa.contactos.filter((c: any) => c.tipo === 'Terciario')
                                contactosArray.push(...terciarios)
                              }
                              
                              return contactosArray
                            })(),
                            
                            // Actividades de promoción
                            actividades_promocion_internacional: empresa.actividades_promocion_internacional || empresa.feriasAsistidas || [],
                            feriasAsistidas: empresa.actividades_promocion_internacional || empresa.feriasAsistidas || [],
                            
                            // Redes sociales - preservar valores (incluyendo null y undefined)
                            instagram: empresa.instagram !== null && empresa.instagram !== undefined ? empresa.instagram : '',
                            facebook: empresa.facebook !== null && empresa.facebook !== undefined ? empresa.facebook : '',
                            linkedin: empresa.linkedin !== null && empresa.linkedin !== undefined ? empresa.linkedin : '',
                            
                            // Otros
                            observaciones: empresa.observaciones,
                            categoria_matriz: empresa.categoria_matriz,
                            fecha_creacion: empresa.fecha_creacion,
                            fecha_actualizacion: empresa.fecha_actualizacion,
                            brochure: empresa.brochure || null,
                          }
                          
                          setEmpresaData(normalizedEmpresa)
                          setEditedData(normalizedEmpresa)
                        } catch (error) {
                          // Fallback: usar getCurrentUser si getEmpresaById falla
                          console.warn('[Perfil] Error obteniendo empresa por ID, usando getCurrentUser:', error)
                          const userData = await api.getCurrentUser()
                          if (userData.empresa) {
                            // Usar la misma lógica de normalización que en la carga inicial
                            const empresa = userData.empresa
                            const normalizedEmpresa: any = {
                              // ... (misma normalización que arriba)
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
                              telefono: empresa.telefono,
                              correo: empresa.correo || empresa.email,
                              email: empresa.correo || empresa.email,
                              sitioweb: empresa.sitioweb || empresa.paginaWeb,
                              paginaWeb: empresa.sitioweb || empresa.paginaWeb,
                              id_rubro: empresa.id_rubro || empresa.rubro,
                              rubro: empresa.id_rubro || empresa.rubro,
                              rubro_nombre: empresa.rubro_nombre || (typeof empresa.id_rubro === 'object' ? empresa.id_rubro.nombre : null) || empresa.rubro,
                              id_subrubro: empresa.id_subrubro || empresa.subRubro,
                              sub_rubro_nombre: empresa.sub_rubro_nombre || empresa.subRubroNombre,
                              exporta: empresa.exporta,
                              destinoexporta: empresa.destinoexporta || empresa.destino_exportacion || empresa.destinosExportacion,
                              destinosExportacion: Array.isArray(empresa.destinosExportacion) 
                                ? empresa.destinosExportacion 
                                : (typeof empresa.destinoexporta === 'string'
                                    ? empresa.destinoexporta.split(',').map((d: string) => d.trim()).filter((d: string) => d)
                                    : []),
                              importa: empresa.importa,
                              interes_exportar: empresa.interes_exportar || empresa.interesExportar,
                              certificadopyme: empresa.certificadopyme === true || empresa.certificadopyme === 'true' || empresa.certificadopyme === 'si',
                              certificaciones: empresa.certificaciones
                                ? (Array.isArray(empresa.certificaciones)
                                    ? empresa.certificaciones
                                    : typeof empresa.certificaciones === 'string'
                                    ? empresa.certificaciones.split(',').map((c: string) => c.trim()).filter((c: string) => c)
                                    : [])
                                : [],
                              promo2idiomas: empresa.promo2idiomas === true || empresa.promo2idiomas === 'true' || empresa.promo2idiomas === 'si',
                              idiomas_trabaja: empresa.idiomas_trabaja || empresa.idiomasTrabajo,
                              idiomasTrabajo: empresa.idiomas_trabaja || empresa.idiomasTrabajo,
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
                              
                              // Productos mixta - normalizar formato (para empresas mixtas)
                              productos_mixta: (() => {
                                const tipoEmpresa = empresa.tipo_empresa_valor || empresa.tipo_empresa
                                if (tipoEmpresa === 'mixta') {
                                  const productos = empresa.productos_mixta || empresa.productos || empresa.productos_empresa || []
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
                                }
                                return []
                              })(),
                              
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
                              
                              // Servicios mixta - normalizar formato (para empresas mixtas)
                              servicios_mixta: (() => {
                                const tipoEmpresa = empresa.tipo_empresa_valor || empresa.tipo_empresa
                                if (tipoEmpresa === 'mixta') {
                                  const servicios = empresa.servicios_mixta || empresa.servicios || empresa.servicios_empresa || empresa.servicios_ofrecidos || []
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
                                }
                                return []
                              })(),
                              servicios_ofrecidos: empresa.servicios_ofrecidos || empresa.servicios || [],
                              contacto_principal_nombre: empresa.contacto_principal_nombre || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.nombre : null),
                              contacto_principal_apellido: empresa.contacto_principal_apellido || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.apellido : null),
                              contacto_principal_cargo: empresa.contacto_principal_cargo || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.cargo : null),
                              contacto_principal_telefono: empresa.contacto_principal_telefono || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.telefono : null) || empresa.telefono || null,
                              contacto_principal_email: empresa.contacto_principal_email || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Principal')?.email : null) || empresa.correo || empresa.email || null,
                              // Contactos secundarios y terciarios - campos individuales
                              contacto_secundario_nombre: empresa.contacto_secundario_nombre || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.nombre : null),
                              contacto_secundario_apellido: empresa.contacto_secundario_apellido || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.apellido : null),
                              contacto_secundario_cargo: empresa.contacto_secundario_cargo || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.cargo : null),
                              contacto_secundario_telefono: empresa.contacto_secundario_telefono || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.telefono : null),
                              contacto_secundario_email: empresa.contacto_secundario_email || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Secundario')?.email : null),
                              contacto_terciario_nombre: empresa.contacto_terciario_nombre || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.nombre : null),
                              contacto_terciario_apellido: empresa.contacto_terciario_apellido || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.apellido : null),
                              contacto_terciario_cargo: empresa.contacto_terciario_cargo || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.cargo : null),
                              contacto_terciario_telefono: empresa.contacto_terciario_telefono || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.telefono : null),
                              contacto_terciario_email: empresa.contacto_terciario_email || (empresa.contactos && Array.isArray(empresa.contactos) ? empresa.contactos.find((c: any) => c.tipo === 'Terciario')?.email : null),
                              contactos: (() => {
                                if (Array.isArray(empresa.contactos) && empresa.contactos.length > 0) {
                                  const tienePrincipal = empresa.contactos.some((c: any) => c.tipo === 'Principal')
                                  if (tienePrincipal) {
                                    return empresa.contactos
                                  }
                                }
                                const contactosArray: any[] = []
                                const contactoPrincipalDesdeArray = Array.isArray(empresa.contactos) 
                                  ? empresa.contactos.find((c: any) => c.tipo === 'Principal')
                                  : null
                                const contactoPrincipal = {
                                  tipo: 'Principal',
                                  nombre: empresa.contacto_principal_nombre || contactoPrincipalDesdeArray?.nombre || '',
                                  apellido: empresa.contacto_principal_apellido || contactoPrincipalDesdeArray?.apellido || '',
                                  cargo: empresa.contacto_principal_cargo || contactoPrincipalDesdeArray?.cargo || '',
                                  telefono: empresa.contacto_principal_telefono || contactoPrincipalDesdeArray?.telefono || empresa.telefono || '',
                                  email: empresa.contacto_principal_email || contactoPrincipalDesdeArray?.email || empresa.correo || empresa.email || '',
                                }
                                contactosArray.push(contactoPrincipal)
                                if (Array.isArray(empresa.contactos)) {
                                  const secundarios = empresa.contactos.filter((c: any) => c.tipo === 'Secundario')
                                  contactosArray.push(...secundarios)
                                }
                                if (Array.isArray(empresa.contactos)) {
                                  const terciarios = empresa.contactos.filter((c: any) => c.tipo === 'Terciario')
                                  contactosArray.push(...terciarios)
                                }
                                return contactosArray
                              })(),
                              actividades_promocion_internacional: empresa.actividades_promocion_internacional || empresa.feriasAsistidas || [],
                              feriasAsistidas: empresa.actividades_promocion_internacional || empresa.feriasAsistidas || [],
                              // Redes sociales - preservar valores (incluyendo null y undefined)
                              instagram: empresa.instagram !== null && empresa.instagram !== undefined ? empresa.instagram : '',
                              facebook: empresa.facebook !== null && empresa.facebook !== undefined ? empresa.facebook : '',
                              linkedin: empresa.linkedin !== null && empresa.linkedin !== undefined ? empresa.linkedin : '',
                              observaciones: empresa.observaciones,
                              categoria_matriz: empresa.categoria_matriz,
                              fecha_creacion: empresa.fecha_creacion,
                              fecha_actualizacion: empresa.fecha_actualizacion,
                              brochure: empresa.brochure || null,
                            }
                            setEmpresaData(normalizedEmpresa)
                            setEditedData(normalizedEmpresa)
                          }
                        }
                        
                        setIsEditing(false)
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
                    className="bg-green-500/20 border-green-500/50 text-white hover:bg-green-500/30 text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4 disabled:opacity-50"
                  >
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {isSaving ? <span className="hidden xs:inline">Guardando...</span> : <span>Guardar</span>}
                  </Button>
                </>
              )}
              <Button
                onClick={logout}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm md:text-base h-8 sm:h-9 md:h-10 px-2 sm:px-3 md:px-4"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Cerrar Sesión</span>
                <span className="xs:hidden">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 overflow-x-hidden">
        {/* Company Header */}
        <Card className="p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 bg-gradient-to-r from-[#3259B5] to-[#629BD2] text-white w-full max-w-full overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 break-words">{empresaData?.razonSocial || 'Empresa'}</h2>
              {empresaData.nombreFantasia && (
                <p className="text-xs sm:text-sm md:text-base text-white/80 mb-2 break-words">Nombre de Fantasía: {empresaData.nombreFantasia}</p>
              )}
              <p className="text-xs sm:text-sm md:text-base text-white/90 mb-4 break-words">CUIT: {empresaData.cuit || 'N/A'}</p>
              </div>
            </div>
        </Card>

        <Tabs defaultValue="general" className="w-full max-w-full">
          <div className="mb-4 sm:mb-6 w-full max-w-full">
            <TabsList className="flex flex-col sm:flex-row w-full max-w-full h-auto sm:h-10 gap-2 sm:gap-1 p-2 sm:p-1 bg-muted/50 rounded-lg">
              <TabsTrigger value="general" className="w-full sm:w-auto text-xs sm:text-sm px-4 py-3 sm:py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">General</TabsTrigger>
              <TabsTrigger value="ubicacion" className="w-full sm:w-auto text-xs sm:text-sm px-4 py-3 sm:py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Ubicación</TabsTrigger>
              <TabsTrigger value="comercial" className="w-full sm:w-auto text-xs sm:text-sm px-4 py-3 sm:py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Comercial</TabsTrigger>
              <TabsTrigger value="productos-servicios" className="w-full sm:w-auto text-xs sm:text-sm px-4 py-3 sm:py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Productos/Servicios</TabsTrigger>
              <TabsTrigger value="certificaciones" className="w-full sm:w-auto text-xs sm:text-sm px-4 py-3 sm:py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Certificaciones</TabsTrigger>
              <TabsTrigger value="configuracion" className="w-full sm:w-auto text-xs sm:text-sm px-4 py-3 sm:py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Configuración</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="space-y-4 sm:space-y-6 w-full max-w-full mt-0">
            <Card className="w-full max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="text-[#222A59] text-base sm:text-lg md:text-xl">Datos de la Empresa</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 w-full max-w-full overflow-hidden">
                {/* Razón Social */}
                <div className="min-w-0">
                  <Label>Razón Social</Label>
                  {isEditing ? (
                    <Input
                      value={editedData?.razon_social || editedData?.razonSocial || ''}
                      onChange={(e) => setEditedData(editedData ? { ...editedData, razon_social: e.target.value, razonSocial: e.target.value } : null)}
                      className="w-full max-w-full"
                    />
                  ) : (
                    <p className="mt-1 font-semibold break-words overflow-wrap-anywhere">{empresaData?.razon_social || empresaData?.razonSocial}</p>
                  )}
                </div>

                {/* Nombre de Fantasía */}
                <div className="min-w-0">
                  <Label>Nombre de Fantasía</Label>
                  {isEditing ? (
                    <Input
                      value={editedData?.nombre_fantasia || editedData?.nombreFantasia || ''}
                      onChange={(e) => setEditedData(editedData ? { ...editedData, nombre_fantasia: e.target.value, nombreFantasia: e.target.value } : null)}
                      className="w-full max-w-full"
                    />
                  ) : (
                    <p className="mt-1 font-semibold break-words overflow-wrap-anywhere">{empresaData?.nombre_fantasia || empresaData?.nombreFantasia || 'N/A'}</p>
                  )}
                </div>

                {/* CUIT */}
                <div className="min-w-0">
                  <Label>CUIT</Label>
                  {isEditing ? (
                    <Input
                      value={editedData?.cuit_cuil || editedData?.cuit || ''}
                      onChange={(e) => setEditedData(editedData ? { ...editedData, cuit_cuil: e.target.value, cuit: e.target.value } : null)}
                      className="w-full max-w-full"
                    />
                  ) : (
                    <p className="mt-1 font-semibold break-words overflow-wrap-anywhere">{empresaData?.cuit_cuil || empresaData?.cuit}</p>
                  )}
                </div>

                {/* Tipo de Sociedad */}
                <div className="min-w-0">
                  <Label>Tipo de Sociedad</Label>
                  {isEditing ? (
                    <Select
                      value={editedData?.tipo_sociedad || editedData?.tipoSociedad || ''}
                      onValueChange={(value) => setEditedData(editedData ? { ...editedData, tipo_sociedad: value, tipoSociedad: value } : null)}
                    >
                      <SelectTrigger className="w-full max-w-full">
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
                <div className="min-w-0 w-full">
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
                <div className="min-w-0 w-full">
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
                <div className="min-w-0 w-full">
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

                {/* Email (Email del usuario para iniciar sesión) */}
                <div className="min-w-0 w-full">
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={userProfile?.email || user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{userProfile?.email || user?.email || 'N/A'}</p>
                  )}
                </div>

                {/* Sitio Web */}
                <div className="min-w-0 w-full">
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
                {((empresaData?.instagram && empresaData.instagram.trim() !== '') || 
                  (empresaData?.facebook && empresaData.facebook.trim() !== '') || 
                  (empresaData?.linkedin && empresaData.linkedin.trim() !== '') || 
                  isEditing) && (
                  <div className="md:col-span-2">
                    <Label>Redes Sociales</Label>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-full">
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
                {(empresaData?.contacto_principal_nombre || empresaData?.contacto_principal_apellido || empresaData?.contacto_principal_cargo || empresaData?.contacto_principal_telefono || empresaData?.contacto_principal_email || isEditing) && (
                  <div className="md:col-span-2">
                    <Label>Contacto Principal</Label>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg w-full max-w-full">
                      <div>
                        <span className="text-sm text-muted-foreground">Nombre</span>
                        {isEditing ? (
                          <Input
                            value={editedData?.contacto_principal_nombre || ''}
                            onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_nombre: e.target.value } : null)}
                          />
                        ) : (
                          <p className="mt-1 font-semibold">{empresaData?.contacto_principal_nombre || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Apellido</span>
                        {isEditing ? (
                          <Input
                            value={editedData?.contacto_principal_apellido || ''}
                            onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_apellido: e.target.value } : null)}
                          />
                        ) : (
                          <p className="mt-1 font-semibold">{empresaData?.contacto_principal_apellido || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Cargo</span>
                        {isEditing ? (
                          <Input
                            value={editedData?.contacto_principal_cargo || ''}
                            onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_cargo: e.target.value } : null)}
                          />
                        ) : (
                          <p className="mt-1 font-semibold">{empresaData?.contacto_principal_cargo || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Teléfono</span>
                        {isEditing ? (
                          <Input
                            value={editedData?.contacto_principal_telefono || ''}
                            onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_telefono: e.target.value } : null)}
                          />
                        ) : (
                          <p className="mt-1 font-semibold">{empresaData?.contacto_principal_telefono || 'N/A'}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Email</span>
                        {isEditing ? (
                          <Input
                            type="email"
                            value={editedData?.contacto_principal_email || ''}
                            onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_email: e.target.value } : null)}
                          />
                        ) : (
                          <p className="mt-1 font-semibold">{empresaData?.contacto_principal_email || 'N/A'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Contactos Secundarios y Terciarios */}
                {(empresaData?.contacto_secundario_nombre || empresaData?.contacto_terciario_nombre || isEditing) && (
                  <div className="md:col-span-2">
                    <Label>Contactos Adicionales</Label>
                    <div className="mt-2 space-y-4">
                      {/* Contacto Secundario */}
                      {(empresaData?.contacto_secundario_nombre || isEditing) && (
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <h4 className="font-semibold text-sm mb-3">Contacto Secundario</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Nombre</span>
                              {isEditing ? (
                                <Input
                                  value={editedData?.contacto_secundario_nombre || ''}
                                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_secundario_nombre: e.target.value } : null)}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{empresaData?.contacto_secundario_nombre || 'N/A'}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Apellido</span>
                              {isEditing ? (
                                <Input
                                  value={editedData?.contacto_secundario_apellido || ''}
                                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_secundario_apellido: e.target.value } : null)}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{empresaData?.contacto_secundario_apellido || 'N/A'}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Cargo</span>
                              {isEditing ? (
                                <Input
                                  value={editedData?.contacto_secundario_cargo || ''}
                                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_secundario_cargo: e.target.value } : null)}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{empresaData?.contacto_secundario_cargo || 'N/A'}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Teléfono</span>
                              {isEditing ? (
                                <Input
                                  value={editedData?.contacto_secundario_telefono || ''}
                                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_secundario_telefono: e.target.value } : null)}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{empresaData?.contacto_secundario_telefono || 'N/A'}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Email</span>
                              {isEditing ? (
                                <Input
                                  type="email"
                                  value={editedData?.contacto_secundario_email || ''}
                                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_secundario_email: e.target.value } : null)}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{empresaData?.contacto_secundario_email || 'N/A'}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Contacto Terciario */}
                      {(empresaData?.contacto_terciario_nombre || isEditing) && (
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <h4 className="font-semibold text-sm mb-3">Contacto Terciario</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="text-sm text-muted-foreground">Nombre</span>
                              {isEditing ? (
                                <Input
                                  value={editedData?.contacto_terciario_nombre || ''}
                                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_terciario_nombre: e.target.value } : null)}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{empresaData?.contacto_terciario_nombre || 'N/A'}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Apellido</span>
                              {isEditing ? (
                                <Input
                                  value={editedData?.contacto_terciario_apellido || ''}
                                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_terciario_apellido: e.target.value } : null)}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{empresaData?.contacto_terciario_apellido || 'N/A'}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Cargo</span>
                              {isEditing ? (
                                <Input
                                  value={editedData?.contacto_terciario_cargo || ''}
                                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_terciario_cargo: e.target.value } : null)}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{empresaData?.contacto_terciario_cargo || 'N/A'}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Teléfono</span>
                              {isEditing ? (
                                <Input
                                  value={editedData?.contacto_terciario_telefono || ''}
                                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_terciario_telefono: e.target.value } : null)}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{empresaData?.contacto_terciario_telefono || 'N/A'}</p>
                              )}
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Email</span>
                              {isEditing ? (
                                <Input
                                  type="email"
                                  value={editedData?.contacto_terciario_email || ''}
                                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_terciario_email: e.target.value } : null)}
                                />
                              ) : (
                                <p className="mt-1 font-semibold">{empresaData?.contacto_terciario_email || 'N/A'}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="ubicacion" className="space-y-6 w-full max-w-full mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Ubicación</CardTitle>
                <CardDescription>Dirección, código postal, departamento, municipio, localidad y geolocalización</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 w-full max-w-full overflow-hidden p-4 sm:p-6">
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
                          onChange={(e) => setEditedData(editedData ? { 
                            ...editedData, 
                            direccion: e.target.value,
                            geolocalizacion: editedData.geolocalizacion || empresaData?.geolocalizacion || null
                          } : null)}
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
                          onChange={(e) => setEditedData(editedData ? { 
                            ...editedData, 
                            codigo_postal: e.target.value, 
                            codigoPostal: e.target.value,
                            geolocalizacion: editedData.geolocalizacion || empresaData?.geolocalizacion || null
                          } : null)}
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
                              localidad: null,
                              geolocalizacion: editedData.geolocalizacion || empresaData?.geolocalizacion || null
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
                              localidad: null,
                              geolocalizacion: editedData.geolocalizacion || empresaData?.geolocalizacion || null
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
                            setEditedData(editedData ? { 
                              ...editedData, 
                              localidad: parseInt(value),
                              geolocalizacion: editedData.geolocalizacion || empresaData?.geolocalizacion || null
                            } : null)
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
                    {(() => {
                      // Función auxiliar para obtener coordenadas válidas
                      const getValidCoordinates = (geoData: any): string | null => {
                        if (!geoData) return null
                        
                        if (typeof geoData === 'string' && geoData.trim()) {
                          try {
                            const parts = geoData.split(',').map(v => parseFloat(v.trim()))
                            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                              return `${parts[0]},${parts[1]}`
                            }
                          } catch (error) {
                            console.error('Error parsing geolocalizacion:', error)
                          }
                        } else if (typeof geoData === 'object' && geoData.lat != null && geoData.lng != null) {
                          const lat = Number(geoData.lat)
                          const lng = Number(geoData.lng)
                          if (!isNaN(lat) && !isNaN(lng)) {
                            return `${lat},${lng}`
                          }
                        }
                        return null
                      }

                      // Función auxiliar para convertir coordenadas string a objeto
                      const parseCoordinates = (geoString: string | null): { lat: number; lng: number } | null => {
                        if (!geoString) return null
                        try {
                          const parts = geoString.split(',').map(v => parseFloat(v.trim()))
                          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                            return { lat: parts[0], lng: parts[1] }
                          }
                        } catch (error) {
                          console.error('Error parsing coordinates:', error)
                        }
                        return null
                      }

                      // Si no estamos editando, mostrar el mapa solo si hay coordenadas válidas
                      const coordString = getValidCoordinates(empresaData?.geolocalizacion)
                      if (!coordString) return null
                      
                      const coordinates = parseCoordinates(coordString)
                      if (!coordinates) return null

                      // Si estamos en modo edición general y no estamos editando el mapa específicamente
                      if (isEditing && geoEditMode !== 'editing') {
                        return (
                          <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-2">
                              <Label>Ubicación en el Mapa</Label>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setGeoEditMode('editing')
                                  setTempGeoCoordinates(coordinates)
                                }}
                                className="gap-2"
                              >
                                <MapPin className="h-4 w-4" />
                                Editar Mapa
                              </Button>
              </div>
                            <div className="mt-2 relative z-0">
                              <CompanyMap
                                coordinates={coordinates}
                                address={empresaData?.direccion || empresaData?.razon_social || empresaData?.razonSocial}
                              />
                            </div>
                          </div>
                        )
                      }

                      // Modo edición activa del mapa
                      if (geoEditMode === 'editing') {
                        const currentCoords = tempGeoCoordinates || coordinates
                        const coordStringForPicker = `${currentCoords.lat},${currentCoords.lng}`
                        
                        return (
                          <div className="md:col-span-2">
                            <Label>Ubicación en el Mapa</Label>
                            <div className="mt-2 relative z-0">
                              <LocationPicker
                                value={coordStringForPicker}
                                onChange={(coords) => {
                                  const [lat, lng] = coords.split(',').map((v: string) => parseFloat(v.trim()))
                                  if (!isNaN(lat) && !isNaN(lng)) {
                                    setTempGeoCoordinates({ lat, lng })
                                  }
                                }}
                                centerLat={currentCoords.lat}
                                centerLng={currentCoords.lng}
                                zoomLevel={15}
                              />
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setGeoEditMode('view')
                                  setTempGeoCoordinates(null)
                                }}
                                className="flex-1"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                              </Button>
                              <Button
                                onClick={() => {
                                  if (tempGeoCoordinates) {
                                    setShowGeoConfirmDialog(true)
                                  }
                                }}
                                className="flex-1 bg-[#3259B5] hover:bg-[#3259B5]/90"
                                disabled={!tempGeoCoordinates || isSaving}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Confirmar
                              </Button>
                            </div>
                          </div>
                        )
                      }

                      // Modo visualización (no edición)
                      return (
                        <div className="md:col-span-2">
                          <Label>Ubicación en el Mapa</Label>
                          <div className="mt-2 relative z-0">
                            <CompanyMap
                              coordinates={coordinates}
                              address={empresaData?.direccion || empresaData?.razon_social || empresaData?.razonSocial}
                            />
                          </div>
                        </div>
                      )
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
                          onChange={(e) => setEditedData(editedData ? { 
                            ...editedData, 
                            direccion_comercial: e.target.value, 
                            direccionComercial: e.target.value,
                            geolocalizacion: editedData.geolocalizacion || empresaData?.geolocalizacion || null
                          } : null)}
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
                          onChange={(e) => setEditedData(editedData ? { 
                            ...editedData, 
                            codigo_postal_comercial: e.target.value, 
                            codigoPostalComercial: e.target.value,
                            geolocalizacion: editedData.geolocalizacion || empresaData?.geolocalizacion || null
                          } : null)}
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

          <TabsContent value="comercial" className="space-y-6 w-full max-w-full mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Actividad Comercial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 w-full max-w-full overflow-hidden p-4 sm:p-6">
                {/* Datos de exportación/importación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>¿Exporta?</Label>
                    {isEditing ? (
                      <Select
                        value={editedData?.exporta || empresaData?.exporta || ''}
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
                  {((editedData?.exporta || empresaData?.exporta) === "No, solo ventas nacionales" || (editedData?.exporta || empresaData?.exporta) === "No") && (
                    <div>
                      <Label>¿Interés en Exportar?</Label>
                      {isEditing ? (
                        <Select
                          value={(editedData?.interes_exportar === true || editedData?.interes_exportar === 'true' || editedData?.interes_exportar === 'si') ? 'si' : 'no'}
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
                        value={editedData?.destinoexporta || editedData?.destinosExportacion?.join(', ') || empresaData?.destinoexporta || (Array.isArray(empresaData?.destinosExportacion) ? empresaData.destinosExportacion.join(', ') : '') || ''}
                        onChange={(e) => setEditedData(editedData ? { 
                          ...editedData, 
                          destinoexporta: e.target.value, 
                          destinosExportacion: e.target.value.split(',').map((d: string) => d.trim()).filter((d: string) => d) 
                        } : null)}
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
                    {isEditing ? (
                      <Select
                        value={(editedData?.importa === true || editedData?.importa === 'true' || editedData?.importa === 'si') ? 'si' : 'no'}
                        onValueChange={(value) => {
                          const importaValue = value === 'si'
                          setEditedData(editedData ? { ...editedData, importa: importaValue } : null)
                        }}
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
                      <p className="mt-1 font-semibold">{empresaData?.importa ? 'Sí' : 'No'}</p>
                    )}
                  </div>
                  <div>
                    <Label>Idiomas de Trabajo</Label>
                    {isEditing ? (
                      <Input
                        value={editedData?.idiomas_trabaja || editedData?.idiomasTrabajo || empresaData?.idiomas_trabaja || empresaData?.idiomasTrabajo || ''}
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

                  {isEditing ? (
                <div className="space-y-4">
                      {actividadesPromocion.map((actividad) => (
                        <div
                          key={actividad.id}
                          className="space-y-3 p-4 border border-[#3259B5]/30 rounded-lg bg-[#3259B5]/5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#222A59] text-sm">
                              {actividad.tipo === "feria"
                                ? "Feria"
                                : actividad.tipo === "mision"
                                  ? "Misión Comercial"
                                  : "Ronda de Negocios"}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarActividad(actividad.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                              <Label>Lugar</Label>
                              <Input
                                value={actividad.lugar}
                                onChange={(e) => actualizarActividad(actividad.id, "lugar", toUpperCase(e.target.value))}
                                placeholder="CIUDAD, PAÍS"
                                className="uppercase"
                              />
                    </div>
                            <div>
                              <Label>Año</Label>
                              <Input
                                value={actividad.anio}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "")
                                  if (value.length <= 4) {
                                    actualizarActividad(actividad.id, "anio", value)
                                  }
                                }}
                                placeholder="2024"
                                pattern="[0-9]{4}"
                              />
                  </div>
                          </div>

                  <div>
                            <Label>Observaciones</Label>
                            <Textarea
                              value={actividad.observaciones || ""}
                              onChange={(e) =>
                                actualizarActividad(actividad.id, "observaciones", toUpperCase(e.target.value))
                              }
                              placeholder="DETALLES O COMENTARIOS SOBRE LA ACTIVIDAD"
                              rows={2}
                              className="uppercase"
                            />
                          </div>
                        </div>
                      ))}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => agregarActividad("feria")}
                          className="border-dashed border-[#3259B5] text-[#3259B5] hover:bg-[#3259B5]/5 bg-transparent"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Feria
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => agregarActividad("mision")}
                          className="border-dashed border-[#66A29C] text-[#66A29C] hover:bg-[#66A29C]/5 bg-transparent"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Misión
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => agregarActividad("ronda")}
                          className="border-dashed border-[#807DA1] text-[#807DA1] hover:bg-[#807DA1]/5 bg-transparent"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Ronda
                        </Button>
                  </div>
                    </div>
                  ) : (
                    empresaData?.actividades_promocion_internacional && 
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
                    )
                  )}
                </div>
              </CardContent>
              </Card>
          </TabsContent>

          <TabsContent value="productos-servicios" className="space-y-6 w-full max-w-full mt-0">
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
                            const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                            const productosKey = esMixta ? 'productos_mixta' : 'productos'
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
                              [productosKey]: [...(editedData[productosKey] || []), newProducto]
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

                    {(() => {
                      const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                      const productosKey = esMixta ? 'productos_mixta' : 'productos'
                      const productosToShow = isEditing 
                        ? (editedData?.[productosKey] || [])
                        : (empresaData?.[productosKey] || empresaData?.productos || [])
                      
                      return productosToShow && productosToShow.length > 0 ? (
                        <div className="space-y-4">
                          {productosToShow.map((producto: any, index: number) => (
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
                                          const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                          const productosKey = esMixta ? 'productos_mixta' : 'productos'
                                          const updatedProductos = [...(editedData?.[productosKey] || [])]
                                          updatedProductos[index] = {
                                            ...updatedProductos[index],
                                            nombre_producto: e.target.value,
                                            nombre: e.target.value
                                          }
                                          setEditedData(editedData ? { ...editedData, [productosKey]: updatedProductos } : null)
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
                                          const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                          const productosKey = esMixta ? 'productos_mixta' : 'productos'
                                          const updatedProductos = [...(editedData?.[productosKey] || [])]
                                          updatedProductos[index] = {
                                            ...updatedProductos[index],
                                            descripcion: e.target.value
                                          }
                                          setEditedData(editedData ? { ...editedData, [productosKey]: updatedProductos } : null)
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
                                            const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                            const productosKey = esMixta ? 'productos_mixta' : 'productos'
                                            const updatedProductos = [...(editedData?.[productosKey] || [])]
                                            updatedProductos[index] = {
                                              ...updatedProductos[index],
                                              capacidad_productiva: e.target.value,
                                              capacidadProductiva: e.target.value
                                            }
                                            setEditedData(editedData ? { ...editedData, [productosKey]: updatedProductos } : null)
                                          }}
                                          placeholder="Ej: 1000"
                                        />
                                      </div>

                                      <div>
                                        <Label>Unidad de Medida</Label>
                                        <Select
                                          value={producto.unidad_medida || producto.unidadMedida || 'kg'}
                                          onValueChange={(value) => {
                                            const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                            const productosKey = esMixta ? 'productos_mixta' : 'productos'
                                            const updatedProductos = [...(editedData?.[productosKey] || [])]
                                            updatedProductos[index] = {
                                              ...updatedProductos[index],
                                              unidad_medida: value,
                                              unidadMedida: value
                                            }
                                            setEditedData(editedData ? { ...editedData, [productosKey]: updatedProductos } : null)
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
                                            const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                            const productosKey = esMixta ? 'productos_mixta' : 'productos'
                                            const updatedProductos = [...(editedData?.[productosKey] || [])]
                                            updatedProductos[index] = {
                                              ...updatedProductos[index],
                                              periodo_capacidad: value,
                                              periodoCapacidad: value
                                            }
                                            setEditedData(editedData ? { ...editedData, [productosKey]: updatedProductos } : null)
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
                                            const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                            const productosKey = esMixta ? 'productos_mixta' : 'productos'
                                            const updatedProductos = [...(editedData?.[productosKey] || [])]
                                            updatedProductos[index] = {
                                              ...updatedProductos[index],
                                              posicion_arancelaria: e.target.value
                                                ? {
                                                    codigo_arancelario: e.target.value
                                                  }
                                                : null
                                            }
                                            setEditedData(editedData ? { ...editedData, [productosKey]: updatedProductos } : null)
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
                                      const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                      const productosKey = esMixta ? 'productos_mixta' : 'productos'
                                      const updatedProductos = editedData?.[productosKey]?.filter((_, i) => i !== index) || []
                                      setEditedData(editedData ? { ...editedData, [productosKey]: updatedProductos } : null)
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
                      )
                    })()}
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
                            const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                            const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
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
                            
                            setEditedData(editedData ? {
                              ...editedData,
                              [serviciosKey]: [...(editedData[serviciosKey] || []), newServicio]
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
                      const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                      const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                      const serviciosToShow = isEditing
                        ? (editedData?.[serviciosKey] || [])
                        : (empresaData?.[serviciosKey] || empresaData?.servicios || empresaData?.servicios_ofrecidos || [])
                      
                      const serviciosArray = Array.isArray(serviciosToShow) ? serviciosToShow : []
                      
                      return serviciosArray && serviciosArray.length > 0 ? (
              <div className="space-y-4">
                          {serviciosArray.map((servicio: any, index: number) => (
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
                                            const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                            const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                            const updatedServicios = [...(editedData?.[serviciosKey] || [])]
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
                                            const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                            const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                            const updatedServicios = [...(editedData?.[serviciosKey] || [])]
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
                                              const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                              const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                              const updatedServicios = [...(editedData?.[serviciosKey] || [])]
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
                                              const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                              const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                              const updatedServicios = [...(editedData?.[serviciosKey] || [])]
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
                                              const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                              const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                              const updatedServicios = [...(editedData?.[serviciosKey] || [])]
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
                                              const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                              const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                              const updatedServicios = [...(editedData?.[serviciosKey] || [])]
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
                                        const esMixta = empresaData?.tipo_empresa_valor === 'mixta' || empresaData?.tipo_empresa === 'mixta'
                                        const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                        const updatedServicios = editedData?.[serviciosKey]?.filter((_, i) => i !== index) || []
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
                      )
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificaciones" className="space-y-6 w-full max-w-full mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59]">Certificaciones</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-full overflow-hidden p-4 sm:p-6">
                <div className="min-w-0 w-full">
                  <Label>Certificado MiPyME</Label>
                  {isEditing ? (
                    <Select
                      value={(editedData?.certificadopyme === true || editedData?.certificadopyme === 'true' || editedData?.certificadopyme === 'si') ? 'si' : 'no'}
                      onValueChange={(value) => {
                        const certificadopymeValue = value === 'si'
                        setEditedData(editedData ? { ...editedData, certificadopyme: certificadopymeValue } : null)
                      }}
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
                    <p className="mt-1 font-semibold">{empresaData?.certificadopyme ? 'Sí' : 'No'}</p>
                  )}
                </div>
                <div className="min-w-0 w-full">
                  <Label>Material Promocional en 2 Idiomas</Label>
                  {isEditing ? (
                    <Select
                      value={(editedData?.promo2idiomas === true || editedData?.promo2idiomas === 'true' || editedData?.promo2idiomas === 'si') ? 'si' : 'no'}
                      onValueChange={(value) => {
                        const promo2idiomasValue = value === 'si'
                        setEditedData(editedData ? { ...editedData, promo2idiomas: promo2idiomasValue } : null)
                      }}
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
                    <p className="mt-1 font-semibold">{empresaData?.promo2idiomas ? 'Sí' : 'No'}</p>
                  )}
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
          <TabsContent value="configuracion" className="space-y-6 w-full max-w-full mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59] flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Cambiar Email
                </CardTitle>
                <CardDescription>
                  Actualiza tu dirección de correo electrónico para iniciar sesión
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentEmail">Email Actual</Label>
                  <Input
                    id="currentEmail"
                    type="email"
                    value={userProfile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newEmail">Nuevo Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={emailData.newEmail}
                    onChange={(e) => setEmailData({ ...emailData, newEmail: e.target.value })}
                    placeholder="nuevo@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmEmail">Confirmar Nuevo Email</Label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    value={emailData.confirmEmail}
                    onChange={(e) => setEmailData({ ...emailData, confirmEmail: e.target.value })}
                    placeholder="nuevo@email.com"
                  />
                </div>
                <Button
                  onClick={handleChangeEmail}
                  disabled={savingUserConfig}
                  className="w-full bg-[#3259B5] hover:bg-[#3259B5]/90"
                >
                  {savingUserConfig ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#222A59] flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Cambiar Contraseña
                </CardTitle>
                <CardDescription>
                  Actualiza tu contraseña para iniciar sesión
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Repite la contraseña"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={savingUserConfig}
                  className="w-full bg-[#3259B5] hover:bg-[#3259B5]/90"
                >
                  {savingUserConfig ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Contraseña
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-[#222A59] text-white py-8 md:py-12">
        <div className="w-full px-4">
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

      {/* Diálogo de confirmación para cambio de geolocalización */}
      <AlertDialog open={showGeoConfirmDialog} onOpenChange={setShowGeoConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de cambiar la ubicación del mapa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cambiará la geolocalización de la empresa. Una vez confirmado, la nueva ubicación se guardará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowGeoConfirmDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveGeoLocation}
              className="bg-[#3259B5] hover:bg-[#3259B5]/90"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Confirmar Cambio"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
