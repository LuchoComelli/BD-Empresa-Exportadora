"use client"

import { useAuth } from "@/lib/auth-context"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
} from "lucide-react"
import { CompanyMap } from "@/components/map/company-map"
import { LocationPicker } from "@/components/map/location-picker"

export default function PerfilEmpresaPage() {
  const { user, logout } = useAuth()
  const [empresaData, setEmpresaData] = useState<any>(null)
  const [solicitudId, setSolicitudId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Recargar datos del usuario al montar el componente
  useEffect(() => {
    const loadEmpresaData = async () => {
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
          setEmpresaData(userData.empresa)
          
          // Obtener el ID de la solicitud para poder actualizarla
          try {
            const perfilCompleto = await api.getMiPerfil()
            console.log('[Perfil] Perfil completo:', perfilCompleto)
            if (perfilCompleto && perfilCompleto.id) {
              setSolicitudId(perfilCompleto.id)
            }
          } catch (error) {
            console.error('[Perfil] Error al obtener ID de solicitud:', error)
          }
        } else {
          console.warn('[Perfil] No se encontraron datos de empresa en la respuesta')
          setEmpresaData(null)
        }
      } catch (error) {
        console.error('[Perfil] Error al cargar datos:', error)
        console.error('[Perfil] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
        setEmpresaData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadEmpresaData()
  }, [])

  // Si está cargando, mostrar mensaje
  if (isLoading) {
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
        if (empresaData?.geolocalizacion) {
          console.log('[Perfil] Geolocalización lat:', empresaData.geolocalizacion.lat, 'tipo:', typeof empresaData.geolocalizacion.lat)
          console.log('[Perfil] Geolocalización lng:', empresaData.geolocalizacion.lng, 'tipo:', typeof empresaData.geolocalizacion.lng)
        }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB]">
      {/* Header */}
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
            <div className="flex gap-2">
              {!isEditing ? (
                <Button
                  onClick={() => {
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
                        alert('No se pudo obtener el ID de la solicitud. Por favor, recarga la página.')
                        return
                      }
                      
                      try {
                        setIsSaving(true)
                        console.log('[Perfil] Guardando cambios:', editedData)
                        
                        // Preparar datos para enviar al backend
                        const updateData: any = {
                          nombre_fantasia: editedData.nombreFantasia || null,
                          tipo_sociedad: editedData.tipoSociedad || null,
                          direccion: editedData.direccion || '',
                          codigo_postal: editedData.codigoPostal || null,
                          provincia: editedData.provincia || null,
                          departamento: editedData.departamento || '',
                          municipio: editedData.municipio || null,
                          localidad: editedData.localidad || null,
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
                          sitioweb: editedData.paginaWeb && editedData.paginaWeb.trim() !== '' ? editedData.paginaWeb.trim() : null,
                          rubro_principal: editedData.rubro || '',
                          sub_rubro: editedData.subRubro || null,
                          descripcion_actividad: editedData.descripcionActividad || null,
                          instagram: editedData.instagram || null,
                          facebook: editedData.facebook || null,
                          linkedin: editedData.linkedin || null,
                          exporta: editedData.exporta ? (typeof editedData.exporta === 'string' ? editedData.exporta : 'si') : 'no',
                          destino_exportacion: editedData.destinosExportacion ? 
                            Array.isArray(editedData.destinosExportacion) ? 
                              editedData.destinosExportacion.join(', ') : 
                              (typeof editedData.destinosExportacion === 'string' ? editedData.destinosExportacion : String(editedData.destinosExportacion)) : null,
                          importa: editedData.importa ? (typeof editedData.importa === 'string' ? editedData.importa : 'si') : 'no',
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
                        
                        console.log('[Perfil] Contacto principal preparado:', {
                          nombre: updateData.nombre_contacto,
                          cargo: updateData.cargo_contacto,
                          telefono: updateData.telefono_contacto,
                          'telefono_length': updateData.telefono_contacto.length,
                          'telefono_type': typeof updateData.telefono_contacto,
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
                        updateData.productos = (editedData.productos || []).map((producto: any) => ({
                          nombre: producto.nombre || '',
                          descripcion: producto.descripcion || '',
                          posicion_arancelaria: producto.posicionArancelaria || '',
                          capacidad_productiva: producto.capacidadProductiva || '',
                        }))
                        
                        // Preparar actividades de promoción
                        updateData.actividades_promocion = editedData.feriasAsistidas || []
                        
                        console.log('[Perfil] Datos a enviar:', JSON.stringify(updateData, null, 2))
                        console.log('[Perfil] Verificando teléfono antes de enviar:', {
                          'telefono_contacto': updateData.telefono_contacto,
                          'tipo': typeof updateData.telefono_contacto,
                          'longitud': updateData.telefono_contacto?.length,
                          'contacto_principal.telefono': updateData.contacto_principal?.telefono,
                          'contacto_principal': updateData.contacto_principal
                        })
                        
                        // Enviar actualización
                        const updated = await api.updatePerfil(solicitudId, updateData)
                        console.log('[Perfil] Actualización exitosa:', updated)
                        
                        // Recargar datos
                        const userData = await api.getCurrentUser()
                        if (userData.empresa) {
                          setEmpresaData(userData.empresa)
                        }
                        
                        setIsEditing(false)
                        setEditedData(null)
                        alert('Perfil actualizado exitosamente')
                      } catch (error: any) {
                        console.error('[Perfil] Error al guardar:', error)
                        console.error('[Perfil] Error completo:', JSON.stringify(error, null, 2))
                        
                        // Mostrar error detallado
                        let errorMessage = error.message || 'Error desconocido'
                        if (error.message && error.message.includes('\n')) {
                          // Si hay múltiples errores, mostrarlos todos
                          errorMessage = error.message.split('\n').join('\n')
                        }
                        
                        alert(`Error al guardar:\n\n${errorMessage}`)
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
              <div className="flex flex-wrap gap-2">
                {empresaData.rubro && (
                  <Badge className="bg-[#C3C840] text-[#222A59] hover:bg-[#C3C840]/90">
                    {empresaData.rubro}
                    {empresaData.subRubro && ` - ${empresaData.subRubro}`}
                  </Badge>
                )}
                {empresaData.exporta && <Badge className="bg-white/20 text-white hover:bg-white/30">Exportadora</Badge>}
                {empresaData.certificadoMiPyme && (
                  <Badge className="bg-white/20 text-white hover:bg-white/30">Mi Pyme</Badge>
                )}
                {empresaData.estado && (
                  <Badge className={`${empresaData.estado === 'aprobada' ? 'bg-green-500' : 'bg-yellow-500'} text-white`}>
                    {empresaData.estado.charAt(0).toUpperCase() + empresaData.estado.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Main Info */}
          <div className="space-y-6">
            {/* Products */}
            {((empresaData.productos && empresaData.productos.length > 0) || isEditing) && (
              <Card className="p-6 shadow-lg border-2 border-[#3259B5]/10 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#3259B5] to-[#629BD2] rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-[#222A59]">Productos</h3>
                  </div>
                  {isEditing && (
                    <Button
                      type="button"
                      onClick={() => {
                        const newProductos = [...(editedData?.productos || []), { 
                          nombre: '', 
                          descripcion: '', 
                          posicionArancelaria: '', 
                          capacidadProductiva: '' 
                        }]
                        setEditedData({ ...editedData, productos: newProductos })
                      }}
                      size="sm"
                      className="bg-[#3259B5] hover:bg-[#3259B5]/90 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  {(isEditing ? editedData?.productos : empresaData.productos)?.map((producto: any, index: number) => (
                    <div key={index} className="bg-gradient-to-r from-[#F9FAFB] to-[#FFFFFF] border-l-4 border-[#3259B5] pl-4 py-4 rounded-r-lg hover:shadow-md transition-shadow duration-200">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-[#6B7280]">Nombre del Producto</Label>
                            <Input
                              value={producto.nombre || ''}
                              onChange={(e) => {
                                const newProductos = [...(editedData?.productos || [])]
                                newProductos[index] = { ...newProductos[index], nombre: e.target.value }
                                setEditedData({ ...editedData, productos: newProductos })
                              }}
                              className="mt-1"
                              placeholder="Nombre del producto"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[#6B7280]">Descripción</Label>
                            <Textarea
                              value={producto.descripcion || ''}
                              onChange={(e) => {
                                const newProductos = [...(editedData?.productos || [])]
                                newProductos[index] = { ...newProductos[index], descripcion: e.target.value }
                                setEditedData({ ...editedData, productos: newProductos })
                              }}
                              className="mt-1"
                              placeholder="Descripción del producto"
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-[#6B7280]">Posición Arancelaria</Label>
                              <Input
                                value={producto.posicionArancelaria || ''}
                                onChange={(e) => {
                                  const newProductos = [...(editedData?.productos || [])]
                                  newProductos[index] = { ...newProductos[index], posicionArancelaria: e.target.value }
                                  setEditedData({ ...editedData, productos: newProductos })
                                }}
                                className="mt-1"
                                placeholder="Código arancelario"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#6B7280]">Capacidad Productiva</Label>
                              <Input
                                value={producto.capacidadProductiva || ''}
                                onChange={(e) => {
                                  const newProductos = [...(editedData?.productos || [])]
                                  newProductos[index] = { ...newProductos[index], capacidadProductiva: e.target.value }
                                  setEditedData({ ...editedData, productos: newProductos })
                                }}
                                className="mt-1"
                                placeholder="Capacidad"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            onClick={() => {
                              const newProductos = editedData?.productos?.filter((_: any, i: number) => i !== index) || []
                              setEditedData({ ...editedData, productos: newProductos })
                            }}
                            size="sm"
                            variant="destructive"
                            className="w-full"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Eliminar Producto
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-bold text-[#222A59] mb-2 text-base">{producto.nombre || 'Sin nombre'}</h4>
                          {producto.descripcion && (
                            <p className="text-sm text-[#6B7280] mb-3 leading-relaxed">{producto.descripcion}</p>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            {producto.posicionArancelaria && (
                              <div className="bg-white px-3 py-2 rounded-lg border border-[#E5E7EB]">
                                <span className="text-[#6B7280] text-xs font-medium">Posición Arancelaria:</span>
                                <span className="ml-2 font-semibold text-[#222A59]">{producto.posicionArancelaria}</span>
                              </div>
                            )}
                            {producto.capacidadProductiva && (
                              <div className="bg-white px-3 py-2 rounded-lg border border-[#E5E7EB]">
                                <span className="text-[#6B7280] text-xs font-medium">Capacidad:</span>
                                <span className="ml-2 font-semibold text-[#222A59]">{producto.capacidadProductiva}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {(!empresaData.productos || empresaData.productos.length === 0) && !isEditing && (
                    <p className="text-sm text-[#6B7280] text-center py-4">No hay productos registrados</p>
                  )}
                </div>
              </Card>
            )}

            {/* Certifications */}
            {((empresaData.certificaciones && empresaData.certificaciones.length > 0) || isEditing) && (
              <Card className="p-6 shadow-lg border-2 border-[#3259B5]/10 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#3259B5] to-[#629BD2] rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-[#222A59]">Certificaciones</h3>
                  </div>
                </div>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {(editedData?.certificaciones || []).map((cert: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={cert}
                            onChange={(e) => {
                              const newCerts = [...(editedData?.certificaciones || [])]
                              newCerts[index] = e.target.value
                              setEditedData({ ...editedData, certificaciones: newCerts })
                            }}
                            className="flex-1"
                            placeholder="Ej: ISO 9001, ISO 14001, etc."
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              const newCerts = editedData?.certificaciones?.filter((_: any, i: number) => i !== index) || []
                              setEditedData({ ...editedData, certificaciones: newCerts })
                            }}
                            size="sm"
                            variant="destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        const newCerts = [...(editedData?.certificaciones || []), '']
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
                  <div className="flex flex-wrap gap-2">
                    {empresaData.certificaciones.map((cert: string, index: number) => (
                      <Badge key={index} className="bg-[#C3C840] text-[#222A59] hover:bg-[#C3C840]/90">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right Column - Contact & Location */}
          <div className="space-y-6">
            {/* Export Information */}
            {empresaData.exporta && (
              <Card className="p-6 shadow-lg border-2 border-[#3259B5]/10 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3259B5] to-[#629BD2] rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[#222A59]">Información de Exportación</h3>
                </div>
                <div className="space-y-4">
                  {empresaData.destinosExportacion && empresaData.destinosExportacion.length > 0 && (
                    <div>
                      <p className="text-sm text-[#6B7280] mb-2">Destinos de Exportación:</p>
                      <div className="flex flex-wrap gap-2">
                        {empresaData.destinosExportacion.map((destino: string, index: number) => (
                          <Badge key={index} variant="outline" className="border-[#3259B5] text-[#3259B5]">
                            {destino}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {empresaData.feriasAsistidas && empresaData.feriasAsistidas.length > 0 && (
                    <div>
                      <p className="text-sm text-[#6B7280] mb-2">Ferias y Actividades de Promoción:</p>
                      <ul className="list-disc list-inside text-sm text-[#222A59] space-y-1">
                        {empresaData.feriasAsistidas.map((actividad: any, index: number) => (
                          <li key={index}>
                            {actividad.tipo && `${actividad.tipo} - `}
                            {actividad.lugar && `${actividad.lugar}`}
                            {actividad.anio && ` (${actividad.anio})`}
                            {actividad.observaciones && ` - ${actividad.observaciones}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-[#3259B5]" />
                    <span className="text-[#6B7280]">Material de promoción en 2 idiomas:</span>
                    <span className="font-medium text-[#222A59]">
                      {empresaData.materialPromocion2Idiomas ? "Sí" : "No"}
                    </span>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Contacts */}
            {((empresaData.contactos && empresaData.contactos.length > 0) || isEditing) && (
              <Card className="p-6 shadow-lg border-2 border-[#3259B5]/10 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#3259B5] to-[#629BD2] rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-[#222A59]">Contactos</h3>
                  </div>
                  {isEditing && (
                    <Button
                      type="button"
                      onClick={() => {
                        const newContactos = [...(editedData?.contactos || []), { tipo: 'Secundario', nombre: '', cargo: '', telefono: '', email: '' }]
                        setEditedData({ ...editedData, contactos: newContactos })
                      }}
                      size="sm"
                      className="bg-[#3259B5] hover:bg-[#3259B5]/90 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Contacto
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {(isEditing ? editedData?.contactos : empresaData.contactos)?.map((contacto: any, index: number) => (
                    <div key={index} className="bg-gradient-to-r from-[#F9FAFB] to-[#FFFFFF] p-4 rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-gradient-to-r from-[#3259B5] to-[#629BD2] text-white border-0">
                              {contacto.tipo || 'Contacto'}
                            </Badge>
                            {contacto.tipo !== 'Principal' && (
                              <Button
                                type="button"
                                onClick={() => {
                                  const newContactos = editedData?.contactos?.filter((_: any, i: number) => i !== index) || []
                                  setEditedData({ ...editedData, contactos: newContactos })
                                }}
                                size="sm"
                                variant="destructive"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div>
                            <Label className="text-xs text-[#6B7280]">Nombre</Label>
                            <Input
                              value={contacto.nombre || ''}
                              onChange={(e) => {
                                const newContactos = [...(editedData?.contactos || [])]
                                newContactos[index] = { ...newContactos[index], nombre: e.target.value }
                                setEditedData({ ...editedData, contactos: newContactos })
                              }}
                              className="mt-1"
                              placeholder="Nombre completo"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-[#6B7280]">Cargo</Label>
                            <Input
                              value={contacto.cargo || ''}
                              onChange={(e) => {
                                const newContactos = [...(editedData?.contactos || [])]
                                newContactos[index] = { ...newContactos[index], cargo: e.target.value }
                                setEditedData({ ...editedData, contactos: newContactos })
                              }}
                              className="mt-1"
                              placeholder="Cargo"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-[#6B7280]">Teléfono</Label>
                              <Input
                                value={contacto.telefono || ''}
                                onChange={(e) => {
                                  const newContactos = [...(editedData?.contactos || [])]
                                  newContactos[index] = { ...newContactos[index], telefono: e.target.value }
                                  setEditedData({ ...editedData, contactos: newContactos })
                                }}
                                className="mt-1"
                                placeholder="+54 9 11 1234-5678"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-[#6B7280]">Email</Label>
                              <Input
                                type="email"
                                value={contacto.email || ''}
                                onChange={(e) => {
                                  const newContactos = [...(editedData?.contactos || [])]
                                  newContactos[index] = { ...newContactos[index], email: e.target.value }
                                  setEditedData({ ...editedData, contactos: newContactos })
                                }}
                                className="mt-1"
                                placeholder="email@ejemplo.com"
                                disabled={contacto.tipo === 'Principal'}
                              />
                              {contacto.tipo === 'Principal' && (
                                <p className="text-xs text-yellow-600 mt-1">El email principal no se puede modificar. Contacta a un administrador.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Badge className="mb-2 bg-gradient-to-r from-[#3259B5] to-[#629BD2] text-white border-0">{contacto.tipo || 'Contacto'}</Badge>
                          <p className="font-bold text-[#222A59] mb-1 text-base">{contacto.nombre || 'Sin nombre'}</p>
                          {contacto.cargo && (
                            <p className="text-sm text-[#6B7280] mb-2 font-medium">{contacto.cargo}</p>
                          )}
                          <div className="space-y-2 text-sm">
                            {contacto.telefono && (
                              <div className="flex items-center gap-3 text-[#6B7280] bg-white px-3 py-2 rounded-lg border border-[#E5E7EB]">
                                <Phone className="w-4 h-4 text-[#3259B5]" />
                                <span className="font-medium">{contacto.telefono}</span>
                              </div>
                            )}
                            {contacto.email && (
                              <div className="flex items-center gap-3 text-[#6B7280] bg-white px-3 py-2 rounded-lg border border-[#E5E7EB]">
                                <Mail className="w-4 h-4 text-[#3259B5]" />
                                <span className="break-all font-medium">{contacto.email}</span>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  {(!empresaData.contactos || empresaData.contactos.length === 0) && !isEditing && (
                    <p className="text-sm text-[#6B7280] text-center py-4">No hay contactos registrados</p>
                  )}
                </div>
              </Card>
            )}

            {/* Location */}
            <Card className="p-6 shadow-lg border-2 border-[#3259B5]/10 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#3259B5] to-[#629BD2] rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-[#222A59]">Ubicación</h3>
              </div>
              
              {/* Map */}
              {isEditing ? (
                <div className="mb-3">
                  <Label className="text-xs text-[#6B7280] mb-2 block">Coordenadas de Geolocalización</Label>
                  <LocationPicker
                    value={(() => {
                      // Si hay coordenadas en editedData, usarlas
                      if (editedData?.geolocalizacion && 
                          editedData.geolocalizacion.lat !== null && 
                          editedData.geolocalizacion.lat !== undefined &&
                          editedData.geolocalizacion.lng !== null && 
                          editedData.geolocalizacion.lng !== undefined) {
                        return `${editedData.geolocalizacion.lat},${editedData.geolocalizacion.lng}`
                      }
                      // Si no, usar las de empresaData
                      if (empresaData?.geolocalizacion && 
                          empresaData.geolocalizacion.lat !== null && 
                          empresaData.geolocalizacion.lat !== undefined &&
                          empresaData.geolocalizacion.lng !== null && 
                          empresaData.geolocalizacion.lng !== undefined) {
                        return `${empresaData.geolocalizacion.lat},${empresaData.geolocalizacion.lng}`
                      }
                      // Si no hay coordenadas, devolver string vacío (LocationPicker usará default)
                      return ''
                    })()}
                    onChange={(coords) => {
                      // coords viene como string "lat,lng"
                      const [lat, lng] = coords.split(',').map((v: string) => parseFloat(v.trim()))
                      if (!isNaN(lat) && !isNaN(lng)) {
                        setEditedData({ 
                          ...editedData, 
                          geolocalizacion: { lat, lng } 
                        })
                      }
                    }}
                  />
                </div>
              ) : (
                (() => {
                  // Verificar si hay coordenadas válidas
                  const hasCoords = empresaData.geolocalizacion && 
                                    (empresaData.geolocalizacion.lat !== null && empresaData.geolocalizacion.lat !== undefined) &&
                                    (empresaData.geolocalizacion.lng !== null && empresaData.geolocalizacion.lng !== undefined)
                  
                  if (hasCoords) {
                    return (
                      <div className="mb-3">
                        <CompanyMap 
                          coordinates={{
                            lat: Number(empresaData.geolocalizacion.lat),
                            lng: Number(empresaData.geolocalizacion.lng)
                          }}
                          address={empresaData.direccion}
                        />
                      </div>
                    )
                  } else {
                    return (
                      <div className="mb-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">No hay coordenadas de geolocalización disponibles para mostrar el mapa.</p>
                        <p className="text-xs text-yellow-700 mt-1">Haz clic en "Editar Perfil" para agregar coordenadas.</p>
                      </div>
                    )
                  }
                })()
              )}
              
              {/* Location Details */}
              <div className="space-y-4 text-sm">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-[#6B7280]">Dirección</Label>
                      <Input
                        value={editedData?.direccion || ''}
                        onChange={(e) => setEditedData({ ...editedData, direccion: e.target.value })}
                        className="mt-1"
                        placeholder="Dirección completa"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-[#6B7280]">Departamento</Label>
                        <Input
                          value={editedData?.departamento || ''}
                          onChange={(e) => setEditedData({ ...editedData, departamento: e.target.value })}
                          className="mt-1"
                          placeholder="Departamento"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[#6B7280]">Municipio</Label>
                        <Input
                          value={editedData?.municipio || ''}
                          onChange={(e) => setEditedData({ ...editedData, municipio: e.target.value })}
                          className="mt-1"
                          placeholder="Municipio"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[#6B7280]">Localidad</Label>
                        <Input
                          value={editedData?.localidad || ''}
                          onChange={(e) => setEditedData({ ...editedData, localidad: e.target.value })}
                          className="mt-1"
                          placeholder="Localidad"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[#6B7280]">Provincia</Label>
                        <Input
                          value={editedData?.provincia || ''}
                          onChange={(e) => setEditedData({ ...editedData, provincia: e.target.value })}
                          className="mt-1"
                          placeholder="Provincia"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-[#6B7280]">Código Postal</Label>
                        <Input
                          value={editedData?.codigoPostal || ''}
                          onChange={(e) => setEditedData({ ...editedData, codigoPostal: e.target.value })}
                          className="mt-1"
                          placeholder="Código Postal"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {empresaData.direccion && (
                      <div className="bg-gradient-to-r from-[#F9FAFB] to-[#FFFFFF] p-3 rounded-lg border border-[#E5E7EB]">
                        <p className="text-[#6B7280] text-xs font-medium mb-1">Dirección</p>
                        <p className="font-semibold text-[#222A59]">{empresaData.direccion}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      {empresaData.departamento && (
                        <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                          <p className="text-[#6B7280] text-xs font-medium mb-1">Departamento</p>
                          <p className="font-semibold text-[#222A59]">{empresaData.departamento}</p>
                        </div>
                      )}
                      {empresaData.municipio && (
                        <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                          <p className="text-[#6B7280] text-xs font-medium mb-1">Municipio</p>
                          <p className="font-semibold text-[#222A59]">{empresaData.municipio}</p>
                        </div>
                      )}
                      {empresaData.localidad && (
                        <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                          <p className="text-[#6B7280] text-xs font-medium mb-1">Localidad</p>
                          <p className="font-semibold text-[#222A59]">{empresaData.localidad}</p>
                        </div>
                      )}
                      {empresaData.provincia && (
                        <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                          <p className="text-[#6B7280] text-xs font-medium mb-1">Provincia</p>
                          <p className="font-semibold text-[#222A59]">{empresaData.provincia}</p>
                        </div>
                      )}
                      {empresaData.codigoPostal && (
                        <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E5E7EB]">
                          <p className="text-[#6B7280] text-xs font-medium mb-1">Código Postal</p>
                          <p className="font-semibold text-[#222A59]">{empresaData.codigoPostal}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Website and Social Media */}
            {((empresaData.paginaWeb || empresaData.instagram || empresaData.facebook || empresaData.linkedin) || isEditing) && (
              <Card className="p-6 shadow-lg border-2 border-[#3259B5]/10 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#3259B5] to-[#629BD2] rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[#222A59]">Redes y Sitio Web</h3>
                </div>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-[#6B7280]">Sitio Web</Label>
                      <Input
                        value={editedData?.paginaWeb || ''}
                        onChange={(e) => setEditedData({ ...editedData, paginaWeb: e.target.value })}
                        className="mt-1"
                        placeholder="https://www.ejemplo.com"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[#6B7280]">Instagram</Label>
                      <Input
                        value={editedData?.instagram || ''}
                        onChange={(e) => setEditedData({ ...editedData, instagram: e.target.value })}
                        className="mt-1"
                        placeholder="@usuario"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[#6B7280]">Facebook</Label>
                      <Input
                        value={editedData?.facebook || ''}
                        onChange={(e) => setEditedData({ ...editedData, facebook: e.target.value })}
                        className="mt-1"
                        placeholder="usuario o página"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-[#6B7280]">LinkedIn</Label>
                      <Input
                        value={editedData?.linkedin || ''}
                        onChange={(e) => setEditedData({ ...editedData, linkedin: e.target.value })}
                        className="mt-1"
                        placeholder="usuario o empresa"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                  {empresaData.paginaWeb && (
                    <div className="bg-gradient-to-r from-[#F9FAFB] to-[#FFFFFF] p-3 rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200">
                      <p className="text-[#6B7280] text-xs font-medium mb-1">Sitio Web</p>
                      <a
                        href={empresaData.paginaWeb.startsWith('http') ? empresaData.paginaWeb : ('https://' + empresaData.paginaWeb)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3259B5] hover:text-[#629BD2] font-semibold break-all transition-colors duration-200"
                      >
                        {empresaData.paginaWeb}
                      </a>
                    </div>
                  )}
                  {empresaData.instagram && (
                    <div className="bg-gradient-to-r from-[#F9FAFB] to-[#FFFFFF] p-3 rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200">
                      <p className="text-[#6B7280] text-xs font-medium mb-1">Instagram</p>
                      <a
                        href={`https://instagram.com/${empresaData.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3259B5] hover:text-[#629BD2] font-semibold transition-colors duration-200"
                      >
                        @{empresaData.instagram.replace('@', '')}
                      </a>
                    </div>
                  )}
                  {empresaData.facebook && (
                    <div className="bg-gradient-to-r from-[#F9FAFB] to-[#FFFFFF] p-3 rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200">
                      <p className="text-[#6B7280] text-xs font-medium mb-1">Facebook</p>
                      <a
                        href={`https://facebook.com/${empresaData.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3259B5] hover:text-[#629BD2] font-semibold transition-colors duration-200"
                      >
                        {empresaData.facebook}
                      </a>
                    </div>
                  )}
                  {empresaData.linkedin && (
                    <div className="bg-gradient-to-r from-[#F9FAFB] to-[#FFFFFF] p-3 rounded-lg border border-[#E5E7EB] hover:shadow-md transition-shadow duration-200">
                      <p className="text-[#6B7280] text-xs font-medium mb-1">LinkedIn</p>
                      <a
                        href={`https://linkedin.com/company/${empresaData.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#3259B5] hover:text-[#629BD2] font-semibold transition-colors duration-200"
                      >
                        {empresaData.linkedin}
                      </a>
                    </div>
                  )}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Observations - Full Width */}
        {(empresaData.observaciones || isEditing) && (
          <Card className="p-6 shadow-lg border-2 border-[#3259B5]/10 hover:shadow-xl transition-shadow duration-300 mt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#3259B5] to-[#629BD2] rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-[#222A59]">Observaciones</h3>
            </div>
            {isEditing ? (
              <Textarea
                value={editedData?.observaciones || ''}
                onChange={(e) => setEditedData({ ...editedData, observaciones: e.target.value })}
                className="w-full"
                placeholder="Observaciones generales..."
                rows={4}
              />
            ) : (
              <div className="bg-gradient-to-r from-[#F9FAFB] to-[#FFFFFF] p-4 rounded-lg border border-[#E5E7EB]">
                <p className="text-sm text-[#6B7280] leading-relaxed">{empresaData.observaciones}</p>
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  )
}
