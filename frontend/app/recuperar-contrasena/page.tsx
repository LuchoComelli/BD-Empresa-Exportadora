"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    console.log("[v0] Password recovery requested for:", email)

    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#222A59] via-[#3259B5] to-[#629BD2] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 md:mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <Building2 className="w-8 h-8 md:w-10 md:h-10 text-[#222A59]" />
            </div>
          </Link>
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
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
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
