"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { UserPlus, Search, MoreVertical, Mail, Shield, Eye, Edit, UserX, Loader2, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import api from "@/lib/api"
import { useRouter } from "next/navigation"
import { useDashboardAuth, handleAuthError } from "@/hooks/use-dashboard-auth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Usuario {
  id: number
  email: string
  nombre: string
  apellido: string
  rol_nombre?: string
  rol?: number
  rol_detalle?: {
    id: number
    nombre: string
  }
  is_active: boolean
  last_login?: string
  date_joined?: string
}

interface Rol {
  id: number
  nombre: string
  descripcion?: string
}

export default function UsuariosPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useDashboardAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  
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
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(false)
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null)
  const [loadingAction, setLoadingAction] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    nombre: "",
    apellido: "",
    password: "",
    rol: "",
    telefono: "",
  })

  useEffect(() => {
    loadUsuarios()
    loadRoles()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsuarios()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const loadUsuarios = async () => {
    try {
      setLoading(true)
      const params: any = {
        page_size: 100,
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      const response = await api.getUsuarios(params)
      
      let allUsuarios = []
      if (response.results) {
        allUsuarios = response.results
      } else if (Array.isArray(response)) {
        allUsuarios = response
      } else {
        allUsuarios = []
      }
      
      // El backend ya filtra por rol, solo necesitamos mapear los datos
      setUsuarios(allUsuarios)
    } catch (error: any) {
      if (!handleAuthError(error)) {
        console.error("Error loading usuarios:", error)
      }
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await api.getRoles()
      let allRoles = []
      if (Array.isArray(response)) {
        allRoles = response
      } else if (response.results) {
        allRoles = response.results
      }
      // El backend ya filtra los roles, solo necesitamos mapear los datos
      setRoles(allRoles)
    } catch (error) {
      console.error("Error loading roles:", error)
    }
  }

  const handleCreateUsuario = async () => {
    try {
      setLoadingAction(true)
      
      // Validar que el rol esté seleccionado
      if (!formData.rol) {
        alert("Por favor, selecciona un rol para el usuario")
        return
      }
      
      const usuarioData: any = {
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido,
        password: formData.password,
        rol: parseInt(formData.rol),
      }
      
      // Solo agregar teléfono si tiene valor
      if (formData.telefono) {
        usuarioData.telefono = formData.telefono
      }
      
      await api.createUsuario(usuarioData)
      setShowCreateDialog(false)
      setFormData({
        email: "",
        nombre: "",
        apellido: "",
        password: "",
        rol: "",
        telefono: "",
      })
      loadUsuarios()
      alert("Usuario creado exitosamente")
    } catch (error: any) {
      console.error("Error creating usuario:", error)
      const errorMessage = error.message || "Error al crear el usuario. Por favor, intenta nuevamente."
      alert(errorMessage)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleEditUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      password: "",
      rol: usuario.rol?.toString() || usuario.rol_detalle?.id?.toString() || "",
      telefono: (usuario as any).telefono || "",
    })
    setShowEditDialog(true)
  }

  const handleUpdateUsuario = async () => {
    if (!selectedUsuario) return

    try {
      setLoadingAction(true)
      const updateData: any = {
        email: formData.email,
        nombre: formData.nombre,
        apellido: formData.apellido,
      }

      // Solo actualizar rol si se seleccionó uno
      if (formData.rol) {
        updateData.rol = parseInt(formData.rol)
      }

      // Solo actualizar teléfono si tiene valor
      if (formData.telefono) {
        updateData.telefono = formData.telefono
      }

      // Solo actualizar contraseña si se proporcionó una nueva
      if (formData.password) {
        updateData.password = formData.password
      }

      await api.updateUsuario(selectedUsuario.id, updateData)
      setShowEditDialog(false)
      setSelectedUsuario(null)
      setFormData({
        email: "",
        nombre: "",
        apellido: "",
        password: "",
        rol: "",
        telefono: "",
      })
      loadUsuarios()
      alert("Usuario actualizado exitosamente")
    } catch (error: any) {
      console.error("Error updating usuario:", error)
      const errorMessage = error.message || "Error al actualizar el usuario. Por favor, intenta nuevamente."
      alert(errorMessage)
    } finally {
      setLoadingAction(false)
    }
  }

  const handleChangeRole = (usuario: Usuario) => {
    setSelectedUsuario(usuario)
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      password: "",
      rol: usuario.rol?.toString() || "",
      telefono: "",
    })
    setShowRoleDialog(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedUsuario) return

    try {
      setLoadingAction(true)
      await api.updateUsuario(selectedUsuario.id, {
        rol: formData.rol ? parseInt(formData.rol) : null,
      })
      setShowRoleDialog(false)
      setSelectedUsuario(null)
      loadUsuarios()
      alert("Rol actualizado exitosamente")
    } catch (error: any) {
      console.error("Error updating role:", error)
      alert(error.message || "Error al actualizar el rol. Por favor, intenta nuevamente.")
    } finally {
      setLoadingAction(false)
    }
  }

  const handleToggleActive = async (usuario: Usuario) => {
    const action = usuario.is_active ? 'desactivar' : 'activar'
    if (!confirm(`¿Estás seguro de que deseas ${action} a ${usuario.nombre} ${usuario.apellido}?\n\nNota: Esto realizará un soft delete (desactivación) para mantener el registro en las auditorías.`)) {
      return
    }

    try {
      setLoadingAction(true)
      const response = await api.toggleActiveUsuario(usuario.id)
      loadUsuarios()
      const message = response?.message || `Usuario ${action}do exitosamente`
      alert(message)
    } catch (error: any) {
      console.error("Error toggling active:", error)
      const errorMessage = error.message || "Error al cambiar el estado del usuario. Por favor, intenta nuevamente."
      alert(errorMessage)
    } finally {
      setLoadingAction(false)
    }
  }

  const getRolColor = (rol?: string) => {
    if (!rol) return "bg-gray-500 text-white"
    
    switch (rol.toLowerCase()) {
      case "administrador":
        return "bg-[#C0217E] text-white"
      case "analista":
        return "bg-[#3259B5] text-white"
      case "consultor":
        return "bg-[#66A29C] text-white"
      case "superusuario":
        return "bg-[#C0217E] text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getEstadoColor = (isActive: boolean) => {
    return isActive ? "bg-[#C3C840] text-[#222A59]" : "bg-gray-400 text-white"
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Nunca"
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)

      if (diffHours < 1) return "Hace menos de 1 hora"
      if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`
      if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
      return date.toLocaleDateString("es-AR")
    } catch {
      return "N/A"
    }
  }

  // Los usuarios ya están filtrados por rol en loadUsuarios, pero aplicamos filtro de búsqueda
  const filteredUsuarios = usuarios.filter((usuario) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      usuario.email.toLowerCase().includes(query) ||
      usuario.nombre.toLowerCase().includes(query) ||
      usuario.apellido.toLowerCase().includes(query) ||
      (usuario.rol_nombre && usuario.rol_nombre.toLowerCase().includes(query))
    )
  })

  const stats = {
    total: usuarios.length,
    activos: usuarios.filter((u) => u.is_active).length,
    administradores: usuarios.filter((u) => 
      u.rol_nombre?.toLowerCase() === 'administrador' || u.rol_nombre?.toLowerCase() === 'superusuario'
    ).length,
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
                    No tienes permisos para acceder a esta página. Solo los administradores pueden gestionar usuarios.
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 md:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Gestión de Usuarios</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">Administra los usuarios del sistema y sus permisos</p>
          </div>
          <Button 
            className="bg-[#3259B5] hover:bg-[#222A59] gap-2"
            onClick={() => {
              setFormData({
                email: "",
                nombre: "",
                apellido: "",
                password: "",
                rol: "",
                telefono: "",
              })
              setShowCreateDialog(true)
            }}
          >
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
                <Input 
                  placeholder="Buscar usuarios..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsuarios.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No se encontraron usuarios</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#3259B5] flex items-center justify-center text-white font-semibold text-sm md:text-base flex-shrink-0">
                        {`${usuario.nombre?.[0] || ''}${usuario.apellido?.[0] || ''}`.toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-[#222A59]">
                          {usuario.nombre} {usuario.apellido}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {usuario.email}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Último acceso: {formatDate(usuario.last_login)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                      <Badge className={getRolColor(usuario.rol_nombre)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {usuario.rol_nombre || 'Sin rol'}
                      </Badge>
                      <Badge className={getEstadoColor(usuario.is_active)}>
                        {usuario.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={loadingAction}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/usuarios/${usuario.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUsuario(usuario)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar usuario
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeRole(usuario)}>
                            <Shield className="h-4 w-4 mr-2" />
                            Cambiar rol
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => handleToggleActive(usuario)}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            {usuario.is_active ? 'Desactivar' : 'Activar'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#222A59]">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#C3C840]">{stats.activos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#C0217E]">{stats.administradores}</div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog para crear usuario */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Completa los datos para crear un nuevo usuario en el sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre"
                />
              </div>
              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  placeholder="Apellido"
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Contraseña"
                />
              </div>
              <div>
                <Label htmlFor="rol">Rol</Label>
                <Select value={formData.rol} onValueChange={(value) => setFormData({ ...formData, rol: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id.toString()}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Teléfono (opcional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateUsuario} 
                disabled={loadingAction || !formData.email || !formData.nombre || !formData.apellido || !formData.password}
                className="bg-[#3259B5] hover:bg-[#3259B5]/90"
              >
                {loadingAction ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Crear Usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar usuario */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Modifica los datos del usuario
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-apellido">Apellido *</Label>
                <Input
                  id="edit-apellido"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Dejar vacío para no cambiar"
                />
              </div>
              <div>
                <Label htmlFor="edit-rol">Rol</Label>
                <Select value={formData.rol} onValueChange={(value) => setFormData({ ...formData, rol: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id.toString()}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-telefono">Teléfono</Label>
                <Input
                  id="edit-telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateUsuario} 
                disabled={loadingAction || !formData.email || !formData.nombre || !formData.apellido}
                className="bg-[#3259B5] hover:bg-[#3259B5]/90"
              >
                {loadingAction ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para cambiar rol */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cambiar Rol</DialogTitle>
              <DialogDescription>
                Selecciona un nuevo rol para {selectedUsuario?.nombre} {selectedUsuario?.apellido}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="role-rol">Rol</Label>
                <Select value={formData.rol} onValueChange={(value) => setFormData({ ...formData, rol: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={rol.id.toString()}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateRole} 
                disabled={loadingAction}
                className="bg-[#3259B5] hover:bg-[#3259B5]/90"
              >
                {loadingAction ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Cambiar Rol
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
