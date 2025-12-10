import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

/**
 * Hook para proteger páginas del dashboard
 * Verifica que el usuario esté autenticado y tenga permisos para acceder
 */
export function useDashboardAuth() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Si no hay usuario, redirigir al login
        router.push("/login")
        return
      }
      
      // Verificar si el usuario tiene permiso para acceder al dashboard
      const canAccessDashboard = 
        user.is_superuser || 
        user.type === "admin" || 
        user.type === "staff" ||
        user.rol?.nombre?.toLowerCase().includes("admin") ||
        user.rol?.nombre?.toLowerCase().includes("administrador") ||
        user.rol?.nombre?.toLowerCase().includes("analista") ||
        user.rol?.nombre?.toLowerCase().includes("consulta") ||
        user.rol?.nombre?.toLowerCase().includes("consultor")
      
      if (!canAccessDashboard) {
        // Si no tiene permiso, redirigir al perfil de empresa
        router.push("/perfil-empresa")
        return
      }
    }
  }, [user, isLoading, router])

  // Función helper para verificar permisos
  const canAccessDashboard = 
    user?.is_superuser || 
    user?.type === "admin" || 
    user?.type === "staff" ||
    user?.rol?.nombre?.toLowerCase().includes("admin") ||
    user?.rol?.nombre?.toLowerCase().includes("administrador") ||
    user?.rol?.nombre?.toLowerCase().includes("analista") ||
    user?.rol?.nombre?.toLowerCase().includes("consulta") ||
    user?.rol?.nombre?.toLowerCase().includes("consultor") || false

  return {
    user,
    isLoading,
    canAccessDashboard,
  }
}

/**
 * Helper para manejar errores de autenticación silenciosamente
 */
export function handleAuthError(error: any): boolean {
  const errorMessage = error?.message || String(error)
  const isNoAuthError = error?.noAuth || 
                        error?.silent ||
                        error?.status === 401 ||
                        errorMessage.includes('No hay sesión activa') ||
                        errorMessage.includes('credenciales') || 
                        errorMessage.includes('autenticación') || 
                        errorMessage.includes('401') ||
                        errorMessage.includes('Sesión expirada')
  
  if (isNoAuthError) {
    // Error de autenticación - no mostrar en consola
    return true
  }
  
  // Otro tipo de error - mostrar en consola
  console.error("Error:", error)
  return false
}

