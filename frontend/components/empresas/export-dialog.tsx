"use client"

import { useState } from "react"
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
  { id: "razon_social", label: "Razón Social", default: true },
  { id: "cuit_cuil", label: "CUIT/CUIL", default: true },
  { id: "tipo_empresa", label: "Tipo de Empresa", default: false },
  { id: "rubro_principal", label: "Rubro Principal", default: true },
  { id: "departamento", label: "Departamento", default: true },
  { id: "provincia", label: "Provincia", default: false },
  { id: "correo", label: "Email", default: true },
  { id: "telefono", label: "Teléfono", default: true },
  { id: "exporta", label: "Exporta", default: true },
  { id: "fecha_creacion", label: "Fecha de Registro", default: false },
]

export function ExportDialog({ open, onClose, empresas }: ExportDialogProps) {
  const [selectedFields, setSelectedFields] = useState<string[]>(
    availableFields.filter(f => f.default).map(f => f.id)
  )
  const [format, setFormat] = useState<"excel" | "csv" | "pdf">("excel")
  const [exporting, setExporting] = useState(false)

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

  const exportToCSV = () => {
    if (selectedFields.length === 0) {
      alert("Por favor selecciona al menos un campo para exportar")
      return
    }

    // Headers
    const headers = selectedFields.map(fieldId => {
      const field = availableFields.find(f => f.id === fieldId)
      return field?.label || fieldId
    })

    // Data rows
    const rows = empresas.map(empresa => {
      return selectedFields.map(fieldId => {
        const value = empresa[fieldId] || ""
        // Escape commas and quotes in CSV
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `empresas_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToExcel = () => {
    if (selectedFields.length === 0) {
      alert("Por favor selecciona al menos un campo para exportar")
      return
    }

    // Create CSV format (Excel can open CSV)
    const headers = selectedFields.map(fieldId => {
      const field = availableFields.find(f => f.id === fieldId)
      return field?.label || fieldId
    })

    const rows = empresas.map(empresa => {
      return selectedFields.map(fieldId => {
        const value = empresa[fieldId] || ""
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      })
    })

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n")

    // Create blob with Excel MIME type
    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `empresas_${new Date().toISOString().split("T")[0]}.xls`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    if (selectedFields.length === 0) {
      alert("Por favor selecciona al menos un campo para exportar")
      return
    }

    // For PDF, we'll create a simple HTML table and use print
    const headers = selectedFields.map(fieldId => {
      const field = availableFields.find(f => f.id === fieldId)
      return field?.label || fieldId
    })

    const rows = empresas.map(empresa => {
      return selectedFields.map(fieldId => {
        return empresa[fieldId] || ""
      })
    })

    // Create HTML table
    let html = `
      <html>
        <head>
          <title>Empresas Exportadas</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #222A59; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>Listado de Empresas</h1>
          <p>Fecha de exportación: ${new Date().toLocaleDateString("es-AR")}</p>
          <p>Total de empresas: ${empresas.length}</p>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, "_blank")
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
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
          exportToPDF()
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
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg">
              {availableFields.map(field => {
                const isSelected = selectedFields.includes(field.id)
                return (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={field.id}
                      checked={isSelected}
                      onCheckedChange={() => handleToggleField(field.id)}
                    />
                    <Label
                      htmlFor={field.id}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {field.label}
                    </Label>
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
              Se exportarán {empresas.length} empresa(s) con {selectedFields.length} campo(s) en formato {format.toUpperCase()}
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

