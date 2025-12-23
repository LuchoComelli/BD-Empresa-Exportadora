"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle2, AlertCircle, Lock, Eye, EyeOff } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function ResetPasswordPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [tokenError, setTokenError] = useState("")
  
  // Validaciones
  const hasMinLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0
  const isFormValid = hasMinLength && hasUpperCase && passwordsMatch

  useEffect(() => {
    if (!token) {
      setTokenError("Token no válido. Por favor, solicita un nuevo enlace de recuperación.")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!password || !confirmPassword) {
      setError("Por favor, completa todos los campos")
      return
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError("La contraseña debe contener al menos una letra mayúscula")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (!token) {
      setError("Token no válido")
      return
    }

    setIsLoading(true)

    try {
      const response = await api.resetearPassword(token, password)
      
      if (response && response.message) {
        setIsSuccess(true)
        toast({
          title: "Contraseña restablecida",
          description: "Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.",
          variant: "default",
        })
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      }
    } catch (error: any) {
      console.error("Error reseteando contraseña:", error)
      const errorMessage = error?.errorData?.error || 
                          error?.errorData?.detail || 
                          error?.message || 
                          "Error al restablecer la contraseña. Por favor, intenta nuevamente."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#222A59] via-[#3259B5] to-[#629BD2] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 md:mb-8">
            <div className="mb-0">
              <Link href="/" className="inline-flex p-0 hover:opacity-90 transition-opacity w-fit h-fit">
                <div className="relative w-24 h-24 md:w-32 md:h-32">
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
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Restablecer Contraseña</h1>
            <p className="text-sm md:text-base text-white/90">Dirección de Intercambio Comercial Internacional y Regional</p>
            <p className="text-xs md:text-sm text-white/80">Provincia de Catamarca</p>
          </div>
          <Card className="p-6 md:p-8 shadow-2xl">
            <div className="text-center py-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 md:w-10 md:h-10 text-red-600" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">Token Inválido</h2>
              <p className="text-sm md:text-base text-[#6B7280] mb-4 md:mb-6">
                {tokenError}
              </p>
              <Link href="/recuperar-contrasena">
                <Button className="w-full sm:w-auto bg-[#3259B5] hover:bg-[#3259B5]/90 text-white font-semibold">
                  Solicitar Nuevo Enlace
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#222A59] via-[#3259B5] to-[#629BD2] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 md:mb-8">
          <div className="mb-0">
            <Link href="/" className="inline-flex p-0 hover:opacity-90 transition-opacity w-fit h-fit">
              <div className="relative w-24 h-24 md:w-32 md:h-32">
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
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Restablecer Contraseña</h1>
          <p className="text-sm md:text-base text-white/90">Dirección de Intercambio Comercial Internacional y Regional</p>
          <p className="text-xs md:text-sm text-white/80">Provincia de Catamarca</p>
        </div>

          <Card className="p-6 md:p-8 shadow-2xl">
            <div className="text-center py-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#C3C840]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-[#C3C840]" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">¡Contraseña Restablecida!</h2>
              <p className="text-sm md:text-base text-[#6B7280] mb-4 md:mb-6">
                Tu contraseña ha sido restablecida exitosamente. Serás redirigido al inicio de sesión en unos segundos.
              </p>
              <Link href="/login">
                <Button className="w-full sm:w-auto bg-[#3259B5] hover:bg-[#3259B5]/90 text-white font-semibold">
                  Ir al Inicio de Sesión
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#222A59] via-[#3259B5] to-[#629BD2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <div className="mb-0">
            <Link href="/" className="inline-flex p-0 hover:opacity-90 transition-opacity w-fit h-fit">
              <div className="relative w-24 h-24 md:w-32 md:h-32">
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
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Restablecer Contraseña</h1>
          <p className="text-sm md:text-base text-white/90">Dirección de Intercambio Comercial Internacional y Regional</p>
          <p className="text-xs md:text-sm text-white/80">Provincia de Catamarca</p>
        </div>

        <Card className="p-6 md:p-8 shadow-2xl">
          <div className="mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">Nueva Contraseña</h2>
            <p className="text-sm md:text-base text-[#6B7280]">
              Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres y una letra mayúscula.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-[#222A59]">
                Nueva Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-[#6B7280]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="pl-10 pr-10 border-gray-300 focus:border-[#3259B5] focus:ring-[#3259B5]"
                  placeholder="Nueva contraseña"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError("")
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#6B7280] hover:text-[#222A59]"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-[#222A59]">
                Confirmar Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-[#6B7280]" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="pl-10 pr-10 border-gray-300 focus:border-[#3259B5] focus:ring-[#3259B5]"
                  placeholder="Confirma tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setError("")
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-[#6B7280] hover:text-[#222A59]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-[#6B7280] hover:text-[#222A59]"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#3259B5] hover:bg-[#3259B5]/90 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !isFormValid}
            >
              {isLoading ? "Restableciendo..." : "Restablecer Contraseña"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-[#3259B5] hover:text-[#3259B5]/80 font-medium">
              Volver al inicio de sesión
            </Link>
          </div>
        </Card>

        <div className="text-center mt-4 md:mt-6">
          <Link href="/" className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors text-sm md:text-base">
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

