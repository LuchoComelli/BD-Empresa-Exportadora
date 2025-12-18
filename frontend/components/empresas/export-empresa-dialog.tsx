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
import { useToast } from "@/hooks/use-toast"

interface Empresa {
  id: number
  razon_social: string
  nombre_fantasia?: string
  cuit_cuil: string
  tipo_sociedad?: string
  tipo_empresa?: string
  tipo_empresa_valor?: string
  estado?: string
  direccion?: string
  codigo_postal?: string
  departamento?: string
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
  rubro_nombre?: string
  rubro_producto_nombre?: string
  rubro_servicio_nombre?: string
  sub_rubro_nombre?: string
  sub_rubro_producto_nombre?: string
  sub_rubro_servicio_nombre?: string
  instagram?: string
  facebook?: string
  linkedin?: string
  contacto_principal_nombre?: string
  contacto_principal_cargo?: string
  contacto_principal_telefono?: string
  contacto_principal_email?: string
  fecha_creacion?: string
  fecha_actualizacion?: string
  productos?: any[]
  servicios?: any[]
  actividades_promocion_internacional?: any[]
  [key: string]: any
}

interface ExportEmpresaDialogProps {
  open: boolean
  onClose: () => void
  empresa: Empresa
}

// Función helper para obtener el valor de un campo de la empresa
const getFieldValue = (empresa: Empresa, fieldId: string): string => {
  const value = empresa[fieldId]
  
  if (value === null || value === undefined) return ''
  
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }
  
  if (Array.isArray(value)) {
    return value.length > 0 ? JSON.stringify(value) : ''
  }
  
  if (typeof value === 'object') {
    // Si es un objeto, intentar obtener el nombre o id
    if (value.nombre) return value.nombre
    if (value.nombre_fantasia) return value.nombre_fantasia
    if (value.razon_social) return value.razon_social
    return JSON.stringify(value)
  }
  
  return String(value)
}

// Lista completa de campos disponibles organizados por categorías
const availableFields = [
  // Información Básica
  { id: "razon_social", label: "Razón Social", category: "básica", default: true },
  { id: "nombre_fantasia", label: "Nombre de Fantasía", category: "básica", default: true },
  { id: "cuit_cuil", label: "CUIT/CUIL", category: "básica", default: true },
  { id: "tipo_sociedad", label: "Tipo de Sociedad", category: "básica", default: false },
  { id: "tipo_empresa", label: "Tipo de Empresa", category: "básica", default: true },
  { id: "estado", label: "Estado", category: "básica", default: false },
  
  // Rubro y Categorización
  { id: "rubro_nombre", label: "Rubro", category: "rubro", default: true },
  { id: "rubro_producto_nombre", label: "Rubro (Productos)", category: "rubro", default: false },
  { id: "rubro_servicio_nombre", label: "Rubro (Servicios)", category: "rubro", default: false },
  { id: "sub_rubro_nombre", label: "Sub Rubro", category: "rubro", default: false },
  { id: "sub_rubro_producto_nombre", label: "Sub Rubro (Productos)", category: "rubro", default: false },
  { id: "sub_rubro_servicio_nombre", label: "Sub Rubro (Servicios)", category: "rubro", default: false },
  { id: "categoria_matriz", label: "Categoría Matriz", category: "rubro", default: true },
  
  // Ubicación
  { id: "direccion", label: "Dirección", category: "ubicacion", default: true },
  { id: "codigo_postal", label: "Código Postal", category: "ubicacion", default: false },
  { id: "departamento_nombre", label: "Departamento", category: "ubicacion", default: true },
  { id: "municipio_nombre", label: "Municipio", category: "ubicacion", default: false },
  { id: "localidad_nombre", label: "Localidad", category: "ubicacion", default: false },
  { id: "geolocalizacion", label: "Geolocalización", category: "ubicacion", default: false },
  
  // Contacto
  { id: "telefono", label: "Teléfono", category: "contacto", default: true },
  { id: "correo", label: "Email", category: "contacto", default: true },
  { id: "sitioweb", label: "Sitio Web", category: "contacto", default: false },
  { id: "instagram", label: "Instagram", category: "contacto", default: false },
  { id: "facebook", label: "Facebook", category: "contacto", default: false },
  { id: "linkedin", label: "LinkedIn", category: "contacto", default: false },
  
  // Contacto Principal
  { id: "contacto_principal_nombre", label: "Contacto Principal - Nombre", category: "contacto", default: false },
  { id: "contacto_principal_cargo", label: "Contacto Principal - Cargo", category: "contacto", default: false },
  { id: "contacto_principal_telefono", label: "Contacto Principal - Teléfono", category: "contacto", default: false },
  { id: "contacto_principal_email", label: "Contacto Principal - Email", category: "contacto", default: false },
  
  // Actividad Comercial
  { id: "exporta", label: "¿Exporta?", category: "comercial", default: true },
  { id: "destinoexporta", label: "Destino de Exportación", category: "comercial", default: false },
  { id: "importa", label: "¿Importa?", category: "comercial", default: false },
  { id: "interes_exportar", label: "Interés en Exportar", category: "comercial", default: false },
  { id: "idiomas_trabaja", label: "Idiomas de Trabajo", category: "comercial", default: false },
  
  // Certificaciones
  { id: "certificadopyme", label: "Certificado MiPyME", category: "certificaciones", default: true },
  { id: "certificaciones", label: "Certificaciones", category: "certificaciones", default: false },
  { id: "promo2idiomas", label: "Material Promocional 2 Idiomas", category: "certificaciones", default: false },
  
  // Otros
  { id: "observaciones", label: "Observaciones", category: "otros", default: false },
  { id: "fecha_creacion", label: "Fecha de Creación", category: "otros", default: false },
  { id: "fecha_actualizacion", label: "Fecha de Actualización", category: "otros", default: false },
]

const categories = [
  { id: "básica", label: "Información Básica" },
  { id: "rubro", label: "Rubro y Categorización" },
  { id: "ubicacion", label: "Ubicación" },
  { id: "contacto", label: "Contacto" },
  { id: "comercial", label: "Actividad Comercial" },
  { id: "certificaciones", label: "Certificaciones" },
  { id: "otros", label: "Otros" },
]

export function ExportEmpresaDialog({ open, onClose, empresa }: ExportEmpresaDialogProps) {
  const { toast } = useToast()
  const [selectedFields, setSelectedFields] = useState<string[]>(
    availableFields.filter(f => f.default).map(f => f.id)
  )
  const [format, setFormat] = useState<"excel" | "csv" | "pdf">("csv")
  const [exporting, setExporting] = useState(false)

  // Debug: Log cuando se abre el diálogo
  useEffect(() => {
    if (open && empresa) {
      console.log('[ExportEmpresaDialog] Empresa recibida:', empresa.razon_social, empresa.id)
    }
  }, [open, empresa])

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

  const handleSelectCategory = (categoryId: string) => {
    const categoryFields = availableFields.filter(f => f.category === categoryId).map(f => f.id)
    const allSelected = categoryFields.every(f => selectedFields.includes(f))
    
    if (allSelected) {
      // Deseleccionar todos los campos de esta categoría
      setSelectedFields(selectedFields.filter(id => !categoryFields.includes(id)))
    } else {
      // Seleccionar todos los campos de esta categoría
      setSelectedFields([...new Set([...selectedFields, ...categoryFields])])
    }
  }

  const exportToCSV = () => {
    if (selectedFields.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos un campo para exportar",
        variant: "destructive",
      })
      return
    }

    // Headers
    const headers = selectedFields.map(fieldId => {
      const field = availableFields.find(f => f.id === fieldId)
      return field?.label || fieldId
    })

    // Data row
    const row = selectedFields.map(fieldId => {
      const value = getFieldValue(empresa, fieldId)
      // Escape commas and quotes in CSV
      if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })

    // Combine headers and row
    const csvContent = [
      headers.join(","),
      row.join(",")
    ].join("\n")

    // Create blob and download
    const blob = new Blob(['\ufeff' + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${empresa.razon_social.replace(/\s+/g, '_')}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Éxito",
      description: "Empresa exportada correctamente",
    })
  }

  const exportToExcel = () => {
    if (selectedFields.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos un campo para exportar",
        variant: "destructive",
      })
      return
    }

    // Create CSV format (Excel can open CSV)
    const headers = selectedFields.map(fieldId => {
      const field = availableFields.find(f => f.id === fieldId)
      return field?.label || fieldId
    })

    const row = selectedFields.map(fieldId => {
      const value = getFieldValue(empresa, fieldId)
      if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })

    const csvContent = [
      headers.join(","),
      row.join(",")
    ].join("\n")

    // Create blob with Excel MIME type
    const blob = new Blob(['\ufeff' + csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${empresa.razon_social.replace(/\s+/g, '_')}_${new Date().toISOString().split("T")[0]}.xls`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    toast({
      title: "Éxito",
      description: "Empresa exportada correctamente",
    })
  }

  const exportToPDF = async () => {
    if (selectedFields.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos un campo para exportar",
        variant: "destructive",
      })
      return
    }

    try {
      // Importar API
      const api = (await import("@/lib/api")).default
      
      // Usar el mismo endpoint del backend para generar PDF con header, footer y marca de agua
      const blob = await api.exportEmpresasSeleccionadasPDF([empresa.id], selectedFields)
      
      // Verificar que sea un PDF
      if (!blob.type.includes('pdf') && blob.type !== 'application/pdf') {
        console.warn("El blob no es un PDF, tipo recibido:", blob.type)
      }
      
      // Crear URL del blob y descargar
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `empresa_${empresa.razon_social.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast({
        title: "Éxito",
        description: "PDF exportado correctamente con header, footer y marca de agua",
      })
    } catch (error: any) {
      console.error("Error exporting PDF:", error)
      toast({
        title: "Error",
        description: error.message || "Error al exportar el PDF. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos un campo para exportar",
        variant: "destructive",
      })
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
      toast({
        title: "Error",
        description: "Error al exportar los datos. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Exportar Empresa</DialogTitle>
          <DialogDescription>
            Selecciona los campos que deseas exportar y el formato de archivo para {empresa.razon_social}
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

          {/* Fields Selection by Category */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Campos a Exportar</Label>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedFields.length === availableFields.length ? "Deseleccionar Todos" : "Seleccionar Todos"}
              </Button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto p-2 border rounded-lg">
              {categories.map(category => {
                const categoryFields = availableFields.filter(f => f.category === category.id)
                const selectedInCategory = categoryFields.filter(f => selectedFields.includes(f.id))
                
                return (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-semibold text-sm">{category.label}</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleSelectCategory(category.id)}
                        className="text-xs"
                      >
                        {selectedInCategory.length === categoryFields.length ? "Deseleccionar" : "Seleccionar Todos"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pl-4">
                      {categoryFields.map(field => {
                        const isSelected = selectedFields.includes(field.id)
                        const hasValue = getFieldValue(empresa, field.id) !== ''
                        
                        return (
                          <div key={field.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={field.id}
                              checked={isSelected}
                              onCheckedChange={() => handleToggleField(field.id)}
                              disabled={!hasValue && !isSelected}
                            />
                            <Label
                              htmlFor={field.id}
                              className={`text-sm font-normal cursor-pointer ${!hasValue && !isSelected ? 'text-muted-foreground opacity-50' : ''}`}
                            >
                              {field.label}
                            </Label>
                          </div>
                        )
                      })}
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
              Se exportará la empresa <strong>{empresa.razon_social}</strong> con {selectedFields.length} campo(s) en formato {format.toUpperCase()}
            </p>
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

