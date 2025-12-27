"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileSpreadsheet, FileText, File } from "lucide-react"

interface Empresa {
  id: number
  razon_social: string
  cuit_cuil: string
  estado: string
  tipo_empresa?: string
  exporta?: string
  departamento?: string
  provincia?: string
  rubro_principal?: string
  correo?: string
  telefono?: string
  fecha_creacion: string
  [key: string]: any
}

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  empresas: Empresa[]
}

const availableFields = [
  // Información Básica
  { id: "razon_social", label: "Razón Social", category: "Información Básica", default: true },
  { id: "nombre_fantasia", label: "Nombre de Fantasía", category: "Información Básica", default: false },
  { id: "cuit_cuil", label: "CUIT/CUIL", category: "Información Básica", default: true },
  { id: "tipo_sociedad", label: "Tipo de Sociedad", category: "Información Básica", default: false },
  { id: "tipo_empresa", label: "Tipo de Empresa", category: "Información Básica", default: true },
  { id: "fecha_creacion", label: "Fecha de Registro", category: "Información Básica", default: false },
  
  // Rubro y Categorización
  { id: "rubro_principal", label: "Rubro Principal", category: "Rubro y Categorización", default: true },
  { id: "categoria_matriz", label: "Categoría Matriz", category: "Rubro y Categorización", default: false },
  
  // Años por Etapa
  { id: "anos_etapa_inicial", label: "Años en Etapa Inicial", category: "Años por Etapa", default: false },
  { id: "anos_potencial_exportadora", label: "Años como Potencial Exportadora", category: "Años por Etapa", default: false },
  { id: "anos_exportadora", label: "Años como Exportadora", category: "Años por Etapa", default: false },
  
  // Ubicación
  { id: "departamento", label: "Departamento", category: "Ubicación", default: true },
  { id: "municipio", label: "Municipio", category: "Ubicación", default: false },
  { id: "localidad", label: "Localidad", category: "Ubicación", default: false },
  { id: "direccion", label: "Dirección", category: "Ubicación", default: false },
  { id: "codigo_postal", label: "Código Postal", category: "Ubicación", default: false },
  { id: "provincia", label: "Provincia", category: "Ubicación", default: false },
  { id: "geolocalizacion", label: "Geolocalización", category: "Ubicación", default: false },
  
  // Contacto
  { id: "telefono", label: "Teléfono", category: "Contacto", default: true },
  { id: "correo", label: "Email", category: "Contacto", default: true },
  { id: "sitioweb", label: "Sitio Web", category: "Contacto", default: false },
  { id: "email_secundario", label: "Email Secundario", category: "Contacto", default: false },
  { id: "email_terciario", label: "Email Terciario", category: "Contacto", default: false },
  
  // Contacto Principal
  { id: "contacto_principal_nombre", label: "Contacto Principal - Nombre", category: "Contacto Principal", default: false },
  { id: "contacto_principal_cargo", label: "Contacto Principal - Cargo", category: "Contacto Principal", default: false },
  { id: "contacto_principal_telefono", label: "Contacto Principal - Teléfono", category: "Contacto Principal", default: false },
  { id: "contacto_principal_email", label: "Contacto Principal - Email", category: "Contacto Principal", default: false },
  
  // Contacto Secundario
  { id: "contacto_secundario_nombre", label: "Contacto Secundario - Nombre", category: "Contacto Secundario", default: false },
  { id: "contacto_secundario_cargo", label: "Contacto Secundario - Cargo", category: "Contacto Secundario", default: false },
  { id: "contacto_secundario_telefono", label: "Contacto Secundario - Teléfono", category: "Contacto Secundario", default: false },
  { id: "contacto_secundario_email", label: "Contacto Secundario - Email", category: "Contacto Secundario", default: false },
  
  // Actividad Comercial
  { id: "exporta", label: "¿Exporta?", category: "Actividad Comercial", default: true },
  { id: "destinoexporta", label: "Destino de Exportación", category: "Actividad Comercial", default: false },
  { id: "importa", label: "¿Importa?", category: "Actividad Comercial", default: false },
  { id: "interes_exportar", label: "Interés en Exportar", category: "Actividad Comercial", default: false },
  
  // Certificaciones
  { id: "certificadopyme", label: "Certificado MiPYME", category: "Certificaciones", default: false },
  { id: "certificaciones", label: "Certificaciones", category: "Certificaciones", default: false },
  
  // Promoción y Material
  { id: "promo2idiomas", label: "Material en Múltiples Idiomas", category: "Promoción", default: false },
  { id: "idiomas_trabaja", label: "Idiomas de Trabajo", category: "Promoción", default: false },
  
// ✅ NUEVOS CAMPOS: Actividades de Internacionalización
  { id: "ferias", label: "Ferias", category: "Actividades de Internacionalización", default: false },
  { id: "rondas", label: "Rondas de Negocios", category: "Actividades de Internacionalización", default: false },
  { id: "misiones", label: "Misiones Comerciales", category: "Actividades de Internacionalización", default: false },
  
  // Otros
  { id: "observaciones", label: "Observaciones", category: "Otros", default: false },
]

export function ExportDialog({ open, onClose, empresas }: ExportDialogProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(
    availableFields.filter(f => f.default).map(f => f.id)
  )
  const [format, setFormat] = useState<"excel" | "csv" | "pdf">("excel")
  const [exporting, setExporting] = useState(false)

  // Debug: Log cuando cambian las empresas
  useEffect(() => {
    if (open) {
      console.log('[ExportDialog] Empresas recibidas:', empresas.length, empresas.map(e => e.razon_social))
    }
  }, [open, empresas])

  const handleToggleField = (fieldId: string) => {
    if (selectedFields.includes(fieldId)) {
      setSelectedFields(selectedFields.filter(id => id !== fieldId))
    } else {
      setSelectedFields([...selectedFields, fieldId])
    }
  }

  const handleSelectAll = () => {
    if (selectedFields.length === availableFields.length) {
      setSelectedFields([])
    } else {
      setSelectedFields(availableFields.map(f => f.id))
    }
  }

  const getFieldValue = (empresa: any, fieldName: string): any => {
    let value = empresa[fieldName]
    
    // Si el valor es null o undefined, retornar vacío
    if (value === null || value === undefined) return ""
    
    // Formatear fechas
    if (fieldName === 'fecha_creacion' || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-AR', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
          })
        }
      } catch (e) {
        // Si falla el parseo, continuar con el valor original
      }
    }
    
    // Formatear booleanos
    if (typeof value === 'boolean') return value ? 'Sí' : 'No'
    
    // Manejar objetos
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join('; ')
      }
      if (value.nombre) return value.nombre
      if (value.razon_social) return value.razon_social
      return JSON.stringify(value)
    }
    
    return String(value)
  }

  const exportToCSV = () => {
    if (selectedFields.length === 0) {
      alert("Por favor selecciona al menos un campo para exportar")
      return
    }

    // Mapear nombres de campos del frontend a los nombres reales en las empresas
    const fieldMap: Record<string, string> = {
      'razon_social': 'razon_social',
      'nombre_fantasia': 'nombre_fantasia',
      'cuit_cuil': 'cuit_cuil',
      'tipo_sociedad': 'tipo_sociedad',
      'tipo_empresa': 'tipo_empresa_nombre',
      'fecha_creacion': 'fecha_creacion',
      'rubro_principal': 'rubro_nombre',
      'categoria_matriz': 'categoria_matriz',
      'anos_etapa_inicial': 'anos_etapa_inicial',
      'anos_potencial_exportadora': 'anos_potencial_exportadora',
      'anos_exportadora': 'anos_exportadora',
      'departamento': 'departamento_nombre',
      'municipio': 'municipio_nombre',
      'localidad': 'localidad_nombre',
      'direccion': 'direccion',
      'codigo_postal': 'codigo_postal',
      'provincia': 'provincia',
      'geolocalizacion': 'geolocalizacion',
      'telefono': 'telefono',
      'correo': 'correo',
      'sitioweb': 'sitioweb',
      'email_secundario': 'email_secundario',
      'email_terciario': 'email_terciario',
      'contacto_principal_nombre': 'contacto_principal_nombre',
      'contacto_principal_cargo': 'contacto_principal_cargo',
      'contacto_principal_telefono': 'contacto_principal_telefono',
      'contacto_principal_email': 'contacto_principal_email',
      'contacto_secundario_nombre': 'contacto_secundario_nombre',
      'contacto_secundario_cargo': 'contacto_secundario_cargo',
      'contacto_secundario_telefono': 'contacto_secundario_telefono',
      'contacto_secundario_email': 'contacto_secundario_email',
      'exporta': 'exporta',
      'destinoexporta': 'destinoexporta',
      'importa': 'importa',
      'interes_exportar': 'interes_exportar',
      'certificadopyme': 'certificadopyme',
      'certificacionesbool': 'certificacionesbool',
      'certificaciones': 'certificaciones',
      'promo2idiomas': 'promo2idiomas',
      'idiomas_trabaja': 'idiomas_trabaja',
      'ferias': 'ferias',
      'rondas': 'rondas',
      'misiones': 'misiones',
      'observaciones': 'observaciones',
    }

    // Función helper para escapar valores CSV
    const escapeCSV = (value: any): string => {
      const stringValue = String(value)
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    // Obtener los campos seleccionados en el orden correcto
    const selectedFieldsData = selectedFields
      .map(fieldId => availableFields.find(f => f.id === fieldId))
      .filter(f => f !== undefined)

    const headers = selectedFieldsData.map(f => f!.label)

    // Construir CSV con formato de tabla (columnas y filas)
    const csvLines: string[] = []
    
    // Encabezado
    csvLines.push(headers.map(h => escapeCSV(h)).join(','))
    
    // Datos
    empresas.forEach(empresa => {
      const row = selectedFieldsData.map(field => {
        const realFieldName = fieldMap[field!.id] || field!.id
        
        // Obtener valor del campo, verificando múltiples ubicaciones posibles
        let value = empresa[realFieldName] || empresa[field!.id] || ""
        
        // Si no hay valor, intentar obtenerlo de relaciones o campos alternativos
        if (!value || value === "") {
          // Manejar campos especiales que pueden venir de relaciones
          if (field!.id === 'tipo_empresa') {
            value = empresa.tipo_empresa?.nombre || empresa.tipo_empresa_nombre || empresa.tipo_empresa || ""
          } else if (field!.id === 'provincia') {
            // La provincia generalmente viene del departamento
            value = empresa.departamento?.provincia?.nombre || empresa.provincia || 'Catamarca'
          } else if (field!.id === 'rubro_principal') {
            value = empresa.id_rubro?.nombre || empresa.rubro_nombre || empresa.rubro_principal || ""
          } else if (field!.id === 'departamento') {
            value = empresa.departamento?.nombre || empresa.departamento_nombre || empresa.departamento || ""
          } else if (field!.id === 'municipio') {
            value = empresa.municipio?.nombre || empresa.municipio_nombre || empresa.municipio || ""
          } else if (field!.id === 'localidad') {
            value = empresa.localidad?.nombre || empresa.localidad_nombre || empresa.localidad || ""
          }
        }
        
        // Usar getFieldValue para formatear correctamente (incluye fechas)
        value = getFieldValue({ ...empresa, [realFieldName]: value }, realFieldName)
        return escapeCSV(value)
      })
      csvLines.push(row.join(','))
    })

    const csvContent = csvLines.join("\n")

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `empresas_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const escapeHTML = (text: string): string => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const exportToExcel = () => {
    if (selectedFields.length === 0) {
      alert("Por favor selecciona al menos un campo para exportar")
      return
    }

    // Mapear nombres de campos del frontend a los nombres reales en las empresas
    const fieldMap: Record<string, string> = {
      'razon_social': 'razon_social',
      'nombre_fantasia': 'nombre_fantasia',
      'cuit_cuil': 'cuit_cuil',
      'tipo_sociedad': 'tipo_sociedad',
      'tipo_empresa': 'tipo_empresa_nombre',
      'fecha_creacion': 'fecha_creacion',
      'rubro_principal': 'rubro_nombre',
      'categoria_matriz': 'categoria_matriz',
      'anos_etapa_inicial': 'anos_etapa_inicial',
      'anos_potencial_exportadora': 'anos_potencial_exportadora',
      'anos_exportadora': 'anos_exportadora',
      'departamento': 'departamento_nombre',
      'municipio': 'municipio_nombre',
      'localidad': 'localidad_nombre',
      'direccion': 'direccion',
      'codigo_postal': 'codigo_postal',
      'provincia': 'provincia',
      'geolocalizacion': 'geolocalizacion',
      'telefono': 'telefono',
      'correo': 'correo',
      'sitioweb': 'sitioweb',
      'email_secundario': 'email_secundario',
      'email_terciario': 'email_terciario',
      'contacto_principal_nombre': 'contacto_principal_nombre',
      'contacto_principal_cargo': 'contacto_principal_cargo',
      'contacto_principal_telefono': 'contacto_principal_telefono',
      'contacto_principal_email': 'contacto_principal_email',
      'contacto_secundario_nombre': 'contacto_secundario_nombre',
      'contacto_secundario_cargo': 'contacto_secundario_cargo',
      'contacto_secundario_telefono': 'contacto_secundario_telefono',
      'contacto_secundario_email': 'contacto_secundario_email',
      'exporta': 'exporta',
      'destinoexporta': 'destinoexporta',
      'importa': 'importa',
      'interes_exportar': 'interes_exportar',
      'certificadopyme': 'certificadopyme',
      'certificaciones': 'certificaciones',
      'promo2idiomas': 'promo2idiomas',
      'idiomas_trabaja': 'idiomas_trabaja',
      'ferias': 'ferias',
      'rondas': 'rondas',
      'misiones': 'misiones',
      'observaciones': 'observaciones',
    }

    // Obtener los campos seleccionados en el orden correcto
    const selectedFieldsData = selectedFields
      .map(fieldId => availableFields.find(f => f.id === fieldId))
      .filter(f => f !== undefined)

    const headers = selectedFieldsData.map(f => f!.label)
    
    // Crear contenido HTML para Excel (formato tabla con estilos)
    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th {
              background-color: #3259B5;
              color: white;
              font-weight: bold;
              padding: 8px;
              text-align: left;
              border: 1px solid #ddd;
            }
            td {
              padding: 6px;
              border: 1px solid #ddd;
            }
            tr:nth-child(even) {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${escapeHTML(h)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
    `
    
    empresas.forEach(empresa => {
      htmlContent += '<tr>'
      selectedFieldsData.forEach(field => {
        const realFieldName = fieldMap[field!.id] || field!.id
        
        // Obtener valor del campo, verificando múltiples ubicaciones posibles
        let value = empresa[realFieldName] || empresa[field!.id] || ""
        
        // Si no hay valor, intentar obtenerlo de relaciones o campos alternativos
        if (!value || value === "") {
          // Manejar campos especiales que pueden venir de relaciones
          if (field!.id === 'tipo_empresa') {
            value = empresa.tipo_empresa?.nombre || empresa.tipo_empresa_nombre || empresa.tipo_empresa || ""
          } else if (field!.id === 'provincia') {
            // La provincia generalmente viene del departamento
            value = empresa.departamento?.provincia?.nombre || empresa.provincia || 'Catamarca'
          } else if (field!.id === 'rubro_principal') {
            value = empresa.id_rubro?.nombre || empresa.rubro_nombre || empresa.rubro_principal || ""
          } else if (field!.id === 'departamento') {
            value = empresa.departamento?.nombre || empresa.departamento_nombre || empresa.departamento || ""
          } else if (field!.id === 'municipio') {
            value = empresa.municipio?.nombre || empresa.municipio_nombre || empresa.municipio || ""
          } else if (field!.id === 'localidad') {
            value = empresa.localidad?.nombre || empresa.localidad_nombre || empresa.localidad || ""
          }
        }
        
        // Usar getFieldValue para formatear correctamente (incluye fechas)
        value = getFieldValue({ ...empresa, [realFieldName]: value }, realFieldName)
        const stringValue = String(value)
        htmlContent += `<td>${escapeHTML(stringValue)}</td>`
      })
      htmlContent += '</tr>'
    })
    
    htmlContent += `
            </tbody>
          </table>
        </body>
      </html>
    `
    
    const blob = new Blob(['\ufeff' + htmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `empresas_${new Date().toISOString().split("T")[0]}.xls`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportToPDF = async () => {
    if (selectedFields.length === 0) {
      alert("Por favor selecciona al menos un campo para exportar")
      return
    }

    if (empresas.length === 0) {
      alert("No hay empresas seleccionadas para exportar")
      return
    }

    try {
      // Importar API
      const api = (await import("@/lib/api")).default
      
      // Obtener IDs de las empresas seleccionadas
      const empresasIds = empresas.map(emp => emp.id)
      
      console.log("Exportando PDF con empresas:", empresasIds, "y campos:", selectedFields)
      
      // Llamar al nuevo endpoint que genera PDF con la estética institucional
      const blob = await api.exportEmpresasSeleccionadasPDF(empresasIds, selectedFields)
      
      console.log("PDF recibido, tamaño:", blob.size, "tipo:", blob.type)
      
      // Verificar que sea un PDF
      if (!blob.type.includes('pdf') && blob.type !== 'application/pdf') {
        console.warn("El blob no es un PDF, tipo recibido:", blob.type)
      }
      
      // Crear URL del blob y descargar
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `empresas_exportacion_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error("Error exporting PDF:", error)
      alert(error.message || "Error al exportar el PDF. Por favor, intenta nuevamente.")
      throw error
    }
  }

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      alert("Por favor selecciona al menos un campo para exportar")
      return
    }

    setExporting(true)
    try {
      switch (format) {
        case "csv":
          exportToCSV()
          break
        case "excel":
          exportToExcel()
          break
        case "pdf":
          await exportToPDF()
          break
      }
      onClose()
    } catch (error) {
      console.error("Error exporting:", error)
      alert("Error al exportar los datos. Por favor, intenta nuevamente.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar Empresas</DialogTitle>
          <DialogDescription>
            Selecciona los campos que deseas exportar y el formato de archivo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format">Formato de Exportación</Label>
            <Select value={format} onValueChange={(value: "excel" | "csv" | "pdf") => setFormat(value)}>
              <SelectTrigger id="format">
                <SelectValue placeholder="Seleccionar formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel (XLS)
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fields Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Campos a Exportar</Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedFields.length === availableFields.length ? "Deseleccionar Todos" : "Seleccionar Todos"}
              </Button>
            </div>
            <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto space-y-4">
              {Array.from(new Set(availableFields.map(f => f.category))).map((category) => {
                const categoryFields = availableFields.filter(f => f.category === category)
                const allSelected = categoryFields.every(f => selectedFields.includes(f.id))
                const someSelected = categoryFields.some(f => selectedFields.includes(f.id))
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id={`category-${category}`}
                        checked={allSelected}
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = someSelected && !allSelected
                          }
                        }}
                        onCheckedChange={() => {
                          const categoryFieldIds = categoryFields.map(f => f.id)
                          if (allSelected) {
                            setSelectedFields(selectedFields.filter(id => !categoryFieldIds.includes(id)))
                          } else {
                            setSelectedFields([...new Set([...selectedFields, ...categoryFieldIds])])
                          }
                        }}
                      />
                      <Label htmlFor={`category-${category}`} className="text-sm font-semibold cursor-pointer">
                        {category}
                      </Label>
                    </div>
                    <div className="pl-6 space-y-2">
                      {categoryFields.map((field) => (
                        <div key={field.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={field.id}
                            checked={selectedFields.includes(field.id)}
                            onCheckedChange={() => handleToggleField(field.id)}
                          />
                          <Label htmlFor={field.id} className="text-sm font-normal cursor-pointer">
                            {field.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedFields.length} de {availableFields.length} campos seleccionados
            </p>
          </div>

          {/* Summary */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">Resumen</p>
            <p className="text-xs text-muted-foreground mt-1">
              Se exportarán <strong>{empresas.length}</strong> empresa(s) seleccionada(s) con <strong>{selectedFields.length}</strong> campo(s) en formato <strong>{format.toUpperCase()}</strong>
            </p>
            {empresas.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                <p className="font-medium mb-1">Empresas a exportar:</p>
                <ul className="list-disc list-inside space-y-1 max-h-20 overflow-y-auto">
                  {empresas.slice(0, 5).map((emp, idx) => (
                    <li key={idx}>{emp.razon_social}</li>
                  ))}
                  {empresas.length > 5 && (
                    <li className="text-muted-foreground">... y {empresas.length - 5} más</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={exporting}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || selectedFields.length === 0}
            className="bg-[#3259B5] hover:bg-[#3259B5]/90"
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exportando..." : "Exportar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

