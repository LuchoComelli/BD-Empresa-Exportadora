"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function RecuperarContrasenaPage() {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await api.solicitarRecuperacionPassword(email)
      
      if (response && response.message) {
        setIsSubmitted(true)
        toast({
          title: "Email enviado",
          description: response.message || "Se han enviado las instrucciones para restablecer tu contraseña a tu correo electrónico.",
          variant: "default",
        })
      }
    } catch (error: any) {
      // Ignorar errores silenciosos de "No hay sesión activa" para endpoints públicos
      if (error?.silent && error?.noAuth) {
        // Este error se puede ignorar para endpoints públicos
        // El backend debería devolver 200 si todo está bien
        console.warn("Error de autenticación ignorado para endpoint público:", error)
        return
      }
      
      console.error("Error solicitando recuperación:", error)
      const errorMessage = error?.errorData?.error || 
                          error?.errorData?.detail || 
                          error?.message || 
                          "Error al enviar el email. Por favor, intenta nuevamente."
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
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Recuperar Contraseña</h1>
          <p className="text-sm md:text-base text-white/90">Dirección de Intercambio Comercial Internacional y Regional</p>
          <p className="text-xs md:text-sm text-white/80">Provincia de Catamarca</p>
        </div>

        <Card className="p-6 md:p-8 shadow-2xl">
          {!isSubmitted ? (
            <>
              <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">¿Olvidaste tu contraseña?</h2>
                <p className="text-sm md:text-base text-[#6B7280]">
                  Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-[#222A59]">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-[#6B7280]" />
                    <Input
                      id="email"
                      type="email"
                      required
                      className="pl-10 border-gray-300 focus:border-[#3259B5] focus:ring-[#3259B5]"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError("")
                      }}
                    />
                  </div>
                  {error && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#3259B5] hover:bg-[#3259B5]/90 text-white font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar Instrucciones"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-[#3259B5] hover:text-[#3259B5]/80 font-medium">
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[#C3C840]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-[#C3C840]" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-[#222A59] mb-2">¡Correo Enviado!</h2>
              <p className="text-sm md:text-base text-[#6B7280] mb-4 md:mb-6 break-words">
                Hemos enviado las instrucciones para restablecer tu contraseña a{" "}
                <strong className="text-[#222A59]">{email}</strong>
              </p>
              <p className="text-xs md:text-sm text-[#6B7280] mb-4 md:mb-6">
                Si no recibes el correo en los próximos minutos, revisa tu carpeta de spam o correo no deseado.
              </p>
              <Link href="/login">
                <Button className="w-full sm:w-auto bg-[#3259B5] hover:bg-[#3259B5]/90 text-white font-semibold">
                  Volver al Inicio de Sesión
                </Button>
              </Link>
            </div>
          )}
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
