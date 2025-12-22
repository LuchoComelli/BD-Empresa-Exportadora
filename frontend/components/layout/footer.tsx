"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import api from "@/lib/api"

interface Configuracion {
  institucion: string
  email_contacto: string
  telefono: string
}

interface FooterProps {
  showImage?: boolean
}

export function Footer({ showImage = true }: FooterProps) {
  const [configuracion, setConfiguracion] = useState<Configuracion | null>(null)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await api.getConfiguracion()
        setConfiguracion(data)
      } catch (error) {
        console.error("Error cargando configuración para footer:", error)
        // Valores por defecto si falla la carga
        setConfiguracion({
          institucion: "Dirección de Intercambio Comercial Internacional y Regional",
          email_contacto: "contacto@catamarca.gob.ar",
          telefono: "+54 383 4123456"
        })
      }
    }
    loadConfig()
  }, [])

  const institucion = configuracion?.institucion || "Dirección de Intercambio Comercial Internacional y Regional"

  return (
    <footer className="w-full bg-[#222A59] text-white py-4 md:py-6 z-50 relative">
      <div className="w-full px-2 sm:px-4 md:px-6">
        {showImage && (
          <div className="flex flex-col items-center gap-4 md:gap-6 mb-4 md:mb-6">
            <div className="relative w-full max-w-4xl h-auto">
              <Image
                src="/footer.png"
                alt="Footer Catamarca"
                width={1200}
                height={300}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
          <div className="text-center md:text-left w-full md:w-auto">
            <p className="text-xs sm:text-sm font-medium break-words">{institucion}</p>
            <p className="text-xs text-white/70 mt-1">Provincia de Catamarca - Argentina</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-6 text-xs w-full md:w-auto">
            <a href="#" className="hover:text-white/80 transition-colors whitespace-nowrap">
              Términos y Condiciones
            </a>
            <a href="#" className="hover:text-white/80 transition-colors whitespace-nowrap">
              Política de Privacidad
            </a>
            <a href="#" className="hover:text-white/80 transition-colors whitespace-nowrap">
              Contacto
            </a>
          </div>
        </div>
        <div className="mt-3 md:mt-4 text-center text-xs text-white/60 px-2">
          © {new Date().getFullYear()} Todos los derechos reservados
        </div>
      </div>
    </footer>
  )
}
