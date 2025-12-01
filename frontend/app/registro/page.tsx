"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, ArrowLeft, CheckCircle2, ArrowRight, Plus, X } from "lucide-react"
import { LocationPicker } from "@/components/map/location-picker"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface ContactoSecundario {
  id: string
  nombre: string
  cargo: string
  telefono: string
  email: string
}

interface Producto {
  id: string
  nombre: string
  posicionArancelaria: string
  descripcion: string
  capacidadProductiva: string
  unidadMedida: string
}

interface ActividadPromocion {
  id: string
  tipo: "feria" | "mision" | "ronda"
  lugar: string
  anio: string
  observaciones?: string
}

interface ServicioOfrecido {
  id: string
  tipoServicio: string[]
  descripcion: string
  sectores: string[]
  alcanceGeografico: string
  paisesDestino: string
  exportaServicios: string
  interesExportar: string
  idiomas: string[]
  formaContratacion: string[]
  certificacionesTecnicas: string
  equipoTecnico: string
}

export default function RegistroPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [tipoNegocio, setTipoNegocio] = useState<"productos" | "servicios" | "ambos">("productos")
  
  // Estados para datos geográficos
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [municipios, setMunicipios] = useState<any[]>([])
  const [localidades, setLocalidades] = useState<any[]>([])
  const [loadingGeografia, setLoadingGeografia] = useState(false)
  
  // Estados para rubros y subrubros
  const [rubros, setRubros] = useState<any[]>([])
  const [rubrosProductos, setRubrosProductos] = useState<any[]>([])
  const [rubrosServicios, setRubrosServicios] = useState<any[]>([])
  const [subrubros, setSubrubros] = useState<any[]>([])
  const [subrubrosProductos, setSubrubrosProductos] = useState<any[]>([])
  const [subrubrosServicios, setSubrubrosServicios] = useState<any[]>([])
  const [loadingRubros, setLoadingRubros] = useState(false)
  
  const [formData, setFormData] = useState({
    rubro: "",
    subRubro: "",
    rubroProducto: "",
    subRubroProducto: "",
    rubroServicio: "",
    subRubroServicio: "",
    razonSocial: "",
    direccion: "",
    departamento: "",
    municipio: "",
    localidad: "",
    direccionComercial: "",
    codigoPostalComercial: "",
    paginaWeb: "",
    observaciones: "",
    certificadoMiPyme: "",
    exporta: "",
    destinoExportacion: "",
    interesExportar: "",
    materialPromocion: "",
    certificaciones: "",
    cuit: "",
    importa: "",
    geolocalizacion: "",
    nombreFantasia: "",
    tipoSociedad: "",
    codigoPostal: "",
    brochureUrl: "",
    catalogoPdf: null as File | null,
    instagram: "",
    facebook: "",
    linkedin: "",
  })

  // Estados para coordenadas del mapa
  const [mapCenter, setMapCenter] = useState<{ lat: number | null; lng: number | null; zoom: number }>({
    lat: -28.2, // Centro de Provincia de Catamarca por defecto
  lng: -66.0,
  zoom: 8
  })

  const [contactosSecundarios, setContactosSecundarios] = useState<ContactoSecundario[]>([])

  const [productos, setProductos] = useState<Producto[]>([
    { id: "1", nombre: "", posicionArancelaria: "", descripcion: "", capacidadProductiva: "", unidadMedida: "kg" },
  ])

  const [contactoPrincipal, setContactoPrincipal] = useState({
    nombre: "",
    cargo: "",
    telefono: "",
    email: "",
  })

  const [actividadesPromocion, setActividadesPromocion] = useState<ActividadPromocion[]>([])

  const [servicios, setServicios] = useState<ServicioOfrecido[]>([
    { 
      id: "1", 
      tipoServicio: [], 
      descripcion: "", 
      sectores: [], 
      alcanceGeografico: "", 
      paisesDestino: "", 
      exportaServicios: "", 
      interesExportar: "", 
      idiomas: [], 
      formaContratacion: [], 
      certificacionesTecnicas: "", 
      equipoTecnico: "" 
    },
  ])

  const toUpperCase = (value: string) => value.toUpperCase()


useEffect(() => {
  const loadDepartamentos = async () => {
    try {
      setLoadingGeografia(true)
      const data = await api.getDepartamentos()
      const departamentosArray = Array.isArray(data) ? data : (data.results || data)
      setDepartamentos(departamentosArray || [])
    } catch (error) {
      console.error('Error cargando departamentos:', error)
      setDepartamentos([])
      toast({
        title: "Error",
        description: "No se pudieron cargar los departamentos",
        variant: "destructive"
      })
    } finally {
      setLoadingGeografia(false)
    }
  }
  loadDepartamentos()
}, [])

// ============ CARGAR MUNICIPIOS CUANDO SE SELECCIONA DEPARTAMENTO ============
useEffect(() => {
  const loadMunicipios = async () => {
    if (!formData.departamento) {
      setMunicipios([])
      setLocalidades([])
      return
    }
    
    try {
      setLoadingGeografia(true)
      const data = await api.getMunicipiosPorDepartamento(formData.departamento)
      const municipiosArray = Array.isArray(data) ? data : (data.results || data)
      setMunicipios(municipiosArray || [])
      const deptoSeleccionado = departamentos?.find((d: any) => d.id === formData.departamento)
      if (deptoSeleccionado && deptoSeleccionado.centroide_lat && deptoSeleccionado.centroide_lon) {
        setMapCenter({
          lat: parseFloat(deptoSeleccionado.centroide_lat),
          lng: parseFloat(deptoSeleccionado.centroide_lon),
          zoom: 11 // Zoom medio para departamento
        })
      }
      
      // Solo resetear si el municipio actual no pertenece al nuevo departamento
      setFormData(prev => {
        const currentMun = municipiosArray?.find((m: any) => m.id === prev.municipio)
        if (!currentMun) {
          return { ...prev, municipio: "", localidad: "" }
        }
        return prev
      })
      
      // Si no hay municipios, cargar localidades directamente por departamento
      if (!municipiosArray || municipiosArray.length === 0) {
        try {
          const localidadesData = await api.getLocalidadesPorDepartamento(formData.departamento)
          const localidadesArray = Array.isArray(localidadesData) ? localidadesData : (localidadesData.results || localidadesData)
          setLocalidades(localidadesArray || [])
          const localidadSeleccionada = localidadesArray?.find((l: any) => l.id === formData.localidad)
      if (localidadSeleccionada && localidadSeleccionada.centroide_lat && localidadSeleccionada.centroide_lon) {
        setMapCenter({
          lat: parseFloat(localidadSeleccionada.centroide_lat),
          lng: parseFloat(localidadSeleccionada.centroide_lon),
          zoom: 14 // Zoom cercano para localidad
        })
      }
        } catch (error) {
          console.error('Error cargando localidades por departamento:', error)
          setLocalidades([])
        }
      } else {
        setLocalidades([])
      }
      // Resetear selección de municipio si no pertenece al departamento
      setFormData(prev => {
        const currentMun = municipiosArray?.find((m: any) => m.id === prev.municipio)
        if (!currentMun) {
          return { ...prev, municipio: "", localidad: "" }
        }
        return prev
      })
    } catch (error) {
      console.error('Error cargando municipios:', error)
      setMunicipios([])
      setLocalidades([])
    } finally {
      setLoadingGeografia(false)
    }
  }
  loadMunicipios()
}, [formData.departamento])

// ============ CARGAR LOCALIDADES CUANDO SE SELECCIONA MUNICIPIO ============
useEffect(() => {
  const loadLocalidades = async () => {
    if (!formData.municipio) {
      // Si no hay municipio pero hay departamento, las localidades ya fueron cargadas
      return
    }
    try {
      setLoadingGeografia(true)
      const data = await api.getLocalidadesPorMunicipio(formData.municipio)
      const localidadesArray = Array.isArray(data) ? data : (data.results || data)
      setLocalidades(localidadesArray || [])
      
      // Solo resetear si la localidad actual no pertenece al nuevo municipio
      setFormData(prev => {
        const currentLoc = localidadesArray?.find((l: any) => l.id === prev.localidad)
        if (!currentLoc) {
          return { ...prev, localidad: "" }
        }
        return prev
      })
    } catch (error) {
      console.error('Error cargando localidades:', error)
      setLocalidades([])
    } finally {
      setLoadingGeografia(false)
    }
  }
  loadLocalidades()
}, [formData.municipio])

// Centrar mapa cuando se selecciona un municipio
useEffect(() => {
  if (formData.municipio && municipios.length > 0) {
    const municipioSeleccionado = municipios.find((m: any) => m.id === formData.municipio)
    if (municipioSeleccionado && municipioSeleccionado.centroide_lat && municipioSeleccionado.centroide_lon) {
      setMapCenter({
        lat: parseFloat(municipioSeleccionado.centroide_lat),
        lng: parseFloat(municipioSeleccionado.centroide_lon),
        zoom: 12 // Zoom para municipio
      })
    }
  }
}, [formData.municipio, municipios])

useEffect(() => {
  if (formData.localidad && localidades.length > 0) {
    const localidadSeleccionada = localidades.find((l: any) => l.id === formData.localidad)
    if (localidadSeleccionada && localidadSeleccionada.centroide_lat && localidadSeleccionada.centroide_lon) {
      setMapCenter({
        lat: parseFloat(localidadSeleccionada.centroide_lat),
        lng: parseFloat(localidadSeleccionada.centroide_lon),
        zoom: 15 // Zoom cercano para localidad
      })
    }
  }
}, [formData.localidad, localidades])

  // Cargar rubros según el tipo de negocio
  useEffect(() => {
    const loadRubros = async () => {
      try {
        setLoadingRubros(true)
        // Obtener todos los rubros y luego dividir/usar según disponibilidad
        const data = await api.getRubros()
        const allRubros = Array.isArray(data) ? data : (data.results || data)
        const productosList = (allRubros || []).filter((r: any) => r.tipo === 'producto' || r.tipo === 'mixto')
        const serviciosList = (allRubros || []).filter((r: any) => r.tipo === 'servicio' || r.tipo === 'mixto')

        if (tipoNegocio === 'productos') {
          setRubrosProductos(productosList || [])
          setRubrosServicios([])
          setRubros(productosList || [])
        } else if (tipoNegocio === 'servicios') {
          // Si no hay rubros específicamente de servicio, caemos a los de producto
          if (serviciosList.length > 0) {
            setRubrosServicios(serviciosList || [])
            setRubros(productosList.length > 0 ? serviciosList : productosList || [])
          } else {
            setRubrosServicios(productosList || [])
            setRubros(productosList || [])
          }
          setRubrosProductos([])
        } else if (tipoNegocio === 'ambos') {
          setRubrosProductos(productosList || [])
          // Si no hay rubros específicamente de servicio, usar los mismos que productos (incluyendo mixtos)
          if (serviciosList.length > 0) {
            setRubrosServicios(serviciosList || [])
          } else {
            // Si no hay rubros de servicio, mostrar los mismos que productos para que el usuario pueda seleccionar
            setRubrosServicios(productosList || [])
          }
          setRubros([])
        }

        // Limpiar selecciones
        setFormData(prev => ({ 
          ...prev, 
          rubro: "", 
          subRubro: "",
          rubroProducto: "",
          subRubroProducto: "",
          rubroServicio: "",
          subRubroServicio: ""
        }))
        setSubrubros([])
        setSubrubrosProductos([])
        setSubrubrosServicios([])
      } catch (error) {
        console.error('Error cargando rubros:', error)
        setRubros([])
        setRubrosProductos([])
        setRubrosServicios([])
      } finally {
        setLoadingRubros(false)
      }
    }
    loadRubros()
  }, [tipoNegocio])

  // Cargar subrubros cuando se selecciona un rubro (para productos o servicios únicos)
  useEffect(() => {
    const loadSubrubros = async () => {
      if (!formData.rubro || tipoNegocio === 'ambos') {
        setSubrubros([])
        return
      }
      try {
        setLoadingRubros(true)
        const data = await api.getSubRubrosPorRubro(formData.rubro)
        const subrubrosArray = Array.isArray(data) ? data : (data.results || data)
        setSubrubros(subrubrosArray || [])
        setFormData(prev => ({ ...prev, subRubro: "" }))
      } catch (error) {
        console.error('Error cargando subrubros:', error)
        setSubrubros([])
      } finally {
        setLoadingRubros(false)
      }
    }
    loadSubrubros()
  }, [formData.rubro, tipoNegocio])

  // Cargar subrubros de productos (para caso mixto)
  useEffect(() => {
    const loadSubrubrosProductos = async () => {
      if (!formData.rubroProducto || tipoNegocio !== 'ambos') {
        setSubrubrosProductos([])
        return
      }
      try {
        setLoadingRubros(true)
        const data = await api.getSubRubrosPorRubro(formData.rubroProducto)
        const subrubrosArray = Array.isArray(data) ? data : (data.results || data)
        setSubrubrosProductos(subrubrosArray || [])
        setFormData(prev => ({ ...prev, subRubroProducto: "" }))
      } catch (error) {
        console.error('Error cargando subrubros de productos:', error)
        setSubrubrosProductos([])
      } finally {
        setLoadingRubros(false)
      }
    }
    loadSubrubrosProductos()
  }, [formData.rubroProducto, tipoNegocio])

  // Cargar subrubros de servicios (para caso mixto)
  useEffect(() => {
    const loadSubrubrosServicios = async () => {
      if (!formData.rubroServicio || tipoNegocio !== 'ambos') {
        setSubrubrosServicios([])
        return
      }
      try {
        setLoadingRubros(true)
        const data = await api.getSubRubrosPorRubro(formData.rubroServicio)
        const subrubrosArray = Array.isArray(data) ? data : (data.results || data)
        setSubrubrosServicios(subrubrosArray || [])
        setFormData(prev => ({ ...prev, subRubroServicio: "" }))
      } catch (error) {
        console.error('Error cargando subrubros de servicios:', error)
        setSubrubrosServicios([])
      } finally {
        setLoadingRubros(false)
      }
    }
    loadSubrubrosServicios()
  }, [formData.rubroServicio, tipoNegocio])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Mapear tipo de negocio
      const tipoEmpresaMap: Record<string, string> = {
        productos: 'producto',
        servicios: 'servicio',
        ambos: 'mixta'
      }
      
      // Validar campos críticos ANTES de preparar datos
      if (!formData.direccion || formData.direccion.trim() === '') {
        toast({
          title: "Campo requerido",
          description: "Por favor, completa el campo de Dirección",
          variant: "destructive",
        })
        return
      }
      if (!formData.departamento || formData.departamento.trim() === '') {
        toast({
          title: "Campo requerido",
          description: "Por favor, completa el campo de Departamento",
          variant: "destructive",
        })
        return
      }
      
      // Validar rubros según el tipo de empresa
      if (tipoNegocio === 'ambos') {
        // Para empresas mixtas, validar que se hayan seleccionado rubros y subrubros de productos y servicios
        if (!formData.rubroProducto) {
          toast({
            title: "Campo requerido",
            description: "Por favor, selecciona el rubro de productos",
            variant: "destructive",
          })
          return
        }
        if (!formData.subRubroProducto) {
          toast({
            title: "Campo requerido",
            description: "Por favor, selecciona el sub-rubro de productos",
            variant: "destructive",
          })
          return
        }
        if (!formData.rubroServicio) {
          toast({
            title: "Campo requerido",
            description: "Por favor, selecciona el rubro de servicios",
            variant: "destructive",
          })
          return
        }
        if (!formData.subRubroServicio) {
          toast({
            title: "Campo requerido",
            description: "Por favor, selecciona el sub-rubro de servicios",
            variant: "destructive",
          })
          return
        }
      } else {
        // Para empresas de producto o servicio únicos
        if (!formData.rubro) {
          toast({
            title: "Campo requerido",
            description: "Por favor, selecciona el rubro",
            variant: "destructive",
          })
          return
        }
        if (!formData.subRubro) {
          toast({
            title: "Campo requerido",
            description: "Por favor, selecciona el sub-rubro",
            variant: "destructive",
          })
          return
        }
      }
      
      // Preparar FormData para enviar archivos
      const formDataToSend = new FormData()
      
      // Preparar datos para enviar al backend
      const registrationData: any = {
        razon_social: formData.razonSocial,
        nombre_fantasia: formData.nombreFantasia || null,
        tipo_sociedad: formData.tipoSociedad || null,
        cuit_cuil: formData.cuit,
        tipo_empresa: tipoEmpresaMap[tipoNegocio] || 'producto',
        // Para empresas mixtas, enviar campos separados
        ...(tipoNegocio === 'ambos' ? {
          rubro_producto: rubrosProductos.find(r => String(r.id) === formData.rubroProducto)?.nombre || '',
          sub_rubro_producto: subrubrosProductos.find(s => String(s.id) === formData.subRubroProducto)?.nombre || null,
          rubro_servicio: rubrosServicios.find(r => String(r.id) === formData.rubroServicio)?.nombre || '',
          sub_rubro_servicio: subrubrosServicios.find(s => String(s.id) === formData.subRubroServicio)?.nombre || null,
          // Generar rubro_principal y sub_rubro combinando productos y servicios
          rubro_principal: (() => {
            const rubroProd = rubrosProductos.find(r => String(r.id) === formData.rubroProducto)?.nombre || ''
            const rubroServ = rubrosServicios.find(r => String(r.id) === formData.rubroServicio)?.nombre || ''
            return rubroProd ? (rubroServ ? `${rubroProd} / ${rubroServ}` : rubroProd) : rubroServ
          })(),
          sub_rubro: (() => {
            const subProd = subrubrosProductos.find(s => String(s.id) === formData.subRubroProducto)?.nombre || ''
            const subServ = subrubrosServicios.find(s => String(s.id) === formData.subRubroServicio)?.nombre || ''
            return subProd ? (subServ ? `${subProd} / ${subServ}` : subProd) : (subServ || null)
          })(),
        } : {
          rubro_principal: rubros.find(r => String(r.id) === formData.rubro)?.nombre || '',
          sub_rubro: subrubros.find(s => String(s.id) === formData.subRubro)?.nombre || null,
          rubro_producto: null,
          sub_rubro_producto: null,
          rubro_servicio: null,
          sub_rubro_servicio: null,
        }),
        descripcion_actividad: tipoNegocio === 'ambos'
          ? (() => {
              const rubroProd = rubrosProductos.find(r => String(r.id) === formData.rubroProducto)?.nombre || ''
              const subProd = subrubrosProductos.find(s => String(s.id) === formData.subRubroProducto)?.nombre || ''
              const rubroServ = rubrosServicios.find(r => String(r.id) === formData.rubroServicio)?.nombre || ''
              const subServ = subrubrosServicios.find(s => String(s.id) === formData.subRubroServicio)?.nombre || ''
              const prod = rubroProd ? `${rubroProd}${subProd ? ' - ' + subProd : ''}` : ''
              const serv = rubroServ ? `${rubroServ}${subServ ? ' - ' + subServ : ''}` : ''
              return `${prod}${prod && serv ? ' / ' : ''}${serv}`.trim()
            })()
          : (() => {
              const rubro = rubros.find(r => String(r.id) === formData.rubro)?.nombre || ''
              const subrubro = subrubros.find(s => String(s.id) === formData.subRubro)?.nombre || ''
              return rubro ? `${rubro}${subrubro ? ' - ' + subrubro : ''}` : ''
            })(),
        direccion: formData.direccion ? String(formData.direccion).trim() : '',
        codigo_postal: formData.codigoPostal || null,
        direccion_comercial: formData.direccionComercial || null,
        codigo_postal_comercial: formData.codigoPostalComercial || null,
        // Los códigos de geografía se envían como strings directamente
        // El backend los convertirá usando las funciones helper
        departamento: formData.departamento ? String(formData.departamento).trim() : null,
        municipio: formData.municipio ? String(formData.municipio).trim() : null,
        localidad: formData.localidad ? String(formData.localidad).trim() : null,
        geolocalizacion: formData.geolocalizacion || null,
        telefono: contactoPrincipal.telefono,
        correo: contactoPrincipal.email, // Email principal de la empresa (del contacto principal)
        sitioweb: (() => {
          // Validar y limpiar URL del sitio web
          if (formData.paginaWeb && formData.paginaWeb.trim() !== '') {
            const url = formData.paginaWeb.trim()
            // Si no empieza con http:// o https://, agregarlo
            let urlCompleta = url
            if (!url.match(/^https?:\/\//i)) {
              urlCompleta = `https://${url}`
            }
            // Validar formato básico de URL
            try {
              new URL(urlCompleta)
              return urlCompleta
            } catch {
              return null // Si no es una URL válida, enviar null
            }
          }
          return null
        })(),
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        linkedin: formData.linkedin || null,
        contacto_principal: {
          nombre: contactoPrincipal.nombre,
          cargo: contactoPrincipal.cargo,
          telefono: contactoPrincipal.telefono,
          email: contactoPrincipal.email,
        },
        contactos_secundarios: contactosSecundarios.map(c => ({
          nombre: c.nombre,
          cargo: c.cargo,
          telefono: c.telefono,
          email: c.email,
        })),
        productos: tipoNegocio === "servicios" ? [] : productos.map(p => ({
          nombre: p.nombre,
          posicion_arancelaria: p.posicionArancelaria,
          descripcion: p.descripcion,
          capacidad_productiva: p.capacidadProductiva ? parseFloat(p.capacidadProductiva.replace(/,/g, '')) : null,
          unidad_medida: p.unidadMedida || "kg",
        })),
        servicios: tipoNegocio === "productos" ? null : servicios.length > 0 ? servicios.map(s => ({
          nombre: s.descripcion || 'Servicio',
          descripcion: s.descripcion,
          tipo_servicio: s.tipoServicio.join(', '),
          sector_atendido: s.sectores.join(', '),
          alcance_geografico: s.alcanceGeografico,
          paises_destino: s.paisesDestino,
          exporta_servicios: s.exportaServicios,
          interes_exportar: s.interesExportar,
          idiomas: s.idiomas.join(', '),
          forma_contratacion: s.formaContratacion.join(', '),
          certificaciones_tecnicas: s.certificacionesTecnicas,
          equipo_tecnico: s.equipoTecnico,
        })) : null,
        actividades_promocion_internacional: actividadesPromocion.map(a => ({
          tipo: a.tipo,
          lugar: a.lugar,
          anio: a.anio,
          observaciones: a.observaciones || '',
        })),
        exporta: formData.exporta || null,
        destino_exportacion: formData.destinoExportacion || null,
        interes_exportar: formData.exporta === 'no' ? (formData.interesExportar === 'si') : null,
        importa: formData.importa || null,
        tipo_importacion: formData.importa === 'si' ? 'Importación' : null,
        certificado_pyme: formData.certificadoMiPyme || null,
        certificaciones: formData.certificaciones || null,
        brochure_url: formData.brochureUrl || null,
        material_promocional_idiomas: formData.materialPromocion || null,
        idiomas_trabajo: servicios && servicios.length > 0 ? servicios.map(s => s.idiomas.join(', ')).join(', ') || null : null,
        observaciones: formData.observaciones || null,
      }
      
      // Agregar todos los campos al FormData - asegurarse de que se envíen TODOS
      for (const [key, value] of Object.entries(registrationData)) {
        if (value === null || value === undefined) {
          continue
        }
        
        if (typeof value === 'object' && !(value instanceof File) && !Array.isArray(value)) {
          // Para objetos, convertir a JSON string
          formDataToSend.append(key, JSON.stringify(value))
        } else if (Array.isArray(value)) {
          // Para arrays, convertir a JSON string
          formDataToSend.append(key, JSON.stringify(value))
        } else {
          // Para strings, números, etc., enviar directamente
          formDataToSend.append(key, String(value))
        }
      }
      
      // Debug: verificar que direccion y departamento se envían
      console.log("Dirección en registrationData:", registrationData.direccion)
      console.log("Departamento en registrationData:", registrationData.departamento)
      console.log("Dirección en FormData:", formDataToSend.get('direccion'))
      console.log("Departamento en FormData:", formDataToSend.get('departamento'))
      console.log("Todos los keys en FormData:", Array.from(formDataToSend.keys()))
      
      // Agregar archivo PDF si existe
      if (formData.catalogoPdf) {
        formDataToSend.append('catalogo_pdf', formData.catalogoPdf)
      }
      
      // Enviar al backend
      console.log("Enviando datos de registro:", registrationData)
      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api'}/registro/solicitudes/`
      console.log("URL del API:", apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        // No establecer Content-Type, el navegador lo hará automáticamente con el boundary para FormData
        body: formDataToSend,
      })
      
      console.log("Respuesta del servidor:", response.status, response.statusText)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error al procesar la respuesta del servidor' }))
        console.error("Error del servidor:", errorData)
        
        // Mostrar detalles del error si están disponibles
        let errorMessage = 'Error al enviar el registro'
        if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.message) {
          errorMessage = errorData.message
        } else if (typeof errorData === 'object') {
          // Si hay errores de validación por campo
          const fieldErrors = Object.entries(errorData)
            .map(([field, errors]: [string, any]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`
              } else if (typeof errors === 'object') {
                return `${field}: ${JSON.stringify(errors)}`
              }
              return `${field}: ${errors}`
            })
            .join('\n')
          if (fieldErrors) {
            errorMessage = `Errores de validación:\n${fieldErrors}`
          }
        }
        
        throw new Error(errorMessage)
      }
      
      const data = await response.json()
      console.log("Registro exitoso:", data)
      
      toast({
        title: "Registro exitoso",
        description: `Tu cuenta ha sido creada. Email: ${contactoPrincipal.email}. Contraseña inicial: ${formData.cuit}. Puedes iniciar sesión ahora. Te recomendamos cambiar tu contraseña después del primer acceso.`,
        variant: "default",
      })
      
      // Esperar un momento antes de redirigir para que el usuario vea el toast
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (error: any) {
      console.error("Error en registro:", error)
      console.error("Stack trace:", error.stack)
      toast({
        title: "Error al enviar el registro",
        description: error.message || "Por favor, revisa la consola del navegador para más detalles e intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)

  const agregarContacto = () => {
    if (contactosSecundarios.length < 2) {
      setContactosSecundarios([
        ...contactosSecundarios,
        { id: Date.now().toString(), nombre: "", cargo: "", telefono: "", email: "" },
      ])
    }
  }

  const eliminarContacto = (id: string) => {
    setContactosSecundarios(contactosSecundarios.filter((c) => c.id !== id))
  }

  const actualizarContacto = (id: string, field: string, value: string) => {
    setContactosSecundarios(contactosSecundarios.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const agregarProducto = () => {
    setProductos([
      ...productos,
      { id: Date.now().toString(), nombre: "", posicionArancelaria: "", descripcion: "", capacidadProductiva: "", unidadMedida: "kg" },
    ])
  }

  const eliminarProducto = (id: string) => {
    if (productos.length > 1) {
      setProductos(productos.filter((p) => p.id !== id))
    }
  }

  const actualizarProducto = (id: string, field: string, value: string) => {
    setProductos(productos.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  const agregarServicio = () => {
    setServicios([
      ...servicios,
      { 
        id: Date.now().toString(), 
        tipoServicio: [], 
        descripcion: "", 
        sectores: [], 
        alcanceGeografico: "", 
        paisesDestino: "", 
        exportaServicios: "", 
        interesExportar: "", 
        idiomas: [], 
        formaContratacion: [], 
        certificacionesTecnicas: "", 
        equipoTecnico: "" 
      },
    ])
  }

  const eliminarServicio = (id: string) => {
    setServicios(servicios.filter((s) => s.id !== id))
  }

  const actualizarServicio = (id: string, field: string, value: any) => {
    setServicios(servicios.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const actualizarServicioArray = (id: string, field: keyof ServicioOfrecido, value: string, checked: boolean) => {
    setServicios(servicios.map((s) => {
      if (s.id === id) {
        const current = (s[field] as string[]) || []
        if (checked) {
          if (!current.includes(value)) {
            return { ...s, [field]: [...current, value] }
          }
        } else {
          return { ...s, [field]: current.filter((item) => item !== value) }
        }
      }
      return s
    }))
  }

  const agregarActividad = (tipo: "feria" | "mision" | "ronda") => {
    setActividadesPromocion([...actividadesPromocion, { id: Date.now().toString(), tipo, lugar: "", anio: "" }])
  }

  const eliminarActividad = (id: string) => {
    setActividadesPromocion(actividadesPromocion.filter((a) => a.id !== id))
  }

  const actualizarActividad = (id: string, field: string, value: string) => {
    setActividadesPromocion(actividadesPromocion.map((a) => (a.id === id ? { ...a, [field]: value } : a)))
  }


  return (
    <div className="min-h-screen bg-[#F3F4F6]">
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
    <Link href="/">
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:text-white hover:bg-white/10 text-xs md:text-sm"
      >
        <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
        <span className="hidden sm:inline">Volver al Inicio</span>
        <span className="sm:hidden">Volver</span>
      </Button>
    </Link>
  </div>
</header>

      <div className="container mx-auto px-4 py-6 md:py-12 max-w-4xl">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base font-semibold ${
                    step >= s ? "bg-[#3259B5] text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-4 h-4 md:w-6 md:h-6" /> : s}
                </div>
                {s < 4 && <div className={`flex-1 h-1 mx-1 md:mx-2 ${step > s ? "bg-[#3259B5]" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs md:text-sm text-[#6B7280] px-1">
            <span className="text-center flex-1">Información Básica</span>
            <span className="text-center flex-1">Contacto y Ubicación</span>
            <span className="text-center flex-1">Actividad Comercial</span>
            <span className="text-center flex-1">Certificaciones</span>
          </div>
        </div>

        <Card className="p-5 md:p-8 bg-white">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Información Básica */}
            {step === 1 && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">Información Básica</h2>
                  <p className="text-sm md:text-base text-[#6B7280]">Datos generales de tu empresa</p>
                </div>

                <div className="space-y-4 p-4 border border-[#3259B5]/30 rounded-lg bg-[#3259B5]/5">
                  <h3 className="font-semibold text-[#222A59]">Tipo de Negocio *</h3>
                  <p className="text-sm text-[#6B7280] mb-3">Selecciona qué ofrece tu empresa</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { value: "productos", label: "Vende Productos", icon: "📦" },
                      { value: "servicios", label: "Presta Servicios", icon: "🔧" },
                      { value: "ambos", label: "Ambas Opciones", icon: "🏢" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTipoNegocio(option.value as "productos" | "servicios" | "ambos")}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          tipoNegocio === option.value
                            ? "border-[#3259B5] bg-[#3259B5]/10"
                            : "border-[#E5E7EB] bg-white hover:border-[#3259B5]/50"
                        }`}
                      >
                        <div className="text-2xl mb-2">{option.icon}</div>
                        <div className="font-medium text-[#222A59] text-sm">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {tipoNegocio === 'ambos' ? (
                    // Caso mixto: dos secciones separadas
                    <>
                      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <h4 className="font-semibold text-[#222A59] mb-3">📦 Rubros de Productos</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="rubroProducto">Rubro de Productos *</Label>
                            <Select
                              value={formData.rubroProducto}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, rubroProducto: value, subRubroProducto: "" }))}
                              disabled={loadingRubros}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={loadingRubros ? "Cargando..." : "Selecciona el rubro"} />
                              </SelectTrigger>
                              <SelectContent>
                                {rubrosProductos.map((rubro) => (
                                  <SelectItem key={rubro.id} value={String(rubro.id)}>
                                    {rubro.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="subRubroProducto">Sub-Rubro de Productos *</Label>
                            <Select
                              value={formData.subRubroProducto}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, subRubroProducto: value }))}
                              disabled={!formData.rubroProducto || loadingRubros}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={loadingRubros ? "Cargando..." : formData.rubroProducto ? "Selecciona el sub-rubro" : "Primero selecciona un rubro"} />
                              </SelectTrigger>
                              <SelectContent>
                                {subrubrosProductos.map((subrubro) => (
                                  <SelectItem key={subrubro.id} value={String(subrubro.id)}>
                                    {subrubro.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                        <h4 className="font-semibold text-[#222A59] mb-3">🔧 Rubros de Servicios</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="rubroServicio">Rubro de Servicios *</Label>
                            <Select
                              value={formData.rubroServicio}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, rubroServicio: value, subRubroServicio: "" }))}
                              disabled={loadingRubros}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={loadingRubros ? "Cargando..." : "Selecciona el rubro"} />
                              </SelectTrigger>
                              <SelectContent>
                                {rubrosServicios.map((rubro) => (
                                  <SelectItem key={rubro.id} value={String(rubro.id)}>
                                    {rubro.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="subRubroServicio">Sub-Rubro de Servicios *</Label>
                            <Select
                              value={formData.subRubroServicio}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, subRubroServicio: value }))}
                              disabled={!formData.rubroServicio || loadingRubros}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={loadingRubros ? "Cargando..." : formData.rubroServicio ? "Selecciona el sub-rubro" : "Primero selecciona un rubro"} />
                              </SelectTrigger>
                              <SelectContent>
                                {subrubrosServicios.map((subrubro) => (
                                  <SelectItem key={subrubro.id} value={String(subrubro.id)}>
                                    {subrubro.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    // Caso productos o servicios únicos
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="rubro">Rubro *</Label>
                        <Select
                          value={formData.rubro}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, rubro: value, subRubro: "" }))}
                          disabled={loadingRubros}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingRubros ? "Cargando..." : "Selecciona el rubro"} />
                          </SelectTrigger>
                          <SelectContent>
                            {rubros.map((rubro) => (
                              <SelectItem key={rubro.id} value={String(rubro.id)}>
                                {rubro.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="subRubro">Sub-Rubro *</Label>
                        <Select
                          value={formData.subRubro}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, subRubro: value }))}
                          disabled={!formData.rubro || loadingRubros}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingRubros ? "Cargando..." : formData.rubro ? "Selecciona el sub-rubro" : "Primero selecciona un rubro"} />
                          </SelectTrigger>
                          <SelectContent>
                            {subrubros.map((subrubro) => (
                              <SelectItem key={subrubro.id} value={String(subrubro.id)}>
                                {subrubro.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="razonSocial">Razón Social *</Label>
                      <Input
                        id="razonSocial"
                        required
                        value={formData.razonSocial}
                        onChange={(e) => setFormData(prev => ({ ...prev, razonSocial: toUpperCase(e.target.value) }))}
                        placeholder="NOMBRE LEGAL DE LA EMPRESA"
                        className="uppercase"
                      />
                    </div>

                    <div>
                      <Label htmlFor="nombreFantasia">Nombre de Fantasía</Label>
                      <Input
                        id="nombreFantasia"
                        value={formData.nombreFantasia}
                        onChange={(e) => setFormData(prev => ({ ...prev, nombreFantasia: toUpperCase(e.target.value) }))}
                        placeholder="NOMBRE COMERCIAL (OPCIONAL)"
                        className="uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tipoSociedad">Tipo de Sociedad</Label>
                    <Select
                      value={formData.tipoSociedad}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipoSociedad: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de sociedad" />
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
                  </div>

                  <div>
                    <Label htmlFor="cuit">CUIT *</Label>
                    <Input
                      id="cuit"
                      required
                      value={formData.cuit}
                      onChange={(e) => setFormData(prev => ({ ...prev, cuit: e.target.value }))}
                      placeholder="XX-XXXXXXXX-X"
                    />
                  </div>

                  {(tipoNegocio === "productos" || tipoNegocio === "ambos") && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[#222A59]">Productos</h3>
                        <span className="text-xs text-[#6B7280]">
                          {productos.length} producto{productos.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {productos.map((producto, index) => (
                        <div
                          key={producto.id}
                          className="space-y-4 p-4 border border-[#3259B5]/30 rounded-lg bg-[#3259B5]/5"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-[#222A59] text-sm">
                              Producto {index + 1}
                              {index === 0 && <span className="text-red-500 ml-1">*</span>}
                            </h4>
                            {productos.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => eliminarProducto(producto.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div>
                            <Label>Producto {index === 0 && "*"}</Label>
                            <Input
                              required={index === 0}
                              value={producto.nombre}
                              onChange={(e) => actualizarProducto(producto.id, "nombre", toUpperCase(e.target.value))}
                              placeholder="EJ: ACEITE DE OLIVA, VINO, TEXTILES"
                              className="uppercase"
                            />
                            <p className="text-xs text-[#6B7280] mt-1">
                              Ingrese el tipo de producto, no la marca comercial
                            </p>
                          </div>

                          <div>
                            <Label>Descripción del Producto {index === 0 && "*"}</Label>
                            <Textarea
                              required={index === 0}
                              value={producto.descripcion}
                              onChange={(e) =>
                                actualizarProducto(producto.id, "descripcion", toUpperCase(e.target.value))
                              }
                              placeholder="DESCRIBE LAS CARACTERÍSTICAS PRINCIPALES DEL PRODUCTO"
                              rows={3}
                              className="uppercase"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Posición Arancelaria</Label>
                              <Input
                                value={producto.posicionArancelaria}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, "")
                                  if (value.length <= 12) {
                                    actualizarProducto(producto.id, "posicionArancelaria", value)
                                  }
                                }}
                                placeholder="Código NCM (6-12 dígitos)"
                                pattern="[0-9]{6,12}"
                                title="Debe contener entre 6 y 12 dígitos"
                              />
                              <p className="text-xs text-[#6B7280] mt-1">Mínimo 6 dígitos, máximo 12 dígitos</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label>Capacidad Productiva</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={producto.capacidadProductiva}
                                  onChange={(e) =>
                                    actualizarProducto(producto.id, "capacidadProductiva", e.target.value)
                                  }
                                  placeholder="Ej: 10000"
                                />
                              </div>
                              <div>
                                <Label>Unidad de Medida</Label>
                                <Select
                                  value={producto.unidadMedida || "kg"}
                                  onValueChange={(value) =>
                                    actualizarProducto(producto.id, "unidadMedida", value)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione unidad" />
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
                            </div>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={agregarProducto}
                        className="w-full border-dashed border-[#3259B5] text-[#3259B5] hover:bg-[#3259B5]/5 bg-transparent"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Otro Producto
                      </Button>
                    </div>
                  )}

                  {(tipoNegocio === "servicios" || tipoNegocio === "ambos") && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[#222A59]">Servicios</h3>
                        <span className="text-xs text-[#6B7280]">
                          {servicios.length} servicio{servicios.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {servicios.map((servicio, index) => (
                        <div
                          key={servicio.id}
                          className="space-y-4 p-4 border border-[#629BD2]/30 rounded-lg bg-[#629BD2]/5"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-[#222A59] text-sm">
                              Servicio {index + 1}
                              {index === 0 && <span className="text-red-500 ml-1">*</span>}
                            </h4>
                            {servicios.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => eliminarServicio(servicio.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <div>
                            <Label>Tipo de Servicio {index === 0 && "*"}</Label>
                            <div className="space-y-2 mb-3">
                              {[
                                "Consultoría y servicios empresariales",
                                "Tecnologías de la información (IT)",
                                "Diseño y marketing",
                                "Capacitación y educación online",
                                "Servicios culturales y eventos",
                                "Investigación y desarrollo (I+D)",
                                "Turismo receptivo",
                                "Otros",
                              ].map((tipo) => (
                                <div key={tipo} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`${servicio.id}-tipo-${tipo}`}
                                    className="rounded border-[#629BD2] text-[#629BD2] cursor-pointer"
                                    checked={servicio.tipoServicio.includes(tipo)}
                                    onChange={(e) => actualizarServicioArray(servicio.id, 'tipoServicio', tipo, e.target.checked)}
                                  />
                                  <Label htmlFor={`${servicio.id}-tipo-${tipo}`} className="cursor-pointer font-normal text-sm">
                                    {tipo}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Descripción del Servicio {index === 0 && "*"}</Label>
                            <Textarea
                              required={index === 0}
                              value={servicio.descripcion}
                              onChange={(e) => actualizarServicio(servicio.id, "descripcion", toUpperCase(e.target.value))}
                              placeholder="DESCRIBE LOS SERVICIOS QUE OFRECE SU EMPRESA"
                              rows={3}
                              className="uppercase"
                            />
                          </div>

                          <div>
                            <Label>Sectores a los que Presta Servicios {index === 0 && "*"}</Label>
                            <div className="space-y-2 mb-3">
                              {["Minería", "Agroindustria", "Turismo", "Comercio", "Salud", "PyMEs", "Otro"].map(
                                (sector) => (
                                  <div key={sector} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      id={`${servicio.id}-sector-${sector}`}
                                      className="rounded border-[#629BD2] text-[#629BD2] cursor-pointer"
                                      checked={servicio.sectores.includes(sector)}
                                      onChange={(e) => actualizarServicioArray(servicio.id, 'sectores', sector, e.target.checked)}
                                    />
                                    <Label htmlFor={`${servicio.id}-sector-${sector}`} className="cursor-pointer font-normal text-sm">
                                      {sector}
                                    </Label>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          <div>
                            <Label>Alcance Geográfico {index === 0 && "*"}</Label>
                            <Select
                              value={servicio.alcanceGeografico}
                              onValueChange={(value) => actualizarServicio(servicio.id, "alcanceGeografico", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona el alcance" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="local">Local</SelectItem>
                                <SelectItem value="nacional">Nacional</SelectItem>
                                <SelectItem value="internacional">Internacional</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {servicio.alcanceGeografico === "internacional" && (
                            <div>
                              <Label>Países con los que Trabaja</Label>
                              <Textarea
                                value={servicio.paisesDestino}
                                onChange={(e) => actualizarServicio(servicio.id, "paisesDestino", toUpperCase(e.target.value))}
                                placeholder="PAÍSES CON LOS QUE TRABAJA (SEPARADOS POR COMAS)"
                                rows={2}
                                className="uppercase"
                              />
                            </div>
                          )}

                          <div>
                            <Label>¿Exporta Servicios? {index === 0 && "*"}</Label>
                            <Select
                              value={servicio.exportaServicios}
                              onValueChange={(value) => actualizarServicio(servicio.id, "exportaServicios", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una opción" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="si">Sí</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Interés en Exportar Servicios {index === 0 && "*"}</Label>
                            <Select
                              value={servicio.interesExportar}
                              onValueChange={(value) => actualizarServicio(servicio.id, "interesExportar", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una opción" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="si">Sí</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Idiomas con los que Trabaja {index === 0 && "*"}</Label>
                            <div className="space-y-2 mb-3">
                              {["Español", "Inglés", "Portugués", "Otro"].map((idioma) => (
                                <div key={idioma} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`${servicio.id}-idioma-${idioma}`}
                                    className="rounded border-[#629BD2] text-[#629BD2] cursor-pointer"
                                    checked={servicio.idiomas.includes(idioma)}
                                    onChange={(e) => actualizarServicioArray(servicio.id, 'idiomas', idioma, e.target.checked)}
                                  />
                                  <Label htmlFor={`${servicio.id}-idioma-${idioma}`} className="cursor-pointer font-normal text-sm">
                                    {idioma}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Forma de Contratación {index === 0 && "*"}</Label>
                            <div className="space-y-2 mb-3">
                              {["Por hora", "Proyecto", "Mensual", "Otro"].map((forma) => (
                                <div key={forma} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id={`${servicio.id}-forma-${forma}`}
                                    className="rounded border-[#629BD2] text-[#629BD2] cursor-pointer"
                                    checked={servicio.formaContratacion.includes(forma)}
                                    onChange={(e) => actualizarServicioArray(servicio.id, 'formaContratacion', forma, e.target.checked)}
                                  />
                                  <Label htmlFor={`${servicio.id}-forma-${forma}`} className="cursor-pointer font-normal text-sm">
                                    {forma}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label>Certificaciones Técnicas</Label>
                            <p className="text-xs text-[#6B7280] mb-3">
                              ISO 9001, ISO 14001, SCRUM, AWS, u otras certificaciones específicas
                            </p>
                            <Textarea
                              value={servicio.certificacionesTecnicas}
                              onChange={(e) => actualizarServicio(servicio.id, "certificacionesTecnicas", toUpperCase(e.target.value))}
                              placeholder="AGREGUE LAS CERTIFICACIONES TÉCNICAS"
                              rows={3}
                              className="uppercase"
                            />
                          </div>

                          <div>
                            <Label>¿Tiene Equipo Técnico Especializado? {index === 0 && "*"}</Label>
                            <Select
                              value={servicio.equipoTecnico}
                              onValueChange={(value) => actualizarServicio(servicio.id, "equipoTecnico", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una opción" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="si">Sí</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                                <SelectItem value="en-formacion">En formación</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={agregarServicio}
                        className="w-full border-dashed border-[#629BD2] text-[#629BD2] hover:bg-[#629BD2]/5 bg-transparent"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Otro Servicio
                      </Button>
                    </div>
                  )}

                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-[#3259B5] hover:bg-[#3259B5]/90 text-white text-sm md:text-base"
                  >
                    Siguiente
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">Contacto y Ubicación</h2>
                  <p className="text-sm md:text-base text-[#6B7280]">
                    Información de contacto y ubicación de tu empresa
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4 p-4 border border-[#629BD2]/30 rounded-lg bg-[#629BD2]/5">
                    <h3 className="font-semibold text-[#222A59] flex items-center gap-2">Contacto Principal</h3>
                    <div>
                      <Label htmlFor="contacto">Persona de Contacto *</Label>
                      <Input
                        id="contacto"
                        required
                        value={contactoPrincipal.nombre}
                        onChange={(e) =>
                          setContactoPrincipal({ ...contactoPrincipal, nombre: toUpperCase(e.target.value) })
                        }
                        placeholder=" NOMBRE COMPLETO"
                        className="uppercase"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cargo">Cargo *</Label>
                      <Input
                        id="cargo"
                        required
                        value={contactoPrincipal.cargo}
                        onChange={(e) =>
                          setContactoPrincipal({ ...contactoPrincipal, cargo: toUpperCase(e.target.value) })
                        }
                        placeholder="EJ: GERENTE GENERAL, DIRECTOR, PROPIETARIO"
                        className="uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="telefono">Teléfono *</Label>
                        <Input
                          id="telefono"
                          required
                          type="tel"
                          value={contactoPrincipal.telefono}
                          onChange={(e) => setContactoPrincipal({ ...contactoPrincipal, telefono: e.target.value })}
                          placeholder="(0383) 4XXXXXX"
                        />
                      </div>

                      <div>
                        <Label htmlFor="mail">Correo Electrónico *</Label>
                        <Input
                          id="mail"
                          required
                          type="email"
                          value={contactoPrincipal.email}
                          onChange={(e) => setContactoPrincipal({ ...contactoPrincipal, email: e.target.value })}
                          placeholder="contacto@empresa.com"
                        />
                      </div>
                    </div>
                  </div>

                  {contactosSecundarios.map((contacto, index) => (
                    <div
                      key={contacto.id}
                      className="space-y-4 p-4 border border-[#66A29C]/30 rounded-lg bg-[#66A29C]/5"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-[#222A59]">
                          Contacto {index === 0 ? "Secundario" : "Terciario"}
                        </h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarContacto(contacto.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div>
                        <Label>Persona de Contacto</Label>
                        <Input
                          value={contacto.nombre}
                          onChange={(e) => actualizarContacto(contacto.id, "nombre", toUpperCase(e.target.value))}
                          placeholder=" NOMBRE COMPLETO"
                          className="uppercase"
                        />
                      </div>

                      <div>
                        <Label>Cargo</Label>
                        <Input
                          value={contacto.cargo}
                          onChange={(e) => actualizarContacto(contacto.id, "cargo", toUpperCase(e.target.value))}
                          placeholder="EJ: SUBJEFE, ENCARGADO DE VENTAS"
                          className="uppercase"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Teléfono</Label>
                          <Input
                            type="tel"
                            value={contacto.telefono}
                            onChange={(e) => actualizarContacto(contacto.id, "telefono", e.target.value)}
                            placeholder="(0383) 4XXXXXX"
                          />
                        </div>

                        <div>
                          <Label>Correo Electrónico</Label>
                          <Input
                            type="email"
                            value={contacto.email}
                            onChange={(e) => actualizarContacto(contacto.id, "email", e.target.value)}
                            placeholder="contacto@empresa.com"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {contactosSecundarios.length < 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={agregarContacto}
                      className="w-full border-dashed border-[#3259B5] text-[#3259B5] hover:bg-[#3259B5]/5 bg-transparent"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Contacto {contactosSecundarios.length === 0 ? "Secundario" : "Terciario"}
                    </Button>
                  )}

                  <div className="space-y-4 pt-4 border-t">
        <h3 className="font-semibold text-[#222A59]">Domicilio Comercial</h3>
        <p className="text-xs text-[#6B7280]">
          Dirección de facturación o domicilio legal de la empresa
        </p>

        <div>
          <Label htmlFor="direccionComercial">Dirección</Label>
          <Input
            id="direccionComercial"
            value={formData.direccionComercial}
            onChange={(e) => setFormData(prev => ({ ...prev, direccionComercial: toUpperCase(e.target.value) }))}
            placeholder="CALLE, NÚMERO"
            className="uppercase"
          />
        </div>

        <div>
          <Label htmlFor="codigoPostalComercial">Código Postal</Label>
          <Input
            id="codigoPostalComercial"
            value={formData.codigoPostalComercial}
            onChange={(e) => setFormData(prev => ({ ...prev, codigoPostalComercial: e.target.value }))}
            placeholder="EJ: 4700"
          />
        </div>
      </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="font-semibold text-[#222A59]">Domicilio del Establecimiento Productivo</h3>

                    <div>
                      <Label htmlFor="direccion">Dirección *</Label>
                      <Input
                        id="direccion"
                        required
                        value={formData.direccion}
                        onChange={(e) => setFormData(prev => ({ ...prev, direccion: toUpperCase(e.target.value) }))}
                        placeholder="CALLE, NÚMERO"
                        className="uppercase"
                      />
                    </div>

                    <div>
                      <Label htmlFor="codigoPostal">Código Postal</Label>
                      <Input
                        id="codigoPostal"
                        value={formData.codigoPostal}
                        onChange={(e) => setFormData(prev => ({ ...prev, codigoPostal: e.target.value }))}
                        placeholder="EJ: 4700"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="departamento">Departamento *</Label>
                        <Select
                          value={formData.departamento}
                          onValueChange={(value) =>
                            setFormData(prev => ({ ...prev, departamento: value, municipio: "", localidad: "" }))
                          }
                          disabled={loadingGeografia}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={loadingGeografia ? "Cargando..." : "Selecciona el departamento"} />
                          </SelectTrigger>
                          <SelectContent>
                            {departamentos.map((departamento) => (
                              <SelectItem key={departamento.id} value={departamento.id}>
                                {departamento.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="municipio">Municipio {municipios.length > 0 ? '*' : '*'}</Label>
                        <Select
                          value={formData.municipio}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, municipio: value, localidad: "" }))}
                          disabled={!formData.departamento || loadingGeografia}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loadingGeografia 
                                ? "Cargando..." 
                                : !formData.departamento 
                                  ? "Primero selecciona departamento"
                                  : municipios.length === 0
                                    ? "No hay municipios disponibles"
                                    : "Selecciona"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {municipios.length > 0 ? (
                              municipios.map((municipio) => (
                                <SelectItem key={municipio.id} value={municipio.id}>
                                  {municipio.nombre}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No hay municipios disponibles
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="localidad">Localidad *</Label>
                        <Select
                          value={formData.localidad}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, localidad: value }))}
                          disabled={(!formData.departamento && !formData.municipio) || loadingGeografia || localidades.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loadingGeografia 
                                ? "Cargando..." 
                                : localidades.length === 0 
                                  ? (formData.municipio ? "No hay localidades disponibles" : formData.departamento ? "Cargando localidades..." : "Primero selecciona departamento")
                                  : "Selecciona"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {localidades.map((localidad) => (
                              <SelectItem key={localidad.id} value={localidad.id}>
                                {localidad.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="paginaWeb">Página Web</Label>
                      <Input
                        id="paginaWeb"
                        type="url"
                        value={formData.paginaWeb}
                        onChange={(e) => setFormData(prev => ({ ...prev, paginaWeb: e.target.value }))}
                        placeholder="https://www.tuempresa.com"
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-[#222A59] text-sm">Redes Sociales</h4>
                      <div>
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={formData.instagram}
                          onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                          placeholder="@tuempresa"
                        />
                      </div>
                      <div>
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={formData.facebook}
                          onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                          placeholder="tuempresa"
                        />
                      </div>
                      <div>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={formData.linkedin}
                          onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                          placeholder="empresa/tuempresa"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                      <Label htmlFor="geolocalizacion">Geolocalización *</Label>
                      <p className="text-xs text-[#6B7280] mb-3">
                        Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación de tu empresa
                      </p>
                      <LocationPicker
  value={formData.geolocalizacion}
  onChange={(coords) => setFormData(prev => ({ ...prev, geolocalizacion: coords }))}
  centerLat={mapCenter.lat}
  centerLng={mapCenter.lng}
  zoomLevel={mapCenter.zoom}
/>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    className="border-[#3259B5] text-[#3259B5] bg-transparent text-sm md:text-base"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-[#3259B5] hover:bg-[#3259B5]/90 text-white text-sm md:text-base"
                  >
                    Siguiente
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">Actividad Comercial</h2>
                  <p className="text-sm md:text-base text-[#6B7280]">Información sobre exportaciones e importaciones</p>
                </div>

                <div className="space-y-4">
                  <div>
  <Label htmlFor="exporta">¿Exporta actualmente? *</Label>
  <Select
    value={formData.exporta}
    onValueChange={(value) => setFormData(prev => ({ ...prev, exporta: value }))}
  >
    <SelectTrigger>
      <SelectValue placeholder="Selecciona una opción" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="si">Sí</SelectItem>
      <SelectItem value="no">No</SelectItem>
      <SelectItem value="en-proceso">En proceso</SelectItem>
    </SelectContent>
  </Select>
</div>

{formData.exporta === "si" && (
  <div>
    <Label htmlFor="destinoExportacion">Destino de Exportación</Label>
    <Textarea
      id="destinoExportacion"
      value={formData.destinoExportacion}
      onChange={(e) => setFormData(prev => ({ ...prev, destinoExportacion: toUpperCase(e.target.value) }))}
      placeholder="PAÍSES A LOS QUE EXPORTA (SEPARADOS POR COMAS)"
      rows={3}
      className="uppercase"
    />
  </div>
)}

{formData.exporta === "no" && (
  <div>
    <Label htmlFor="interesExportar">¿Tiene interés en exportar?</Label>
    <Select
      value={formData.interesExportar}
      onValueChange={(value) => setFormData(prev => ({ ...prev, interesExportar: value }))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Selecciona una opción" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="si">Sí</SelectItem>
        <SelectItem value="no">No</SelectItem>
      </SelectContent>
    </Select>
  </div>
)}

                  <div>
                    <Label htmlFor="importa">¿Importa actualmente? *</Label>
                    <Select
                      value={formData.importa}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, importa: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="materialPromocion">¿Cuenta con material de promoción en 2 idiomas?</Label>
                    <Select
                      value={formData.materialPromocion}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, materialPromocion: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="en-desarrollo">En desarrollo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <h3 className="font-semibold text-[#222A59] mb-2">
                        Actividades de Promoción Internacional a las que Asistió
                      </h3>
                      <p className="text-xs text-[#6B7280] mb-3">
                        Agregue las ferias, misiones comerciales y rondas de negocios en las que participó
                      </p>
                    </div>

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

                  <div>
                    <Label htmlFor="observaciones">Observaciones Generales</Label>
                    <Textarea
                      id="observaciones"
                      value={formData.observaciones}
                      onChange={(e) => setFormData(prev => ({ ...prev, observaciones: toUpperCase(e.target.value) }))}
                      placeholder="INFORMACIÓN ADICIONAL RELEVANTE"
                      rows={4}
                      className="uppercase"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    className="border-[#3259B5] text-[#3259B5] bg-transparent text-sm md:text-base"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Anterior
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-[#3259B5] hover:bg-[#3259B5]/90 text-white text-sm md:text-base"
                  >
                    Siguiente
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 md:space-y-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">Certificaciones y Complementos</h2>
                  <p className="text-sm md:text-base text-[#6B7280]">Certificaciones y acreditaciones de tu empresa</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="certificadoMiPyme">Certificado MiPyME</Label>
                    <Select
                      value={formData.certificadoMiPyme}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, certificadoMiPyme: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="¿Cuenta con certificado MiPyME?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí, vigente</SelectItem>
                        <SelectItem value="vencido">Sí, vencido</SelectItem>
                        <SelectItem value="en-tramite">En trámite</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Certificaciones</Label>
                    <p className="text-xs text-[#6B7280] mb-3">
                      Incluye certificaciones de calidad, ambientales, de seguridad alimentaria, etc.
                    </p>

                    {/* Predefined certifications checkboxes */}
                    <div className="space-y-2 mb-4">
                      {[
                        { id: "bpa", label: "BPA (Buenas Prácticas Agrícolas)" },
                        { id: "gmp", label: "GMP (Buenas Prácticas de Manufactura)" },
                        { id: "halal", label: "Halal" },
                        { id: "haccp", label: "HACCP (Análisis de Peligros)" },
                        { id: "iso", label: "ISO (Organización Internacional)" },
                        { id: "kosher", label: "Kosher" },
                        { id: "organica", label: "Orgánica" },
                      ].map((cert) => (
                        <div key={cert.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={cert.id}
                            className="rounded border-[#3259B5] text-[#3259B5] cursor-pointer"
                            onChange={(e) => {
                              const current = formData.certificaciones.split(",").map((c) => c.trim())
                              if (e.target.checked) {
                                if (!current.includes(cert.label)) {
                                  current.push(cert.label)
                                }
                              } else {
                                const index = current.indexOf(cert.label)
                                if (index > -1) {
                                  current.splice(index, 1)
                                }
                              }
                              setFormData(prev => ({ ...prev, certificaciones: current.join(", ") }))
                            }}
                          />
                          <Label htmlFor={cert.id} className="cursor-pointer font-normal">
                            {cert.label}
                          </Label>
                        </div>
                      ))}
                    </div>

                    <Textarea
                      id="certificaciones"
                      value={formData.certificaciones}
                      onChange={(e) => setFormData(prev => ({ ...prev, certificaciones: toUpperCase(e.target.value) }))}
                      placeholder="AGREGE OTRAS CERTIFICACIONES ADICIONALES"
                      rows={4}
                      className="uppercase"
                    />
                  </div>

                  <div>
                    <Label htmlFor="brochure">Brochur / Catálogo (PDF)</Label>
                    <div className="border-2 border-dashed border-[#3259B5] rounded-lg p-6 text-center hover:bg-[#3259B5]/5 transition-colors cursor-pointer">
                      <input
                        id="brochure"
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            const file = e.target.files[0]
                            setFormData(prev => ({ ...prev, catalogoPdf: file, brochureUrl: file.name }))
                          }
                        }}
                        className="hidden"
                      />
                      <label htmlFor="brochure" className="cursor-pointer block">
                        <div className="text-3xl mb-2">📄</div>
                        <p className="font-medium text-[#222A59] mb-1">
                          {formData.brochureUrl
                            ? "Archivo seleccionado: " + formData.brochureUrl
                            : "Haz clic para cargar PDF"}
                        </p>
                        <p className="text-xs text-[#6B7280]">Máximo 10 MB</p>
                      </label>
                    </div>
                  </div>


                  <div className="bg-[#629BD2]/10 border border-[#629BD2]/20 rounded-lg p-4">
                    <h4 className="font-semibold text-[#222A59] mb-2">Información importante</h4>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      Una vez enviado el formulario, nuestro equipo revisará la información y se pondrá en contacto
                      contigo para completar el proceso de registro y realizar la evaluación de tu perfil exportador.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="outline"
                    className="border-[#3259B5] text-[#3259B5] bg-transparent text-sm md:text-base"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Anterior
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#C3C840] hover:bg-[#C3C840]/90 text-[#222A59] font-semibold text-sm md:text-base"
                  >
                    <CheckCircle2 className="mr-2 w-4 h-4" />
                    Enviar Registro
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  )
}
