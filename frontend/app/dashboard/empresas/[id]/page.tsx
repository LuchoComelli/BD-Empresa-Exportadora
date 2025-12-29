
"use client"

import { useState, useEffect, use, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Edit, Save, X, Download, Loader2, Building2, Mail, Phone, MapPin, Globe, Plus } from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import { CompanyMap } from "@/components/map/company-map"
import { LocationPicker } from "@/components/map/location-picker"
import { useToast } from "@/hooks/use-toast"
import { ExportEmpresaDialog } from "@/components/empresas/export-empresa-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useDashboardAuth } from "@/hooks/use-dashboard-auth"

interface ActividadPromocion {
  id: string
  tipo: "feria" | "mision" | "ronda"
  lugar: string
  anio: string
  observaciones?: string
}

interface Empresa {
  id: number
  razon_social: string
  nombre_fantasia?: string
  cuit_cuil: string
  tipo_sociedad?: string
  tipo_empresa?: string
  tipo_empresa_valor?: string
  tipo_empresa_detalle?: any
  estado?: string
  direccion?: string
  codigo_postal?: string
  direccion_comercial?: string
  codigo_postal_comercial?: string
  departamento: string
  municipio?: string
  localidad?: string
  departamento_nombre?: string
  municipio_nombre?: string
  localidad_nombre?: string
  telefono?: string
  correo?: string
  sitioweb?: string
  exporta?: string
  categoria_matriz?: string
  destinoexporta?: string
  importa?: boolean
  interes_exportar?: boolean
  certificadopyme?: boolean
  certificaciones?: string
  promo2idiomas?: boolean
  idiomas_trabaja?: string
  observaciones?: string
  geolocalizacion?: string
  id_rubro?: any
  id_subrubro?: any
  rubro_nombre?: string
  sub_rubro_nombre?: string 
  rubro_detalle?: any
  productos?: any[]
  servicios?: any[]
  instagram?: string
  facebook?: string
  linkedin?: string
  contacto_principal_nombre?: string
  contacto_principal_apellido?: string
  contacto_principal_cargo?: string
  contacto_principal_telefono?: string
  contacto_principal_email?: string
  contacto_secundario_nombre?: string
  contacto_secundario_apellido?: string
  contacto_secundario_cargo?: string
  contacto_secundario_telefono?: string
  contacto_secundario_email?: string
  contacto_terciario_nombre?: string
  contacto_terciario_apellido?: string
  contacto_terciario_cargo?: string
  contacto_terciario_telefono?: string
  contacto_terciario_email?: string
  fecha_creacion?: string
  fecha_actualizacion?: string
  rubro_producto_nombre?: string 
  rubro_servicio_nombre?: string
  actividades_promocion_internacional?: any[]
  id_usuario?: any
  usuario_email?: string
  anos_etapa_inicial?: number | null
  anos_potencial_exportadora?: number | null
  anos_exportadora?: number | null
}

function EmpresaProfileContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user } = useDashboardAuth()
  const resolvedParams = use(params)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<Empresa | null>(null)
  const [saving, setSaving] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Estados para edición de geolocalización
  const [geoEditMode, setGeoEditMode] = useState<'view' | 'editing'>('view')
  const [tempGeoCoordinates, setTempGeoCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [showGeoConfirmDialog, setShowGeoConfirmDialog] = useState(false)

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

  // Estado para actividades de promoción internacional
  const [actividadesPromocion, setActividadesPromocion] = useState<ActividadPromocion[]>([])

  // Estado para centrar el mapa
  const [mapCenter, setMapCenter] = useState<{ lat: number | null; lng: number | null; zoom: number }>({
    lat: -28.2,
    lng: -66.0,
    zoom: 8
  })

  useEffect(() => {
    loadEmpresa()
  }, [resolvedParams.id])

  // Actualizar el email cuando cambie el usuario (solo si el usuario actual es el dueño de la empresa)
  useEffect(() => {
    if (user?.email && empresa?.id_usuario) {
      const userId = typeof empresa.id_usuario === 'object' ? empresa.id_usuario.id : empresa.id_usuario
      const currentUserId = user.id
      // Solo actualizar si el usuario actual es el dueño de la empresa
      if (userId === currentUserId) {
        setUserEmail(user.email)
      }
    }
  }, [user?.email, user?.id, empresa?.id_usuario])

  useEffect(() => {
    const editParam = searchParams?.get('edit')
    if (editParam === 'true') {
      setIsEditing(true)
    }
  }, [searchParams])

  // Cargar datos iniciales
  useEffect(() => {
    loadDepartamentosData()
    loadRubrosData()
  }, [])

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

  // Cargar subrubros cuando cambia rubro en edición (para empresas no mixtas)
  useEffect(() => {
    if (isEditing && editedData?.id_rubro && editedData?.tipo_empresa_valor !== 'mixta') {
      const rubroId = typeof editedData.id_rubro === 'object'
        ? editedData.id_rubro.id
        : editedData.id_rubro
      if (rubroId) {
        loadSubRubrosData(rubroId)
      }
    }
  }, [isEditing, editedData?.id_rubro, editedData?.tipo_empresa_valor])

  // Inicializar rubros y cargar subrubros cuando se edita una empresa mixta
  useEffect(() => {
    if (isEditing && editedData?.tipo_empresa_valor === 'mixta' && rubros.length > 0) {
      // Inicializar rubro de productos
      if (editedData?.rubro_producto_nombre && !rubroProducto) {
        // Buscar el rubro por nombre
        const rubroEncontrado = rubros.find(r => r.nombre === editedData.rubro_producto_nombre)
        if (rubroEncontrado) {
          setRubroProducto(rubroEncontrado.id)
          loadSubRubrosProductos(rubroEncontrado.id)
        }
      } else if (editedData?.id_subrubro_producto) {
        // Intentar obtener desde el subrubro si viene como objeto
        const subRubroProd = typeof editedData.id_subrubro_producto === 'object'
          ? editedData.id_subrubro_producto
          : null
        if (subRubroProd?.rubro_id) {
          setRubroProducto(subRubroProd.rubro_id)
          loadSubRubrosProductos(subRubroProd.rubro_id)
        } else if (subRubroProd?.rubro?.id) {
          setRubroProducto(subRubroProd.rubro.id)
          loadSubRubrosProductos(subRubroProd.rubro.id)
        }
      }
      
      // Inicializar rubro de servicios
      if (editedData?.rubro_servicio_nombre && !rubroServicio) {
        // Buscar el rubro por nombre
        const rubroEncontrado = rubros.find(r => r.nombre === editedData.rubro_servicio_nombre)
        if (rubroEncontrado) {
          setRubroServicio(rubroEncontrado.id)
          loadSubRubrosServicios(rubroEncontrado.id)
        }
      } else if (editedData?.id_subrubro_servicio) {
        // Intentar obtener desde el subrubro si viene como objeto
        const subRubroServ = typeof editedData.id_subrubro_servicio === 'object'
          ? editedData.id_subrubro_servicio
          : null
        if (subRubroServ?.rubro_id) {
          setRubroServicio(subRubroServ.rubro_id)
          loadSubRubrosServicios(subRubroServ.rubro_id)
        } else if (subRubroServ?.rubro?.id) {
          setRubroServicio(subRubroServ.rubro.id)
          loadSubRubrosServicios(subRubroServ.rubro.id)
        }
      }
    }
  }, [isEditing, editedData?.tipo_empresa_valor, editedData?.id_subrubro_producto, editedData?.id_subrubro_servicio, editedData?.rubro_producto_nombre, editedData?.rubro_servicio_nombre, rubros])

  // Cargar subrubros de productos cuando cambia el rubro de productos
  useEffect(() => {
    if (isEditing && editedData?.tipo_empresa_valor === 'mixta' && rubroProducto) {
      loadSubRubrosProductos(rubroProducto)
      // Limpiar subrubro seleccionado cuando cambia el rubro
      setEditedData(editedData ? { ...editedData, id_subrubro_producto: null } : null)
    }
  }, [rubroProducto])

  // Cargar subrubros de servicios cuando cambia el rubro de servicios
  useEffect(() => {
    if (isEditing && editedData?.tipo_empresa_valor === 'mixta' && rubroServicio) {
      loadSubRubrosServicios(rubroServicio)
      // Limpiar subrubro seleccionado cuando cambia el rubro
      setEditedData(editedData ? { ...editedData, id_subrubro_servicio: null } : null)
    }
  }, [rubroServicio])

// 6. DEBUGGING TEMPORAL - Agregar esto al componente para ver el estado
useEffect(() => {
  if (isEditing) {
  }
}, [isEditing, editedData, subRubros])


  const loadEmpresa = async () => {
    try {
      setLoading(true)
      const empresaId = parseInt(resolvedParams.id)
      const data = await api.getEmpresaById(empresaId)

          // ✅ AGREGAR ESTE DEBUG
      
      if (!data || !data.id) {
        toast({
          title: "Empresa no encontrada",
          description: "No se encontró la empresa con el ID especificado",
          variant: "destructive",
        })
        router.push('/dashboard/empresas')
        return
      }
      
      setEmpresa(data)
      setEditedData(data)
      
      // Obtener el email del usuario asociado a la empresa
      // Primero intentar usar usuario_email si viene en los datos del serializer
      if (data.usuario_email) {
        setUserEmail(data.usuario_email)
      } else if (data.id_usuario) {
        // Si no viene usuario_email, intentar obtenerlo del id_usuario
        try {
          const userId = typeof data.id_usuario === 'object' ? data.id_usuario.id : data.id_usuario
          if (userId) {
            try {
              const usuarioData = await api.getUsuarioById(userId)
              setUserEmail(usuarioData?.email || null)
            } catch (userError: any) {
              // Si el usuario no existe, no mostrar nada
              console.warn("Usuario no encontrado para la empresa:", userError)
              setUserEmail(null)
            }
          } else {
            setUserEmail(null)
          }
        } catch (error) {
          console.error("Error obteniendo email del usuario:", error)
          setUserEmail(null)
        }
      } else {
        // Si no hay id_usuario, no mostrar email
        setUserEmail(null)
      }
      
      // Inicializar actividades de promoción internacional
      if (data.actividades_promocion_internacional && Array.isArray(data.actividades_promocion_internacional)) {
        // Convertir las actividades del formato del backend al formato del frontend
        const actividadesFormateadas: ActividadPromocion[] = data.actividades_promocion_internacional.map((act: any, index: number) => ({
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
      
      const editParam = searchParams?.get('edit')
      if (editParam === 'true') {
        setIsEditing(true)
      }
    } catch (error: any) {
      console.error("[Empresa Detail] Error loading empresa:", error)
      toast({
        title: "Error al cargar la empresa",
        description: error.message || 'Error desconocido',
        variant: "destructive",
      })
      router.push('/dashboard/empresas')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartamentosData = async () => {
  try {
    const data = await api.getDepartamentos()
    // Manejar respuesta paginada o array directo
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
    
    // Manejar respuesta paginada o array directo
    const municipiosArray = Array.isArray(data) ? data : (data?.results || [])
    setMunicipios(municipiosArray)
    
    // Actualizar centro del mapa
    const dept = departamentos.find(d => d.id === departamentoId)
    if (dept?.centroide_lat && dept?.centroide_lon) {
      setMapCenter({
        lat: parseFloat(dept.centroide_lat),
        lng: parseFloat(dept.centroide_lon),
        zoom: 11
      })
    }
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
    
    // Manejar respuesta paginada o array directo
    const localidadesArray = Array.isArray(data) ? data : (data?.results || [])
    setLocalidades(localidadesArray)
    
    // Actualizar centro del mapa
    const mun = municipios.find(m => m.id === municipioId)
    if (mun?.centroide_lat && mun?.centroide_lon) {
      setMapCenter({
        lat: parseFloat(mun.centroide_lat),
        lng: parseFloat(mun.centroide_lon),
        zoom: 13
      })
    }
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
    // El API puede devolver un array directamente O un objeto con { results: [...] }
    const rubrosArray = Array.isArray(data) ? data : (data?.results || [])
    
    setRubros(rubrosArray)
  } catch (error) {
    console.error('❌ [loadRubrosData] Error loading rubros:', error)
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
    console.error('❌ [loadSubRubrosData] Error loading subrubros:', error)
    setSubRubros([])
  } finally {
    setLoadingRubros(false)
  }
}

  // Cargar subrubros de productos por rubro
  const loadSubRubrosProductos = async (rubroId: any) => {
    try {
      setLoadingRubros(true)
        const data = await api.getSubRubrosPorRubro(rubroId)
        const subRubrosArray = Array.isArray(data) ? data : (data?.results || [])
      
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
        const data = await api.getSubRubrosPorRubro(rubroId)
        const subRubrosArray = Array.isArray(data) ? data : (data?.results || [])
      
      setSubRubrosServicios(subRubrosArray)
    } catch (error) {
      console.error('❌ [loadSubRubrosServicios] Error loading subrubros:', error)
      setSubRubrosServicios([])
    } finally {
      setLoadingRubros(false)
    }
  }

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

  const handleEdit = () => {
    setIsEditing(true)
    
    if (empresa) {
      setEditedData({ ...empresa })
      
      // Inicializar actividades de promoción internacional cuando se entra en modo edición
      if (empresa.actividades_promocion_internacional && Array.isArray(empresa.actividades_promocion_internacional)) {
        const actividadesFormateadas: ActividadPromocion[] = empresa.actividades_promocion_internacional.map((act: any, index: number) => ({
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
      
      // Cargar municipios si hay departamento
      if (empresa.departamento) {
        const deptoId = typeof empresa.departamento === 'object' 
          ? empresa.departamento.id 
          : empresa.departamento
        if (deptoId) {
          loadMunicipiosData(deptoId)
        }
      }
      
      // Cargar localidades si hay municipio
      if (empresa.municipio) {
        const munId = typeof empresa.municipio === 'object'
          ? empresa.municipio.id
          : empresa.municipio
        if (munId) {
          loadLocalidadesData(munId)
        }
      }
      
      // ⭐ CRÍTICO: Cargar subrubros si hay rubro
      if (empresa.id_rubro) {
        const rubroId = typeof empresa.id_rubro === 'object'
          ? empresa.id_rubro.id
          : empresa.id_rubro
        if (rubroId) {
          loadSubRubrosData(rubroId)
        }
      }
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(empresa ? { ...empresa } : null)
    
    // Restaurar actividades de promoción internacional cuando se cancela la edición
    if (empresa?.actividades_promocion_internacional && Array.isArray(empresa.actividades_promocion_internacional)) {
      const actividadesFormateadas: ActividadPromocion[] = empresa.actividades_promocion_internacional.map((act: any, index: number) => ({
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
    // Limpiar estados de rubros y subrubros para empresas mixtas
    setRubroProducto(null)
    setRubroServicio(null)
    setSubRubrosProductos([])
    setSubRubrosServicios([])
    
    // Limpiar estados de edición de geolocalización
    setGeoEditMode('view')
    setTempGeoCoordinates(null)
  }

  // Función para guardar la nueva geolocalización
  const handleSaveGeoLocation = async () => {
    if (!tempGeoCoordinates || !empresa) return

    try {
      setSaving(true)
      const geoString = `${tempGeoCoordinates.lat},${tempGeoCoordinates.lng}`
      
      const updatedEmpresa = await api.updateEmpresa(empresa.id, {
        geolocalizacion: geoString
      })

      // Actualizar tanto empresa como editedData para que el cambio se refleje inmediatamente
      setEmpresa(updatedEmpresa)
      if (editedData) {
        setEditedData({
          ...editedData,
          geolocalizacion: geoString
        })
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
      setSaving(false)
    }
  }

const handleSave = async () => {
  if (!editedData || !empresa) return

  try {
    setSaving(true)
    
    // 0. DETERMINAR TIPO DE EMPRESA PRIMERO
    const tipoEmpresa = empresa.tipo_empresa_valor || empresa.tipo_empresa || 'producto'
    const esProducto = tipoEmpresa === 'producto'
    const esServicio = tipoEmpresa === 'servicio'
    const esMixta = tipoEmpresa === 'mixta'

    // 1. GUARDAR DATOS BÁSICOS DE LA EMPRESA (sin productos/servicios)
    // ✅ IMPORTANTE: Excluir 'brochure' del destructuring porque es la URL del archivo existente,
    // no el archivo en sí. El manejo del archivo se hace por separado más abajo.
    // ✅ IMPORTANTE: Excluir 'redes_sociales' porque se manejan como campos individuales
    const { productos, servicios, productos_mixta, servicios_mixta, brochure_file, brochure_filename, brochure, redes_sociales, ...empresaData } = editedData
    
    // ✅ CREAR FormData para enviar archivos
    const formData = new FormData()
    
    // ✅ MANEJAR ARCHIVO PDF
    if (brochure_file) {
      formData.append('brochure', brochure_file)
    } else if (editedData.brochure === null && empresa.brochure) {
      formData.append('brochure', '') // Enviar string vacío para eliminar
    }
    // Si no hay cambios en el archivo (no hay brochure_file y brochure no es null),
    // simplemente no incluimos el campo 'brochure' en el FormData
    
    // Normalizar relaciones a IDs
    const dataToSend: any = {
      ...empresaData,
      // ✅ IMPORTANTE: Usar editedData para campos que pueden cambiar
      razon_social: editedData.razon_social || empresaData.razon_social,
      nombre_fantasia: editedData.nombre_fantasia || empresaData.nombre_fantasia || null,
      tipo_sociedad: editedData.tipo_sociedad || empresaData.tipo_sociedad || null,
      cuit_cuil: editedData.cuit_cuil || empresaData.cuit_cuil,
      direccion: editedData.direccion || empresaData.direccion || '',
      codigo_postal: editedData.codigo_postal || empresaData.codigo_postal || null,
      direccion_comercial: editedData.direccion_comercial || empresaData.direccion_comercial || null,
      codigo_postal_comercial: editedData.codigo_postal_comercial || empresaData.codigo_postal_comercial || null,
      departamento: typeof (editedData.departamento || empresaData.departamento) === 'object' 
        ? (editedData.departamento || empresaData.departamento).id 
        : (editedData.departamento || empresaData.departamento),
      municipio: (editedData.municipio || empresaData.municipio)
        ? (typeof (editedData.municipio || empresaData.municipio) === 'object' 
            ? (editedData.municipio || empresaData.municipio).id 
            : (editedData.municipio || empresaData.municipio))
        : null,
      localidad: (editedData.localidad || empresaData.localidad)
        ? (typeof (editedData.localidad || empresaData.localidad) === 'object' 
            ? (editedData.localidad || empresaData.localidad).id 
            : (editedData.localidad || empresaData.localidad))
        : null,
      telefono: editedData.telefono || empresaData.telefono || '',
      correo: editedData.correo || editedData.email || empresaData.correo || empresaData.email,
      sitioweb: editedData.sitioweb || editedData.paginaWeb || empresaData.sitioweb || empresaData.paginaWeb || null,
      id_rubro: typeof (editedData.id_rubro || empresaData.id_rubro) === 'object' 
        ? (editedData.id_rubro || empresaData.id_rubro).id 
        : (editedData.id_rubro || empresaData.id_rubro),
      // ✅ Redes sociales - usar editedData explícitamente, null si están vacías
      instagram: (editedData.instagram && editedData.instagram.trim() !== '') ? editedData.instagram.trim() : null,
      facebook: (editedData.facebook && editedData.facebook.trim() !== '') ? editedData.facebook.trim() : null,
      linkedin: (editedData.linkedin && editedData.linkedin.trim() !== '') ? editedData.linkedin.trim() : null,
      // ✅ Campos adicionales
      certificadopyme: editedData.certificadopyme || false,
      certificaciones: editedData.certificaciones || null,
      promo2idiomas: editedData.promo2idiomas || false,
      observaciones: editedData.observaciones || null,
      // ✅ Campos de años por etapa
      anos_etapa_inicial: editedData.anos_etapa_inicial ?? null,
      anos_potencial_exportadora: editedData.anos_potencial_exportadora ?? null,
      anos_exportadora: editedData.anos_exportadora ?? null,
    }
    
    // ✅ CRÍTICO: Manejar subrubros según tipo de empresa
    if (esMixta) {
      // Para empresas mixtas: dos subrubros separados
      if (empresaData.id_subrubro_producto) {
        dataToSend.id_subrubro_producto = typeof empresaData.id_subrubro_producto === 'object'
          ? empresaData.id_subrubro_producto.id
          : empresaData.id_subrubro_producto
      }
      if (empresaData.id_subrubro_servicio) {
        dataToSend.id_subrubro_servicio = typeof empresaData.id_subrubro_servicio === 'object'
          ? empresaData.id_subrubro_servicio.id
          : empresaData.id_subrubro_servicio
      }
      // NO enviar id_subrubro para empresas mixtas
      delete dataToSend.id_subrubro
    } else {
      // Para empresas de producto o servicio único
      dataToSend.id_subrubro = empresaData.id_subrubro 
        ? (typeof empresaData.id_subrubro === 'object' 
            ? empresaData.id_subrubro.id 
            : empresaData.id_subrubro)
        : null
      // NO enviar subrubros separados para empresas no mixtas
      delete dataToSend.id_subrubro_producto
      delete dataToSend.id_subrubro_servicio
    }
    
    // ✅ Agregar actividades de promoción internacional
    if (actividadesPromocion.length > 0) {
      dataToSend.actividades_promocion_internacional = actividadesPromocion.map(a => ({
        tipo: a.tipo,
        lugar: a.lugar.trim(),
        anio: a.anio.trim(),
        observaciones: a.observaciones?.trim() || ''
      }))
    } else {
      dataToSend.actividades_promocion_internacional = []
    }
    
    // Agregar todos los campos al FormData
    for (const [key, value] of Object.entries(dataToSend)) {
      // ✅ IMPORTANTE: Excluir redes_sociales del FormData (solo usamos campos individuales)
      if (key === 'redes_sociales') {
        continue
      }
      
      // Para redes sociales, enviar null como cadena vacía para limpiar el campo
      if ((key === 'instagram' || key === 'facebook' || key === 'linkedin')) {
        formData.append(key, value === null ? '' : String(value))
        continue
      }
      
      // Saltar otros valores null o undefined, EXCEPTO observaciones que debe enviarse siempre
      if (value === null || value === undefined) {
        if (key === 'observaciones') {
          // Enviar string vacío para observaciones si es null/undefined
          formData.append(key, '')
        }
        continue
      }
      
      if (typeof value === 'object' && !(value instanceof File) && !Array.isArray(value)) {
        formData.append(key, JSON.stringify(value))
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value))
      } else {
        formData.append(key, String(value))
      }
    }
    
    // ✅ USAR FormData en lugar de JSON
    await api.updateEmpresa(empresa.id, formData)
    
    // 3. GUARDAR PRODUCTOS (para empresas de producto o mixta)
    if (esProducto || esMixta) {
      const productosData = esMixta ? productos_mixta : productos
      
      if (productosData && Array.isArray(productosData)) {
        
        // Obtener IDs de productos actuales
        const productosActualesIds = productosData
          .filter((p: any) => p.id && !String(p.id).startsWith('temp-'))
          .map((p: any) => p.id)
        
        // Obtener IDs de productos originales
        const productosOriginales = esMixta 
          ? (empresa.productos_mixta || [])
          : (empresa.productos || [])
        const productosOriginalesIds = productosOriginales.map((p: any) => p.id)
        
        // Eliminar productos que ya no están
        const productosAEliminar = productosOriginalesIds.filter(
          (id: number) => !productosActualesIds.includes(id)
        )
        
        for (const id of productosAEliminar) {
          if (esMixta) {
            await api.deleteProductoMixta(id)
          } else {
            await api.deleteProducto(id)
          }
        }
        
        // Crear o actualizar productos
        for (const producto of productosData) {
          const productoData = {
            nombre_producto: producto.nombre_producto || producto.nombre || '',
            descripcion: (producto.descripcion && producto.descripcion.trim() !== '') ? producto.descripcion.trim() : 'Sin descripción',
            capacidad_productiva: producto.capacidad_productiva || null,
            unidad_medida: producto.unidad_medida || 'kg',
            periodo_capacidad: producto.periodo_capacidad || 'mensual',
            es_principal: producto.es_principal || false,
            precio_estimado: producto.precio_estimado || null,
            moneda_precio: producto.moneda_precio || 'ARS',
            empresa: empresa.id,
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
            if (esMixta) {
              await api.updateProductoMixta(producto.id, productoData)
            } else {
              await api.updateProducto(producto.id, productoData)
            }
          } else {
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
      const serviciosData = esMixta ? servicios_mixta : servicios
      
      if (serviciosData && Array.isArray(serviciosData)) {
        
        const serviciosActualesIds = serviciosData
          .filter((s: any) => s.id && !String(s.id).startsWith('temp-'))
          .map((s: any) => s.id)
        
        const serviciosOriginales = esMixta
          ? (empresa.servicios_mixta || [])
          : (empresa.servicios || [])
        const serviciosOriginalesIds = serviciosOriginales.map((s: any) => s.id)
        
        const serviciosAEliminar = serviciosOriginalesIds.filter(
          (id: number) => !serviciosActualesIds.includes(id)
        )
        
        for (const id of serviciosAEliminar) {
          if (esMixta) {
            await api.deleteServicioMixta(id)
          } else {
            await api.deleteServicio(id)
          }
        }
        
        for (const servicio of serviciosData) {
          const servicioData = {
            nombre_servicio: servicio.nombre_servicio || servicio.nombre || servicio.descripcion || '',
            descripcion: (servicio.descripcion && servicio.descripcion.trim() !== '') ? servicio.descripcion.trim() : 'Sin descripción',
            tipo_servicio: servicio.tipo_servicio || '',
            sector_atendido: servicio.sector_atendido || '',
            alcance_servicio: servicio.alcance_servicio || servicio.alcance_geografico || 'local',
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
            empresa: empresa.id,
          }
          
          if (servicio.id && !String(servicio.id).startsWith('temp-')) {
            if (esMixta) {
              await api.updateServicioMixta(servicio.id, servicioData)
            } else {
              await api.updateServicio(servicio.id, servicioData)
            }
          } else {
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
    const updatedEmpresa = await api.getEmpresaById(empresa.id)
    // Debug temporal para verificar observaciones
    console.log('[handleSave] updatedEmpresa.observaciones:', updatedEmpresa.observaciones)
    console.log('[handleSave] updatedEmpresa keys:', Object.keys(updatedEmpresa))
    setEmpresa(updatedEmpresa)
    setEditedData(updatedEmpresa)
    setIsEditing(false)
    
    toast({
      title: "Cambios guardados",
      description: "Los cambios se han guardado exitosamente",
      variant: "default",
    })
  } catch (error: any) {
    console.error("❌ [handleSave] Error saving:", error)
    toast({
      title: "Error al guardar",
      description: error.message || "Error al guardar los cambios",
      variant: "destructive",
    })
  } finally {
    setSaving(false)
  }
}

  const getCategoryFromEmpresa = (empresa: Empresa): "Exportadora" | "Potencial Exportadora" | "Etapa Inicial" => {
    // Solo usar categoria_matriz si existe y tiene un valor válido
    // No hacer fallback al campo exporta porque son conceptos diferentes
    if (empresa.categoria_matriz && 
        (empresa.categoria_matriz === "Exportadora" || 
         empresa.categoria_matriz === "Potencial Exportadora" || 
         empresa.categoria_matriz === "Etapa Inicial")) {
      return empresa.categoria_matriz as "Exportadora" | "Potencial Exportadora" | "Etapa Inicial"
    }
    // Si no hay categoria_matriz válida, retornar "Etapa Inicial" por defecto
    return "Etapa Inicial"
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Exportadora":
        return "bg-[#C3C840] text-[#222A59]"
      case "Potencial Exportadora":
        return "bg-[#C0217E] text-white"
      case "Etapa Inicial":
        return "bg-[#629BD2] text-white"
      default:
        return "bg-muted text-foreground"
    }
  }

  const formatFormaContratacion = (val: any) => {
    if (!val && val !== 0) return null
    const v = typeof val === 'string' ? val.toLowerCase() : String(val).toLowerCase()
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
        return String(val)
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
          <Link href="/dashboard/empresas">
            <Button className="mt-4">Volver</Button>
          </Link>
        </div>
      </MainLayout>
    )
  }

  const category = getCategoryFromEmpresa(empresa)
  const displayData = isEditing ? editedData : empresa



  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 flex-wrap">
          <Button variant="ghost" size="icon" asChild className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
            <Link href="/dashboard/empresas">
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#222A59] break-words">Perfil de Empresa</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-1 break-words">
              {empresa?.razon_social || 'Cargando...'}
            </p>
            {empresa?.id && (
              <p className="text-xs text-muted-foreground mt-1">ID: {empresa.id}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {!isEditing ? (
              <>
                <Button onClick={handleEdit} variant="outline" className="gap-2 text-xs sm:text-sm h-8 sm:h-9 md:h-10 px-3 sm:px-4 flex-1 sm:flex-initial">
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Editar</span>
                  <span className="xs:hidden">Edit</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2 text-xs sm:text-sm h-8 sm:h-9 md:h-10 px-3 sm:px-4 flex-1 sm:flex-initial"
                  onClick={() => setShowExportDialog(true)}
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Exportar</span>
                  <span className="xs:hidden">Exp.</span>
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleCancel} variant="outline" className="gap-2 text-xs sm:text-sm h-8 sm:h-9 md:h-10 px-3 sm:px-4 flex-1 sm:flex-initial">
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Cancelar</span>
                  <span className="xs:hidden">Cancel</span>
                </Button>
                <Button onClick={handleSave} className="bg-[#3259B5] hover:bg-[#3259B5]/90 text-white gap-2 text-xs sm:text-sm h-8 sm:h-9 md:h-10 px-3 sm:px-4 flex-1 sm:flex-initial" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden xs:inline">{saving ? 'Guardando...' : 'Guardar'}</span>
                  <span className="xs:hidden">{saving ? '...' : 'Save'}</span>
                </Button>
              </>
            )}
          </div>
        </div>

        <Card className="w-full max-w-full overflow-hidden">
          <CardContent className="p-4 sm:p-6 w-full max-w-full overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 sm:gap-6">
              <div className="flex gap-3 sm:gap-4 min-w-0 w-full">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#3259B5]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-[#3259B5]" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#222A59] break-words">{displayData?.razon_social}</h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
                    <Badge className={getCategoryColor(category)}>{category}</Badge>
                    {(displayData?.rubro_nombre || displayData?.id_rubro) && (
                      <span className="text-xs sm:text-sm text-muted-foreground break-words">
                        {displayData.rubro_nombre || (typeof displayData.id_rubro === 'object' ? displayData.id_rubro.nombre : displayData.id_rubro) || 'N/A'}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
                    {displayData?.direccion && (
                      <div className="flex items-start gap-2 min-w-0 flex-1 sm:flex-initial">
                        <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{displayData.direccion}
                        {(displayData.departamento_nombre || displayData.departamento) && (
                          <span>, {displayData.departamento_nombre || (typeof displayData.departamento === 'object' ? displayData.departamento.nombre : displayData.departamento)}</span>
                        )}</span>
                      </div>
                    )}
                    {displayData?.correo && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-4 w-4 flex-shrink-0" />
                        <span className="break-all">{displayData.correo}</span>
                      </div>
                    )}
                    {displayData?.telefono && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span>{displayData.telefono}</span>
                      </div>
                    )}
                    {displayData?.sitioweb && (
                      <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                        <Globe className="h-4 w-4 flex-shrink-0" />
                        <a href={displayData.sitioweb} target="_blank" rel="noopener noreferrer" className="text-[#3259B5] hover:underline break-all">
                          {displayData.sitioweb}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="general" className="w-full max-w-full">
          <div className="mb-4 sm:mb-6 w-full max-w-full">
            <TabsList className="flex flex-col sm:flex-row w-full max-w-full h-auto sm:h-10 gap-2 sm:gap-1 p-2 sm:p-1 bg-muted/50 rounded-lg">
              <TabsTrigger value="general" className="w-full sm:w-auto text-xs sm:text-sm px-4 py-3 sm:py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">General</TabsTrigger>
              <TabsTrigger value="ubicacion" className="w-full sm:w-auto text-xs sm:text-sm px-4 py-3 sm:py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Ubicación</TabsTrigger>
              <TabsTrigger value="comercial" className="w-full sm:w-auto text-xs sm:text-sm px-4 py-3 sm:py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Comercial</TabsTrigger>
              <TabsTrigger value="productos-servicios" className="w-full sm:w-auto text-xs sm:text-sm px-4 py-3 sm:py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Productos/Servicios</TabsTrigger>
              <TabsTrigger value="certificaciones" className="w-full sm:w-auto text-xs sm:text-sm px-4 py-3 sm:py-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Certificaciones</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="space-y-4 sm:space-y-6 w-full max-w-full mt-0">
  <Card className="w-full max-w-full overflow-hidden">
    <CardHeader>
      <CardTitle className="text-[#222A59] text-base sm:text-lg md:text-xl">Datos de la Empresa</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 w-full max-w-full overflow-hidden">
      {/* Razón Social */}
      <div className="min-w-0 w-full">
        <Label>Razón Social</Label>
        {isEditing ? (
          <Input
            value={editedData?.razon_social || ''}
            onChange={(e) => setEditedData(editedData ? { ...editedData, razon_social: e.target.value } : null)}
            className="w-full max-w-full"
          />
        ) : (
          <p className="mt-1 font-semibold break-words overflow-wrap-anywhere">{displayData?.razon_social}</p>
        )}
      </div>

      {/* Nombre de Fantasía */}
      <div className="min-w-0 w-full">
        <Label>Nombre de Fantasía</Label>
        {isEditing ? (
          <Input
            value={editedData?.nombre_fantasia || ''}
            onChange={(e) => setEditedData(editedData ? { ...editedData, nombre_fantasia: e.target.value } : null)}
            className="w-full max-w-full"
          />
        ) : (
          <p className="mt-1 font-semibold break-words overflow-wrap-anywhere">{displayData?.nombre_fantasia || 'N/A'}</p>
        )}
      </div>

      {/* CUIT */}
      <div className="min-w-0 w-full">
        <Label>CUIT</Label>
        {isEditing ? (
          <Input
            value={editedData?.cuit_cuil || ''}
            onChange={(e) => setEditedData(editedData ? { ...editedData, cuit_cuil: e.target.value } : null)}
            className="w-full max-w-full"
          />
        ) : (
          <p className="mt-1 font-semibold">{displayData?.cuit_cuil}</p>
        )}
      </div>

      {/* Tipo de Sociedad */}
      <div className="min-w-0 w-full">
        <Label>Tipo de Sociedad</Label>
        {isEditing ? (
          <Select
            value={editedData?.tipo_sociedad || ''}
            onValueChange={(value) => setEditedData(editedData ? { ...editedData, tipo_sociedad: value } : null)}
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
          <p className="mt-1 font-semibold">{displayData?.tipo_sociedad || 'N/A'}</p>
        )}
      </div>

      {/* Tipo de Empresa */}
      <div className="min-w-0 w-full">
        <Label>Tipo de Empresa</Label>
        <p className="mt-1 font-semibold break-words overflow-wrap-anywhere">
          {displayData?.tipo_empresa_detalle?.nombre || 
           displayData?.tipo_empresa_valor || 
           displayData?.tipo_empresa || 
           'N/A'}
        </p>
      </div>

      {/* Rubro - Mostrar según tipo de empresa */}
      {(displayData?.tipo_empresa_valor === 'mixta' || editedData?.tipo_empresa_valor === 'mixta') ? (
        <>
          {/* Rubro de Productos */}
          <div className="min-w-0 w-full">
            <Label>Rubro de Productos</Label>
            {isEditing ? (
              <Select
                value={rubroProducto ? String(rubroProducto) : ''}
                onValueChange={(value) => {
                  setRubroProducto(parseInt(value))
                }}
                disabled={loadingRubros || rubros.length === 0}
              >
                <SelectTrigger className="w-full max-w-full">
                  <SelectValue placeholder={
                    loadingRubros 
                      ? "Cargando..." 
                      : rubros.length === 0 
                      ? "No hay rubros disponibles" 
                      : "Selecciona un rubro de productos"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {rubros.length > 0 ? (
                    rubros.map((rubro) => (
                      <SelectItem key={rubro.id} value={String(rubro.id)}>
                        {rubro.nombre}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No hay rubros disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <p className="mt-1 font-semibold">
                {displayData?.rubro_producto_nombre || displayData?.rubro_nombre || 'N/A'}
              </p>
            )}
          </div>
          
          {/* Rubro de Servicios */}
          <div>
            <Label>Rubro de Servicios</Label>
            {isEditing ? (
              <Select
                value={rubroServicio ? String(rubroServicio) : ''}
                onValueChange={(value) => {
                  setRubroServicio(parseInt(value))
                }}
                disabled={loadingRubros || rubros.length === 0}
              >
                <SelectTrigger className="w-full max-w-full">
                  <SelectValue placeholder={
                    loadingRubros 
                      ? "Cargando..." 
                      : rubros.length === 0 
                      ? "No hay rubros disponibles" 
                      : "Selecciona un rubro de servicios"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {rubros.length > 0 ? (
                    rubros.map((rubro) => (
                      <SelectItem key={rubro.id} value={String(rubro.id)}>
                        {rubro.nombre}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No hay rubros disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <p className="mt-1 font-semibold">
                {displayData?.rubro_servicio_nombre || displayData?.rubro_nombre || 'N/A'}
              </p>
            )}
          </div>
        </>
      ) : (
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
              {displayData?.rubro_nombre || 
               (typeof displayData?.id_rubro === 'object' ? displayData.id_rubro.nombre : displayData?.id_rubro) || 
               'N/A'}
            </p>
          )}
        </div>
      )}


                {/* SubRubro - Mostrar según tipo de empresa */}
        {(displayData?.tipo_empresa_valor === 'mixta' || editedData?.tipo_empresa_valor === 'mixta') ? (
          <>
            {/* SubRubro de Productos */}
            <div>
              <Label>SubRubro de Productos</Label>
              {isEditing ? (
                <Select
                  value={editedData?.id_subrubro_producto 
                    ? String(typeof editedData.id_subrubro_producto === 'object' 
                        ? editedData.id_subrubro_producto.id 
                        : editedData.id_subrubro_producto)
                    : ''
                  }
                  onValueChange={(value) => {
                    setEditedData(editedData ? { 
                      ...editedData, 
                      id_subrubro_producto: parseInt(value)
                    } : null)
                  }}
                  disabled={loadingRubros || !rubroProducto || subRubrosProductos.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      loadingRubros 
                        ? "Cargando..." 
                        : !rubroProducto
                        ? "Selecciona primero un rubro de productos" 
                        : subRubrosProductos.length === 0 
                        ? "No hay subrubros disponibles" 
                        : "Selecciona un subrubro de productos"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {subRubrosProductos.length > 0 ? (
                      subRubrosProductos.map((subRubro) => (
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
                  {displayData?.sub_rubro_producto_nombre || 'N/A'}
                </p>
              )}
            </div>
            
            {/* SubRubro de Servicios */}
            <div>
              <Label>SubRubro de Servicios</Label>
              {isEditing ? (
                <Select
                  value={editedData?.id_subrubro_servicio 
                    ? String(typeof editedData.id_subrubro_servicio === 'object' 
                        ? editedData.id_subrubro_servicio.id 
                        : editedData.id_subrubro_servicio)
                    : ''
                  }
                  onValueChange={(value) => {
                    setEditedData(editedData ? { 
                      ...editedData, 
                      id_subrubro_servicio: parseInt(value)
                    } : null)
                  }}
                  disabled={loadingRubros || !rubroServicio || subRubrosServicios.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      loadingRubros 
                        ? "Cargando..." 
                        : !rubroServicio
                        ? "Selecciona primero un rubro de servicios" 
                        : subRubrosServicios.length === 0 
                        ? "No hay subrubros disponibles" 
                        : "Selecciona un subrubro de servicios"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {subRubrosServicios.length > 0 ? (
                      subRubrosServicios.map((subRubro) => (
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
                  {displayData?.sub_rubro_servicio_nombre || 'N/A'}
                </p>
              )}
            </div>
          </>
        ) : (
          <div>
            <Label>SubRubro</Label>
            {isEditing ? (
              <Select
                value={editedData?.id_subrubro 
                  ? String(typeof editedData.id_subrubro === 'object' ? editedData.id_subrubro.id : editedData.id_subrubro)
                  : ''
                }
                onValueChange={(value) => {
                  setEditedData(editedData ? { 
                    ...editedData, 
                    id_subrubro: parseInt(value)
                  } : null)
                }}
                disabled={loadingRubros || !editedData?.id_rubro || subRubros.length === 0}
              >
                <SelectTrigger className="w-full max-w-full">
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
                {displayData?.sub_rubro_nombre || 
                 (typeof displayData?.id_subrubro === 'object' 
                   ? displayData.id_subrubro.nombre 
                   : displayData?.id_subrubro) || 
                 'N/A'}
              </p>
            )}
          </div>
        )}

      {/* Teléfono */}
      <div>
        <Label>Teléfono</Label>
        {isEditing ? (
          <Input
            value={editedData?.telefono || ''}
            onChange={(e) => setEditedData(editedData ? { ...editedData, telefono: e.target.value } : null)}
          />
        ) : (
          <p className="mt-1 font-semibold">{displayData?.telefono || 'N/A'}</p>
        )}
      </div>

      {/* Email (Email del usuario para iniciar sesión) */}
      <div>
        <Label>Email</Label>
        {isEditing ? (
          <Input
            type="email"
            value={userEmail || user?.email || ''}
            disabled
            className="bg-muted"
          />
        ) : (
          <p className="mt-1 font-semibold">{userEmail || user?.email || 'N/A'}</p>
        )}
      </div>

      {/* Sitio Web */}
      <div>
        <Label>Sitio Web</Label>
        {isEditing ? (
          <Input
            type="url"
            value={editedData?.sitioweb || ''}
            onChange={(e) => setEditedData(editedData ? { ...editedData, sitioweb: e.target.value } : null)}
          />
        ) : (
          <p className="mt-1 font-semibold">
            {displayData?.sitioweb ? (
              <a href={displayData.sitioweb} target="_blank" rel="noopener noreferrer" className="text-[#3259B5] hover:underline">
                {displayData.sitioweb}
              </a>
            ) : (
              'N/A'
            )}
          </p>
        )}
      </div>

      {/* Redes Sociales */}
      {(displayData?.instagram || displayData?.facebook || displayData?.linkedin || isEditing) && (
        <div className="md:col-span-2">
          <Label>Redes Sociales</Label>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 w-full max-w-full">
            <div className="min-w-0 w-full">
              <span className="text-sm text-muted-foreground">Instagram</span>
              {isEditing ? (
                <Input
                  value={editedData?.instagram || ''}
                  className="w-full max-w-full"
                  onChange={(e) => setEditedData(editedData ? { ...editedData, instagram: e.target.value } : null)}
                  placeholder="usuario o URL"
                />
              ) : (
                displayData?.instagram ? (
                  <a href={displayData.instagram.startsWith('http') ? displayData.instagram : `https://instagram.com/${displayData.instagram}`} 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-[#3259B5] hover:underline block mt-1 break-all">
                    {displayData.instagram}
                  </a>
                ) : (
                  <p className="mt-1 font-semibold">N/A</p>
                )
              )}
            </div>
            <div className="min-w-0 w-full">
              <span className="text-sm text-muted-foreground">Facebook</span>
              {isEditing ? (
                <Input
                  value={editedData?.facebook || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, facebook: e.target.value } : null)}
                  placeholder="usuario o URL"
                  className="w-full max-w-full"
                />
              ) : (
                displayData?.facebook ? (
                  <a href={displayData.facebook.startsWith('http') ? displayData.facebook : `https://facebook.com/${displayData.facebook}`} 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-[#3259B5] hover:underline block mt-1 break-all">
                    {displayData.facebook}
                  </a>
                ) : (
                  <p className="mt-1 font-semibold">N/A</p>
                )
              )}
            </div>
            <div className="min-w-0 w-full">
              <span className="text-sm text-muted-foreground">LinkedIn</span>
              {isEditing ? (
                <Input
                  value={editedData?.linkedin || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, linkedin: e.target.value } : null)}
                  placeholder="usuario o URL"
                  className="w-full max-w-full"
                />
              ) : (
                displayData?.linkedin ? (
                  <a href={displayData.linkedin.startsWith('http') ? displayData.linkedin : `https://linkedin.com/company/${displayData.linkedin}`} 
                     target="_blank" rel="noopener noreferrer" 
                     className="text-[#3259B5] hover:underline block mt-1 break-all">
                    {displayData.linkedin}
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
      {(displayData?.contacto_principal_nombre || displayData?.contacto_principal_apellido || displayData?.contacto_principal_cargo || displayData?.contacto_principal_telefono || displayData?.contacto_principal_email || isEditing) && (
        <div className="md:col-span-2">
          <Label>Contacto Principal</Label>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg w-full max-w-full">
            <div className="min-w-0 w-full">
              <span className="text-sm text-muted-foreground">Nombre</span>
              {isEditing ? (
                <Input
                  value={editedData?.contacto_principal_nombre || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_nombre: e.target.value } : null)}
                  className="w-full max-w-full"
                />
              ) : (
                <p className="mt-1 font-semibold break-words">{displayData?.contacto_principal_nombre || 'N/A'}</p>
              )}
            </div>
            <div className="min-w-0 w-full">
              <span className="text-sm text-muted-foreground">Apellido</span>
              {isEditing ? (
                <Input
                  value={editedData?.contacto_principal_apellido || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_apellido: e.target.value } : null)}
                  className="w-full max-w-full"
                />
              ) : (
                <p className="mt-1 font-semibold break-words">{displayData?.contacto_principal_apellido || 'N/A'}</p>
              )}
            </div>
            <div className="min-w-0 w-full">
              <span className="text-sm text-muted-foreground">Cargo</span>
              {isEditing ? (
                <Input
                  value={editedData?.contacto_principal_cargo || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_cargo: e.target.value } : null)}
                  className="w-full max-w-full"
                />
              ) : (
                <p className="mt-1 font-semibold break-words">{displayData?.contacto_principal_cargo || 'N/A'}</p>
              )}
            </div>
            <div className="min-w-0 w-full">
              <span className="text-sm text-muted-foreground">Teléfono</span>
              {isEditing ? (
                <Input
                  value={editedData?.contacto_principal_telefono || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_telefono: e.target.value } : null)}
                  className="w-full max-w-full"
                />
              ) : (
                <p className="mt-1 font-semibold break-words">{displayData?.contacto_principal_telefono || 'N/A'}</p>
              )}
            </div>
            <div className="min-w-0 w-full">
              <span className="text-sm text-muted-foreground">Email</span>
              {isEditing ? (
                <Input
                  type="email"
                  value={editedData?.contacto_principal_email || ''}
                  onChange={(e) => setEditedData(editedData ? { ...editedData, contacto_principal_email: e.target.value } : null)}
                  className="w-full max-w-full"
                />
              ) : (
                <p className="mt-1 font-semibold break-all">{displayData?.contacto_principal_email || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contactos Secundarios y Terciarios */}
{(displayData?.contacto_secundario_nombre || displayData?.contacto_terciario_nombre || isEditing) && (
  <div className="md:col-span-2">
    <Label>Contactos Adicionales</Label>
    <div className="mt-2 space-y-4">
      {/* Contacto Secundario */}
      {(displayData?.contacto_secundario_nombre || isEditing) && (
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
                <p className="mt-1 font-semibold">{displayData?.contacto_secundario_nombre || 'N/A'}</p>
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
                <p className="mt-1 font-semibold">{displayData?.contacto_secundario_apellido || 'N/A'}</p>
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
                <p className="mt-1 font-semibold">{displayData?.contacto_secundario_cargo || 'N/A'}</p>
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
                <p className="mt-1 font-semibold">{displayData?.contacto_secundario_telefono || 'N/A'}</p>
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
                <p className="mt-1 font-semibold">{displayData?.contacto_secundario_email || 'N/A'}</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Contacto Terciario */}
      {(displayData?.contacto_terciario_nombre || isEditing) && (
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
                <p className="mt-1 font-semibold">{displayData?.contacto_terciario_nombre || 'N/A'}</p>
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
                <p className="mt-1 font-semibold">{displayData?.contacto_terciario_apellido || 'N/A'}</p>
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
                <p className="mt-1 font-semibold">{displayData?.contacto_terciario_cargo || 'N/A'}</p>
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
                <p className="mt-1 font-semibold">{displayData?.contacto_terciario_telefono || 'N/A'}</p>
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
                <p className="mt-1 font-semibold">{displayData?.contacto_terciario_email || 'N/A'}</p>
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

          <TabsContent value="ubicacion" className="space-y-4 sm:space-y-6 w-full max-w-full mt-0">
  <Card className="w-full max-w-full overflow-hidden">
    <CardHeader>
      <CardTitle className="text-[#222A59] text-base sm:text-lg md:text-xl">Ubicación</CardTitle>
      <CardDescription className="text-xs sm:text-sm">Dirección, código postal, departamento, municipio, localidad y geolocalización</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden p-4 sm:p-6">
      {/* Domicilio del Establecimiento Productivo */}
      <div className="w-full max-w-full">
        <h3 className="text-base sm:text-lg font-semibold mb-3">Domicilio del Establecimiento Productivo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-full">
          {/* Dirección */}
          <div className="min-w-0 w-full">
            <Label>Dirección</Label>
            {isEditing ? (
              <Input
                value={editedData?.direccion || ''}
                onChange={(e) => setEditedData(editedData ? { ...editedData, direccion: e.target.value } : null)}
                placeholder="Calle y número"
                className="w-full max-w-full"
              />
            ) : (
              <p className="mt-1 font-semibold break-words">{displayData?.direccion || 'N/A'}</p>
            )}
          </div>

          {/* Código Postal */}
          <div className="min-w-0 w-full">
            <Label>Código Postal</Label>
            {isEditing ? (
              <Input
                value={editedData?.codigo_postal || ''}
                onChange={(e) => setEditedData(editedData ? { ...editedData, codigo_postal: e.target.value } : null)}
                placeholder="Ej: 4700"
                className="w-full max-w-full"
              />
            ) : (
              <p className="mt-1 font-semibold">{displayData?.codigo_postal || 'N/A'}</p>
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
                    municipio: null, // Reset municipio when departamento changes
                    localidad: null  // Reset localidad when departamento changes
                  } : null)
                  loadMunicipiosData(parseInt(value))
                  setMunicipios([]) // Clear municipios immediately
                  setLocalidades([]) // Clear localidades immediately
                }}
                disabled={loadingGeo}
              >
                <SelectTrigger className="w-full max-w-full">
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
                {displayData?.departamento_nombre || 
                 (typeof displayData?.departamento === 'object' ? (displayData.departamento.nomdpto || displayData.departamento.nombre) : displayData?.departamento) || 
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
                    localidad: null // Reset localidad when municipio changes
                  } : null)
                  loadLocalidadesData(parseInt(value))
                  setLocalidades([]) // Clear localidades immediately
                }}
                disabled={loadingGeo || !editedData?.departamento || municipios.length === 0}
              >
                <SelectTrigger className="w-full max-w-full">
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
                {displayData?.municipio_nombre || 
                 (typeof displayData?.municipio === 'object' ? (displayData.municipio.nommun || displayData.municipio.nombre) : displayData?.municipio) || 
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
                <SelectTrigger className="w-full max-w-full">
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
                {displayData?.localidad_nombre || 
                 (displayData?.localidad && typeof displayData.localidad === 'object' && displayData.localidad !== null ? (displayData.localidad.nomloc || displayData.localidad.nombre) : (typeof displayData?.localidad === 'string' ? displayData.localidad : null)) || 
                 'N/A'}
              </p>
            )}
          </div>

          {/* Geolocalización / Mapa */}
          {displayData?.geolocalizacion && (() => {
            const geoString = displayData.geolocalizacion
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
            }
            
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
                      address={displayData?.direccion || displayData?.razon_social}
                    />
                  </div>
                </div>
              )
            }

            // Modo edición activa del mapa
            if (geoEditMode === 'editing') {
              const currentCoords = tempGeoCoordinates || coordinates
              const coordString = `${currentCoords.lat},${currentCoords.lng}`
              
              return (
                <div className="md:col-span-2">
                  <Label>Ubicación en el Mapa</Label>
                  <div className="mt-2 relative z-0">
                    <LocationPicker
                      value={coordString}
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
                      disabled={!tempGeoCoordinates || saving}
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
                    address={displayData?.direccion || displayData?.razon_social}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-full">
          {/* Dirección Comercial */}
          <div>
            <Label>Dirección</Label>
            {isEditing ? (
              <Input
                value={editedData?.direccion_comercial || ''}
                onChange={(e) => setEditedData(editedData ? { ...editedData, direccion_comercial: e.target.value } : null)}
                placeholder="Calle y número (opcional)"
              />
            ) : (
              <p className="mt-1 font-semibold">{displayData?.direccion_comercial || 'N/A'}</p>
            )}
          </div>

          {/* Código Postal Comercial */}
          <div>
            <Label>Código Postal</Label>
            {isEditing ? (
              <Input
                value={editedData?.codigo_postal_comercial || ''}
                onChange={(e) => setEditedData(editedData ? { ...editedData, codigo_postal_comercial: e.target.value } : null)}
                placeholder="Ej: 4700 (opcional)"
              />
            ) : (
              <p className="mt-1 font-semibold">{displayData?.codigo_postal_comercial || 'N/A'}</p>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>

          
<TabsContent value="comercial" className="space-y-4 sm:space-y-6 w-full max-w-full mt-0">
  <Card className="w-full max-w-full overflow-hidden">
    <CardHeader>
      <CardTitle className="text-[#222A59] text-base sm:text-lg md:text-xl">Actividad Comercial</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4 sm:space-y-6 w-full max-w-full overflow-hidden p-4 sm:p-6">
      {/* Datos de exportación/importación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
  <Label>¿Exporta?</Label>
  {isEditing ? (
    <Select
      value={displayData?.exporta || ''}
      onValueChange={(value) => setEditedData(displayData ? { ...displayData, exporta: value } : null)}
    >
            <SelectTrigger className="w-full max-w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
      <SelectContent>
        <SelectItem value="Sí">Sí</SelectItem>
        <SelectItem value="No, solo ventas nacionales">No</SelectItem>
        <SelectItem value="En proceso">En proceso</SelectItem>
      </SelectContent>
    </Select>
  ) : (
    <p className="mt-1 font-semibold">{displayData?.exporta || 'N/A'}</p>
  )}
</div>

{/* Mostrar "Interés en Exportar" solo si NO exporta */}
{(displayData?.exporta === "No, solo ventas nacionales" || displayData?.exporta === "No") && (
  <div>
    <Label>¿Interés en Exportar?</Label>
    {isEditing ? (
      <Select
        value={displayData?.interes_exportar ? 'si' : 'no'}
        onValueChange={(value) => setEditedData(displayData ? { 
          ...displayData, 
          interes_exportar: value === 'si' 
        } : null)}
      >
            <SelectTrigger className="w-full max-w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
        <SelectContent>
          <SelectItem value="si">Sí</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    ) : (
      <p className="mt-1 font-semibold">
        {displayData?.interes_exportar === true || displayData?.interes_exportar === 'true' 
          ? 'Sí' 
          : displayData?.interes_exportar === false || displayData?.interes_exportar === 'false'
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
              value={displayData?.destinoexporta || ''}
              onChange={(e) => setEditedData(displayData ? { ...displayData, destinoexporta: e.target.value } : null)}
              rows={3}
            />
          ) : (
            <p className="mt-1 font-semibold">{displayData?.destinoexporta || 'N/A'}</p>
          )}
        </div>
        <div>
          <Label>¿Importa?</Label>
          {isEditing ? (
            <Select
              value={displayData?.importa === true || displayData?.importa === 'true' || displayData?.importa === 'si' ? 'si' : 'no'}
              onValueChange={(value) => {
                const importaValue = value === 'si'
                setEditedData(displayData ? { ...displayData, importa: importaValue } : null)
              }}
            >
            <SelectTrigger className="w-full max-w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
              <SelectContent>
                <SelectItem value="si">Sí</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="mt-1 font-semibold">{displayData?.importa ? 'Sí' : 'No'}</p>
          )}
        </div>
        <div>
          <Label>Idiomas de Trabajo</Label>
          {isEditing ? (
            <Input
              value={displayData?.idiomas_trabaja || ''}
              onChange={(e) => setEditedData(displayData ? { ...displayData, idiomas_trabaja: e.target.value } : null)}
            />
          ) : (
            <p className="mt-1 font-semibold">{displayData?.idiomas_trabaja || 'N/A'}</p>
          )}
        </div>
      </div>

      {/* Sección de Años por Etapa */}
      <div className="pt-6 border-t">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[#222A59]">
            Años por Etapa de Clasificación
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Cantidad de años que la empresa lleva en cada etapa de clasificación
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Años en Etapa Inicial</Label>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                value={editedData?.anos_etapa_inicial ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value, 10)
                  setEditedData(editedData ? { ...editedData, anos_etapa_inicial: isNaN(value as number) ? null : value } : null)
                }}
                placeholder="Años"
              />
            ) : (
              <p className="mt-1 font-semibold">{displayData?.anos_etapa_inicial ?? 'N/A'}</p>
            )}
          </div>
          <div>
            <Label>Años como Potencial Exportadora</Label>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                value={editedData?.anos_potencial_exportadora ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value, 10)
                  setEditedData(editedData ? { ...editedData, anos_potencial_exportadora: isNaN(value as number) ? null : value } : null)
                }}
                placeholder="Años"
              />
            ) : (
              <p className="mt-1 font-semibold">{displayData?.anos_potencial_exportadora ?? 'N/A'}</p>
            )}
          </div>
          <div>
            <Label>Años como Exportadora</Label>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                value={editedData?.anos_exportadora ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : parseInt(e.target.value, 10)
                  setEditedData(editedData ? { ...editedData, anos_exportadora: isNaN(value as number) ? null : value } : null)
                }}
                placeholder="Años"
              />
            ) : (
              <p className="mt-1 font-semibold">{displayData?.anos_exportadora ?? 'N/A'}</p>
            )}
          </div>
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
          displayData?.actividades_promocion_internacional && 
          Array.isArray(displayData.actividades_promocion_internacional) && 
          displayData.actividades_promocion_internacional.length > 0 ? (
            <div className="space-y-3">
              {displayData.actividades_promocion_internacional.map((actividad: any, index: number) => (
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

          <TabsContent value="productos-servicios" className="space-y-4 sm:space-y-6 w-full max-w-full mt-0">
  <Card className="w-full max-w-full overflow-hidden">
    <CardHeader>
      <CardTitle className="text-[#222A59] text-base sm:text-lg md:text-xl">
        {empresa.tipo_empresa === 'producto' || empresa.tipo_empresa_valor === 'producto' ? 'Productos' : 
         empresa.tipo_empresa === 'servicio' || empresa.tipo_empresa_valor === 'servicio' ? 'Servicios' : 
         'Productos y Servicios'}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {/* PRODUCTOS */}
      {(empresa.tipo_empresa === 'producto' || empresa.tipo_empresa === 'mixta' || empresa.tipo_empresa_valor === 'producto' || empresa.tipo_empresa_valor === 'mixta') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Productos</h3>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // ✅ FIX: Detectar si es mixta y usar el campo correcto
                  const esMixta = empresa.tipo_empresa_valor === 'mixta'
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
            // ✅ FIX: Obtener productos del campo correcto según el tipo
            const esMixta = displayData?.tipo_empresa_valor === 'mixta'
            const productosData = esMixta 
              ? (displayData?.productos_mixta || [])
              : (displayData?.productos || [])
            
            
            return productosData && productosData.length > 0 ? (
              <div className="space-y-4">
                {productosData.map((producto: any, index: number) => (
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
                                  const esMixta = editedData?.tipo_empresa_valor === 'mixta'
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
                                  const esMixta = editedData?.tipo_empresa_valor === 'mixta'
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
                                  value={producto.capacidad_productiva || ''}
                                  onChange={(e) => {
                                    const esMixta = editedData?.tipo_empresa_valor === 'mixta'
                                    const productosKey = esMixta ? 'productos_mixta' : 'productos'
                                    const updatedProductos = [...(editedData?.[productosKey] || [])]
                                    updatedProductos[index] = {
                                      ...updatedProductos[index],
                                      capacidad_productiva: e.target.value
                                    }
                                    setEditedData(editedData ? { ...editedData, [productosKey]: updatedProductos } : null)
                                  }}
                                  placeholder="Ej: 1000"
                                />
                              </div>

                              <div>
                                <Label>Unidad de Medida</Label>
                                <Select
                                  value={producto.unidad_medida || 'kg'}
                                  onValueChange={(value) => {
                                    const esMixta = editedData?.tipo_empresa_valor === 'mixta'
                                    const productosKey = esMixta ? 'productos_mixta' : 'productos'
                                    const updatedProductos = [...(editedData?.[productosKey] || [])]
                                    updatedProductos[index] = {
                                      ...updatedProductos[index],
                                      unidad_medida: value
                                    }
                                    setEditedData(editedData ? { ...editedData, [productosKey]: updatedProductos } : null)
                                  }}
                                >
            <SelectTrigger className="w-full max-w-full">
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
                                  value={producto.periodo_capacidad || 'mensual'}
                                  onValueChange={(value) => {
                                    const esMixta = editedData?.tipo_empresa_valor === 'mixta'
                                    const productosKey = esMixta ? 'productos_mixta' : 'productos'
                                    const updatedProductos = [...(editedData?.[productosKey] || [])]
                                    updatedProductos[index] = {
                                      ...updatedProductos[index],
                                      periodo_capacidad: value
                                    }
                                    setEditedData(editedData ? { ...editedData, [productosKey]: updatedProductos } : null)
                                  }}
                                >
            <SelectTrigger className="w-full max-w-full">
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

                            {/* Posición Arancelaria - SIEMPRE MOSTRAR EN EDICIÓN */}
                            <div>
                              <Label>Posición Arancelaria</Label>
                              <Input
                                value={
                                  typeof producto.posicion_arancelaria === 'object' && producto.posicion_arancelaria
                                    ? producto.posicion_arancelaria.codigo_arancelario || ''
                                    : producto.posicion_arancelaria || ''
                                }
                                onChange={(e) => {
                                  const esMixta = editedData?.tipo_empresa_valor === 'mixta'
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
                                placeholder="Ej: 1234.56.78 (opcional)"
                              />
                            </div>
                          </div>

                          {/* Botón Eliminar */}
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              const esMixta = editedData?.tipo_empresa_valor === 'mixta'
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
                                <span className="text-sm">{producto.capacidad_productiva} {producto.unidad_medida || ''}</span>
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
                                <span className="text-sm">{producto.periodo_capacidad}</span>
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
      {(empresa.tipo_empresa === 'servicio' || empresa.tipo_empresa === 'mixta' || empresa.tipo_empresa_valor === 'servicio' || empresa.tipo_empresa_valor === 'mixta') && (
        <div className={`space-y-4 ${(empresa.tipo_empresa === 'mixta' || empresa.tipo_empresa_valor === 'mixta') ? 'mt-6 pt-6 border-t' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Servicios</h3>
            {isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // ✅ FIX: Detectar si es mixta y usar el campo correcto
                  const esMixta = empresa.tipo_empresa_valor === 'mixta'
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
            // ✅ FIX: Obtener servicios del campo correcto según el tipo
            const esMixta = displayData?.tipo_empresa_valor === 'mixta'
            const serviciosData = esMixta 
              ? (displayData?.servicios_mixta || [])
              : (displayData?.servicios || [])
            
            
            return serviciosData && serviciosData.length > 0 ? (
              <div className="space-y-4">
                {serviciosData.map((servicio: any, index: number) => (
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
                                  const esMixta = editedData?.tipo_empresa_valor === 'mixta'
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
                                  const esMixta = editedData?.tipo_empresa_valor === 'mixta'
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
                                    const esMixta = editedData?.tipo_empresa_valor === 'mixta'
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
                                <Select
                                  value={servicio.sector_atendido || ''}
                                  onValueChange={(value) => {
                                    const esMixta = editedData?.tipo_empresa_valor === 'mixta'
                                    const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                    const updatedServicios = [...(editedData?.[serviciosKey] || [])]
                                    updatedServicios[index] = {
                                      ...updatedServicios[index],
                                      sector_atendido: value
                                    }
                                    setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un sector" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mineria">Minería</SelectItem>
                                    <SelectItem value="agroindustria">Agroindustria</SelectItem>
                                    <SelectItem value="turismo">Turismo</SelectItem>
                                    <SelectItem value="comercio">Comercio</SelectItem>
                                    <SelectItem value="salud">Salud</SelectItem>
                                    <SelectItem value="pymes">Pymes</SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Alcance y Forma de Contratación */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Alcance Geográfico</Label>
                                <Select
                                  value={servicio.alcance_geografico || servicio.alcance_servicio || 'local'}
                                  onValueChange={(value) => {
                                    const esMixta = editedData?.tipo_empresa_valor === 'mixta'
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
                                    const esMixta = editedData?.tipo_empresa_valor === 'mixta'
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
                            
                            {/* Países con los que Trabaja */}
                            <div>
                              <Label>Países con los que Trabaja</Label>
                              <Textarea
                                value={servicio.paises_trabaja || servicio.paises_destino || ''}
                                onChange={(e) => {
                                  const esMixta = editedData?.tipo_empresa_valor === 'mixta'
                                  const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                  const updatedServicios = [...(editedData?.[serviciosKey] || [])]
                                  updatedServicios[index] = {
                                    ...updatedServicios[index],
                                    paises_trabaja: e.target.value,
                                    paises_destino: e.target.value
                                  }
                                  setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                }}
                                placeholder="Ej: Brasil, Chile, México (separados por comas)"
                                rows={2}
                              />
                            </div>

                            {/* Exporta Servicios e Interés */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>¿Exporta Servicios?</Label>
                                <Select
                                  value={servicio.exporta_servicios || servicio.exporta_servicios_alias ? 'si' : 'no'}
                                  onValueChange={(value) => {
                                    const esMixta = editedData?.tipo_empresa_valor === 'mixta'
                                    const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                    const updatedServicios = [...(editedData?.[serviciosKey] || [])]
                                    updatedServicios[index] = {
                                      ...updatedServicios[index],
                                      exporta_servicios: value === 'si',
                                      exporta_servicios_alias: value === 'si'
                                    }
                                    setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                  }}
                                >
            <SelectTrigger className="w-full max-w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="si">Sí</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>¿Interés en Exportar Servicios?</Label>
                                <Select
                                  value={servicio.interes_exportar_servicios || servicio.interes_exportar ? 'si' : 'no'}
                                  onValueChange={(value) => {
                                    const esMixta = editedData?.tipo_empresa_valor === 'mixta'
                                    const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                    const updatedServicios = [...(editedData?.[serviciosKey] || [])]
                                    updatedServicios[index] = {
                                      ...updatedServicios[index],
                                      interes_exportar_servicios: value === 'si',
                                      interes_exportar: value === 'si'
                                    }
                                    setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                  }}
                                >
            <SelectTrigger className="w-full max-w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="si">Sí</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Idiomas de Trabajo */}
                            <div>
                              <Label>Idiomas de Trabajo</Label>
                              <Input
                                value={Array.isArray(servicio.idiomas) 
                                  ? servicio.idiomas.join(', ') 
                                  : (servicio.idiomas_trabajo || '')}
                                onChange={(e) => {
                                  const esMixta = editedData?.tipo_empresa_valor === 'mixta'
                                  const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                  const updatedServicios = [...(editedData?.[serviciosKey] || [])]
                                  updatedServicios[index] = {
                                    ...updatedServicios[index],
                                    idiomas_trabajo: e.target.value,
                                    idiomas: e.target.value.split(',').map(i => i.trim()).filter(Boolean)
                                  }
                                  setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                }}
                                placeholder="Ej: Español, Inglés, Portugués"
                              />
                            </div>

                            {/* Certificaciones Técnicas */}
                            <div>
                              <Label>Certificaciones Técnicas</Label>
                              <Textarea
                                value={servicio.certificaciones_tecnicas || ''}
                                onChange={(e) => {
                                  const esMixta = editedData?.tipo_empresa_valor === 'mixta'
                                  const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                  const updatedServicios = [...(editedData?.[serviciosKey] || [])]
                                  updatedServicios[index] = {
                                    ...updatedServicios[index],
                                    certificaciones_tecnicas: e.target.value
                                  }
                                  setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                }}
                                placeholder="Ej: ISO 9001, ISO 14001, SCRUM, AWS"
                                rows={2}
                              />
                            </div>

                            {/* Equipo Técnico */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>¿Tiene Equipo Técnico Especializado?</Label>
                                <Select
                                  value={servicio.tiene_equipo_tecnico ? 'si' : 'no'}
                                  onValueChange={(value) => {
                                    const esMixta = editedData?.tipo_empresa_valor === 'mixta'
                                    const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                    const updatedServicios = [...(editedData?.[serviciosKey] || [])]
                                    updatedServicios[index] = {
                                      ...updatedServicios[index],
                                      tiene_equipo_tecnico: value === 'si'
                                    }
                                    setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                  }}
                                >
            <SelectTrigger className="w-full max-w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="si">Sí</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>¿Equipo en Formación?</Label>
                                <Select
                                  value={servicio.equipo_tecnico_formacion ? 'si' : 'no'}
                                  onValueChange={(value) => {
                                    const esMixta = editedData?.tipo_empresa_valor === 'mixta'
                                    const serviciosKey = esMixta ? 'servicios_mixta' : 'servicios'
                                    const updatedServicios = [...(editedData?.[serviciosKey] || [])]
                                    updatedServicios[index] = {
                                      ...updatedServicios[index],
                                      equipo_tecnico_formacion: value === 'si'
                                    }
                                    setEditedData(editedData ? { ...editedData, [serviciosKey]: updatedServicios } : null)
                                  }}
                                >
            <SelectTrigger className="w-full max-w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="si">Sí</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
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
                              const esMixta = editedData?.tipo_empresa_valor === 'mixta'
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
                            {/* Tipo de Servicio */}
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
                            
                            {/* Sectores Atendidos */}
                            {(servicio.sector_atendido || (servicio.sectores && servicio.sectores.length > 0)) && (
                              <div>
                                <span className="text-sm font-medium">Sectores Atendidos: </span>
                                <span className="text-sm">
                                  {servicio.sector_atendido || 
                                  (Array.isArray(servicio.sectores) ? servicio.sectores.join(', ') : servicio.sectores)}
                                </span>
                              </div>
                            )}
                            
                            {/* Alcance Geográfico */}
                            {(servicio.alcance_geografico || servicio.alcance_servicio) && (
                              <div>
                                <span className="text-sm font-medium">Alcance Geográfico: </span>
                                <span className="text-sm">
                                  {servicio.alcance_geografico || servicio.alcance_servicio || 'N/A'}
                                </span>
                              </div>
                            )}
                            
                            {/* Países con los que Trabaja */}
                            {(servicio.paises_trabaja || servicio.paises_destino) && (
                              <div>
                                <span className="text-sm font-medium">Países: </span>
                                <span className="text-sm">
                                  {servicio.paises_trabaja || servicio.paises_destino}
                                </span>
                              </div>
                            )}
                            
                            {/* Forma de Contratación */}
                            {servicio.forma_contratacion && (
                              <div>
                                <span className="text-sm font-medium">Forma de Contratación: </span>
                                <span className="text-sm">
                                  {Array.isArray(servicio.forma_contratacion) 
                                    ? servicio.forma_contratacion.map((forma: string) => {
                                        const formatFormaContratacion = (forma: string) => {
                                          switch(forma) {
                                            case 'hora': return 'Por Hora';
                                            case 'proyecto': return 'Por Proyecto';
                                            case 'mensual': return 'Mensual';
                                            case 'otro': return 'Otro';
                                            default: return forma;
                                          }
                                        }
                                        return formatFormaContratacion(forma);
                                      }).join(', ') 
                                    : (() => {
                                        const forma = servicio.forma_contratacion;
                                        switch(forma) {
                                          case 'hora': return 'Por Hora';
                                          case 'proyecto': return 'Por Proyecto';
                                          case 'mensual': return 'Mensual';
                                          case 'otro': return 'Otro';
                                          default: return forma;
                                        }
                                      })()}
                                </span>
                              </div>
                            )}
                            
                            {/* Exporta Servicios */}
                            {(servicio.exporta_servicios !== undefined || servicio.exporta_servicios_alias !== undefined) && (
                              <div>
                                <span className="text-sm font-medium">¿Exporta Servicios?: </span>
                                <span className="text-sm">
                                  {(servicio.exporta_servicios || servicio.exporta_servicios_alias) ? 'Sí' : 'No'}
                                </span>
                              </div>
                            )}
                            
                            {/* Interés en Exportar Servicios */}
                            {(servicio.interes_exportar_servicios !== undefined || servicio.interes_exportar !== undefined) && (
                              <div>
                                <span className="text-sm font-medium">¿Interés en Exportar?: </span>
                                <span className="text-sm">
                                  {(servicio.interes_exportar_servicios || servicio.interes_exportar) ? 'Sí' : 'No'}
                                </span>
                              </div>
                            )}
                            
                            {/* Idiomas de Trabajo */}
                            {(servicio.idiomas_trabajo || (servicio.idiomas && servicio.idiomas.length > 0)) && (
                              <div>
                                <span className="text-sm font-medium">Idiomas de Trabajo: </span>
                                <span className="text-sm">
                                  {Array.isArray(servicio.idiomas) 
                                    ? servicio.idiomas.join(', ') 
                                    : (servicio.idiomas_trabajo || 'N/A')}
                                </span>
                              </div>
                            )}
                            
                            {/* Certificaciones Técnicas */}
                            {servicio.certificaciones_tecnicas && (
                              <div className="md:col-span-2">
                                <span className="text-sm font-medium">Certificaciones Técnicas: </span>
                                <span className="text-sm">{servicio.certificaciones_tecnicas}</span>
                              </div>
                            )}
                            
                            {/* Equipo Técnico */}
                            {(servicio.tiene_equipo_tecnico !== undefined || servicio.equipo_tecnico_formacion !== undefined) && (
                              <div className="md:col-span-2">
                                <div className="flex gap-4">
                                  {servicio.tiene_equipo_tecnico !== undefined && (
                                    <div>
                                      <span className="text-sm font-medium">¿Tiene Equipo Técnico?: </span>
                                      <span className="text-sm">{servicio.tiene_equipo_tecnico ? 'Sí' : 'No'}</span>
                                    </div>
                                  )}
                                  {servicio.equipo_tecnico_formacion !== undefined && (
                                    <div>
                                      <span className="text-sm font-medium">¿Equipo en Formación?: </span>
                                      <span className="text-sm">{servicio.equipo_tecnico_formacion ? 'Sí' : 'No'}</span>
                                    </div>
                                  )}
                                </div>
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

          <TabsContent value="certificaciones" className="space-y-4 sm:space-y-6 w-full max-w-full mt-0">
            <Card className="w-full max-w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="text-[#222A59] text-base sm:text-lg md:text-xl">Certificaciones</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 w-full max-w-full overflow-hidden">
                <div>
                  <Label>Certificado MiPyME</Label>
                  {isEditing ? (
                    <Select
                      value={displayData?.certificadopyme === true || displayData?.certificadopyme === 'true' || displayData?.certificadopyme === 'si' ? 'si' : 'no'}
                      onValueChange={(value) => {
                        const certificadopymeValue = value === 'si'
                        setEditedData(displayData ? { ...displayData, certificadopyme: certificadopymeValue } : null)
                      }}
                    >
            <SelectTrigger className="w-full max-w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.certificadopyme ? 'Sí' : 'No'}</p>
                  )}
                </div>
                <div>
                  <Label>Material Promocional en 2 Idiomas</Label>
                  {isEditing ? (
                    <Select
                      value={displayData?.promo2idiomas === true || displayData?.promo2idiomas === 'true' || displayData?.promo2idiomas === 'si' ? 'si' : 'no'}
                      onValueChange={(value) => {
                        const promo2idiomasValue = value === 'si'
                        setEditedData(displayData ? { ...displayData, promo2idiomas: promo2idiomasValue } : null)
                      }}
                    >
            <SelectTrigger className="w-full max-w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.promo2idiomas ? 'Sí' : 'No'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label>Certificaciones</Label>
                  {isEditing ? (
                    <Textarea
                      value={displayData?.certificaciones || ''}
                      onChange={(e) => setEditedData(displayData ? { ...displayData, certificaciones: e.target.value } : null)}
                      rows={4}
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{displayData?.certificaciones || 'N/A'}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label>Observaciones</Label>
                  {isEditing ? (
                    <Textarea
                      value={editedData?.observaciones || ''}
                      onChange={(e) => setEditedData(editedData ? { ...editedData, observaciones: e.target.value } : null)}
                      rows={4}
                      placeholder="Ingrese observaciones sobre la empresa..."
                    />
                  ) : (
                    <div className="mt-1">
                      <p className="font-semibold whitespace-pre-wrap break-words min-h-[1.5rem]">
                        {empresa?.observaciones !== undefined && empresa?.observaciones !== null && empresa.observaciones !== ''
                          ? empresa.observaciones 
                          : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
  <Label>Brochure / Catálogo (PDF)</Label>
  {isEditing ? (
    <div className="space-y-3">
      {/* Mostrar archivo actual si existe */}
      {displayData?.brochure && (
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
          <div className="flex-1">
            <p className="text-sm font-medium">Archivo actual:</p>
            <a
              href={displayData.brochure}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#3259B5] hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ver PDF actual
            </a>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditedData(editedData ? { 
                ...editedData, 
                brochure: null,
                brochure_file: null 
              } : null)
            }}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Eliminar
          </Button>
        </div>
      )}
      
      {/* Input para subir nuevo archivo */}
      <div className="border-2 border-dashed border-[#3259B5] rounded-lg p-6 text-center hover:bg-[#3259B5]/5 transition-colors cursor-pointer">
        <input
          id="brochure-upload"
          type="file"
          accept=".pdf"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              const file = e.target.files[0]
              
              // Validar tamaño (máximo 10MB)
              if (file.size > 10 * 1024 * 1024) {
                toast({
                  title: "Archivo muy grande",
                  description: "El archivo debe ser menor a 10 MB",
                  variant: "destructive",
                })
                return
              }
              
              // Validar tipo
              if (file.type !== 'application/pdf') {
                toast({
                  title: "Formato inválido",
                  description: "Solo se aceptan archivos PDF",
                  variant: "destructive",
                })
                return
              }
              
              // Guardar el archivo en el estado
              setEditedData(editedData ? { 
                ...editedData, 
                brochure_file: file,
                brochure_filename: file.name
              } : null)
            }
          }}
          className="hidden"
        />
        <label htmlFor="brochure-upload" className="cursor-pointer block">
          <div className="text-3xl mb-2">📄</div>
          <p className="font-medium text-[#222A59] mb-1">
            {editedData?.brochure_file 
              ? `Archivo seleccionado: ${editedData.brochure_filename}`
              : displayData?.brochure
              ? "Haz clic para reemplazar el PDF"
              : "Haz clic para cargar PDF"}
          </p>
          <p className="text-xs text-[#6B7280]">Máximo 10 MB</p>
        </label>
      </div>
    </div>
  ) : (
    displayData?.brochure ? (
      <a
        href={displayData.brochure}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 inline-flex items-center gap-2 text-sm text-[#3259B5] font-semibold hover:underline"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Descargar Brochure / Catálogo
      </a>
    ) : (
      <p className="mt-1 font-semibold">N/A</p>
    )
  )}
</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {empresa && (
        <ExportEmpresaDialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          empresa={empresa}
        />
      )}

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
                disabled={saving}
              >
                {saving ? (
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
    </MainLayout>
  )
}

export default function EmpresaProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={
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
    }>
      <EmpresaProfileContent params={params} />
    </Suspense>
  )
}
