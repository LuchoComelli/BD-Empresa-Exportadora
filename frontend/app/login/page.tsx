"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    console.log("[v0] Login attempt:", formData.email)

    const success = await login(formData.email, formData.password)

    if (!success) {
      setError("Credenciales inválidas. Por favor, verifica tu correo y contraseña.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#222A59] via-[#3259B5] to-[#629BD2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 md:w-10 md:h-10 text-[#222A59]" />
            </div>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Bienvenido</h1>
          <p className="text-sm md:text-base text-white/90">Dirección de Intercambio Comercial Internacional y Regional</p>
          <p className="text-xs md:text-sm text-white/80">Provincia de Catamarca</p>
        </div>

        <Card className="p-6 md:p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">Iniciar Sesión</h2>
            <p className="text-sm md:text-base text-[#6B7280]">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-[#222A59] text-sm md:text-base">
                Correo Electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 md:h-5 md:w-5 text-[#6B7280]" />
                <Input
                  id="email"
                  type="email"
                  required
                  className="pl-9 md:pl-10 border-gray-300 focus:border-[#3259B5] focus:ring-[#3259B5] text-sm md:text-base"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-[#222A59] text-sm md:text-base">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 md:h-5 md:w-5 text-[#6B7280]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="pl-9 md:pl-10 pr-10 border-gray-300 focus:border-[#3259B5] focus:ring-[#3259B5] text-sm md:text-base"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-[#6B7280] hover:text-[#222A59]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 md:h-5 md:w-5" />
                  ) : (
                    <Eye className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.remember}
                  onCheckedChange={(checked) => setFormData({ ...formData, remember: checked as boolean })}
                />
                <span className="text-[#6B7280]">Recordarme</span>
              </label>
              <Link href="/recuperar-contrasena" className="text-[#3259B5] hover:text-[#3259B5]/80 font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#3259B5] hover:bg-[#3259B5]/90 text-white font-semibold text-sm md:text-base"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6B7280]">
              ¿No tienes una cuenta?{" "}
              <Link href="/registro" className="text-[#3259B5] font-semibold hover:text-[#3259B5]/80">
                Registra tu empresa
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-[#6B7280]">¿Necesitas ayuda? Contacta a soporte técnico</p>
            <p className="text-xs text-center text-[#3259B5] font-medium mt-1 break-all">
              soporte@desarrolloproductivo.catamarca.gob.ar
            </p>
          </div>
        </Card>

        <div className="text-center mt-4 md:mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors text-sm md:text-base"
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
