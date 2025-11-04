import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { UserPlus, Search, MoreVertical, Mail, Shield } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const usuarios = [
  {
    id: 1,
    nombre: "María González",
    email: "maria.gonzalez@catamarca.gob.ar",
    rol: "Administrador",
    estado: "Activo",
    ultimoAcceso: "Hace 2 horas",
  },
  {
    id: 2,
    nombre: "Juan Pérez",
    email: "juan.perez@catamarca.gob.ar",
    rol: "Analista",
    estado: "Activo",
    ultimoAcceso: "Hace 1 día",
  },
  {
    id: 3,
    nombre: "Ana Martínez",
    email: "ana.martinez@catamarca.gob.ar",
    rol: "Consultor",
    estado: "Activo",
    ultimoAcceso: "Hace 3 días",
  },
  {
    id: 4,
    nombre: "Carlos Rodríguez",
    email: "carlos.rodriguez@catamarca.gob.ar",
    rol: "Analista",
    estado: "Inactivo",
    ultimoAcceso: "Hace 2 semanas",
  },
]

export default function UsuariosPage() {
  const getRolColor = (rol: string) => {
    switch (rol) {
      case "Administrador":
        return "bg-[#C0217E] text-white"
      case "Analista":
        return "bg-[#3259B5] text-white"
      case "Consultor":
        return "bg-[#66A29C] text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getEstadoColor = (estado: string) => {
    return estado === "Activo" ? "bg-[#C3C840] text-[#222A59]" : "bg-gray-400 text-white"
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-[#222A59]">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-2">Administra los usuarios del sistema y sus permisos</p>
          </div>
          <Button className="bg-[#3259B5] hover:bg-[#222A59] gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <CardTitle className="text-[#222A59]">Usuarios del Sistema</CardTitle>
                <CardDescription>Lista de usuarios registrados y sus roles</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar usuarios..." className="pl-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usuarios.map((usuario) => (
                <div
                  key={usuario.id}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#3259B5] flex items-center justify-center text-white font-semibold">
                      {usuario.nombre
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-[#222A59]">{usuario.nombre}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {usuario.email}
                      </div>
                      <p className="text-xs text-muted-foreground">{usuario.ultimoAcceso}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={getRolColor(usuario.rol)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {usuario.rol}
                    </Badge>
                    <Badge className={getEstadoColor(usuario.estado)}>{usuario.estado}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                        <DropdownMenuItem>Editar usuario</DropdownMenuItem>
                        <DropdownMenuItem>Cambiar rol</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Desactivar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#222A59]">{usuarios.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#C3C840]">
                {usuarios.filter((u) => u.estado === "Activo").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#C0217E]">
                {usuarios.filter((u) => u.rol === "Administrador").length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
