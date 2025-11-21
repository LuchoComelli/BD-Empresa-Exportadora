"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { Globe, Award, ArrowRight, BarChart3 } from "lucide-react"
import api from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

export default function HomePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    total_empresas_registradas: 0,
    total_empresas_exportadoras: 0,
  })
  const [configuracion, setConfiguracion] = useState({
    institucion: "Dirección de Intercambio Comercial Internacional y Regional",
    email_contacto: "info@desarrolloproductivo.catamarca.gob.ar",
    telefono: "(0383) 4437390",
    direccion: "San Martín 320, San Fernando del Valle de Catamarca",
    paises_destino: 12,
    valor_exportado: "$2.5M",
    beneficio1_titulo: "Evaluación de Perfil Exportador",
    beneficio1_descripcion: "Conoce tu nivel de preparación para exportar mediante nuestra matriz de clasificación",
    beneficio2_titulo: "Acceso a Mercados Internacionales",
    beneficio2_descripcion: "Conecta con oportunidades de exportación y participa en ferias internacionales",
    beneficio3_titulo: "Capacitación y Asesoramiento",
    beneficio3_descripcion: "Recibe apoyo técnico y capacitación para mejorar tu capacidad exportadora"
  })
  const [loading, setLoading] = useState(true)
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!carouselApi) {
      return
    }

    setCurrent(carouselApi.selectedScrollSnap())

    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap())
    })
  }, [carouselApi])

  // Autoplay del carrusel
  useEffect(() => {
    if (!carouselApi) return

    const interval = setInterval(() => {
      carouselApi.scrollNext()
    }, 5000) // Cambiar cada 5 segundos

    return () => clearInterval(interval)
  }, [carouselApi])

  useEffect(() => {
    loadStats()
    loadConfiguracion()
  }, [])

  const loadConfiguracion = async () => {
    try {
      const data = await api.getConfiguracion()
      setConfiguracion({
        institucion: data.institucion || "Dirección de Intercambio Comercial Internacional y Regional",
        email_contacto: data.email_contacto || "info@desarrolloproductivo.catamarca.gob.ar",
        telefono: data.telefono || "(0383) 4437390",
        direccion: data.direccion || "San Martín 320, San Fernando del Valle de Catamarca",
        paises_destino: data.paises_destino || 12,
        valor_exportado: data.valor_exportado || "$2.5M",
        beneficio1_titulo: data.beneficio1_titulo || "Evaluación de Perfil Exportador",
        beneficio1_descripcion: data.beneficio1_descripcion || "Conoce tu nivel de preparación para exportar mediante nuestra matriz de clasificación",
        beneficio2_titulo: data.beneficio2_titulo || "Acceso a Mercados Internacionales",
        beneficio2_descripcion: data.beneficio2_descripcion || "Conecta con oportunidades de exportación y participa en ferias internacionales",
        beneficio3_titulo: data.beneficio3_titulo || "Capacitación y Asesoramiento",
        beneficio3_descripcion: data.beneficio3_descripcion || "Recibe apoyo técnico y capacitación para mejorar tu capacidad exportadora"
      })
    } catch (error) {
      console.error("Error cargando configuración:", error)
      // Mantener valores por defecto en caso de error
    }
  }

  const loadStats = async () => {
    try {
      const data = await api.getPublicStats()
      setStats({
        total_empresas_registradas: data.total_empresas_registradas || 0,
        total_empresas_exportadoras: data.total_empresas_exportadoras || 0,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
      // Mantener valores por defecto en caso de error
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-[#222A59] sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-2 md:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
              <div className="relative w-32 h-10 md:w-40 md:h-12 max-h-[40px] md:max-h-[48px]">
                <Image
                  src="/logo.png"
                  alt="Logo Catamarca"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm md:text-lg font-bold text-white truncate">Dirección de Intercambio Comercial Internacional y Regional</h1>
            </div>
          </div>
          {!user && (
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-white hover:bg-white/10 text-xs md:text-sm"
                >
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                  <span className="sm:hidden">Login</span>
                </Button>
              </Link>
              <Link href="/registro">
                <Button
                  size="sm"
                  className="bg-[#C3C840] hover:bg-[#C3C840]/90 text-[#222A59] font-semibold text-xs md:text-sm"
                >
                  <span className="hidden sm:inline">Registrar Empresa</span>
                  <span className="sm:hidden">Registro</span>
                </Button>
              </Link>
            </div>
          )}
          {user && (
            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              <Link href="/dashboard">
                <Button
                  size="sm"
                  className="bg-[#C3C840] hover:bg-[#C3C840]/90 text-[#222A59] font-semibold text-xs md:text-sm"
                >
                  <span className="hidden sm:inline">Ir al Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <section className="relative w-full h-[350px] md:h-[400px] lg:h-[450px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full h-full"
          >
            <CarouselContent className="h-full">
              <CarouselItem className="h-full pl-0">
                <div className="relative w-full h-[350px] md:h-[400px] lg:h-[450px]">
                  <Image
                    src="/foto1.jpg"
                    alt="Catamarca - Uvas"
                    fill
                    className="object-cover"
                    priority
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                </div>
              </CarouselItem>
              <CarouselItem className="h-full pl-0">
                <div className="relative w-full h-[350px] md:h-[400px] lg:h-[450px]">
                  <Image
                    src="/foto2.jpeg"
                    alt="Catamarca - Aceitunas"
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                </div>
              </CarouselItem>
              <CarouselItem className="h-full pl-0">
                <div className="relative w-full h-[350px] md:h-[400px] lg:h-[450px]">
                  <Image
                    src="/foto3.jpeg"
                    alt="Catamarca - Artesanía"
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>

        {/* Contenido del hero sobre el carrusel */}
        <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 text-balance drop-shadow-lg">
              Impulsa tu Empresa hacia el Mercado Internacional
            </h2>
            <p className="text-base md:text-xl text-white/95 mb-6 md:mb-8 text-pretty leading-relaxed px-2 drop-shadow-md">
              Registra tu empresa en nuestro sistema y accede a herramientas de evaluación, capacitación y apoyo para
              convertirte en exportador
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
              <Link href="/registro" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#3259B5] hover:bg-[#3259B5]/90 text-white text-base md:text-lg px-6 md:px-8 shadow-lg"
                >
                  Comenzar Ahora
                  <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </Link>
              <Link href="#beneficios" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 border-2 border-white text-white hover:bg-white/10 bg-white/5 backdrop-blur-sm"
                >
                  Conocer Más
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#222A59] py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center text-white">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                {loading ? '...' : stats.total_empresas_registradas}
              </div>
              <div className="text-xs md:text-sm text-white/80">Empresas Registradas</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                {loading ? '...' : stats.total_empresas_exportadoras}
              </div>
              <div className="text-xs md:text-sm text-white/80">Empresas Exportadoras</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">{configuracion.paises_destino}</div>
              <div className="text-xs md:text-sm text-white/80">Países de Destino</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">{configuracion.valor_exportado}</div>
              <div className="text-xs md:text-sm text-white/80">Valor Exportado</div>
            </div>
          </div>
        </div>
      </section>

      <section id="beneficios" className="container mx-auto px-4 py-12 md:py-20 bg-[#F3F4F6]">
        <div className="text-center mb-8 md:mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-[#222A59] mb-3 md:mb-4">¿Por qué registrar tu empresa?</h3>
          <p className="text-base md:text-lg text-[#6B7280] max-w-2xl mx-auto px-4">
            Accede a beneficios exclusivos y herramientas diseñadas para impulsar tu crecimiento
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <Card className="p-5 md:p-6 hover:shadow-lg transition-shadow border-2 hover:border-[#3259B5]/20 bg-white">
            <div className="w-12 h-12 bg-[#C3C840]/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-[#C3C840]" />
            </div>
            <h4 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-[#222A59]">
              {configuracion.beneficio1_titulo}
            </h4>
            <p className="text-sm md:text-base text-[#6B7280] leading-relaxed">
              {configuracion.beneficio1_descripcion}
            </p>
          </Card>
          <Card className="p-5 md:p-6 hover:shadow-lg transition-shadow border-2 hover:border-[#3259B5]/20 bg-white">
            <div className="w-12 h-12 bg-[#629BD2]/10 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-[#629BD2]" />
            </div>
            <h4 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-[#222A59]">
              {configuracion.beneficio2_titulo}
            </h4>
            <p className="text-sm md:text-base text-[#6B7280] leading-relaxed">
              {configuracion.beneficio2_descripcion}
            </p>
          </Card>
          <Card className="p-5 md:p-6 hover:shadow-lg transition-shadow border-2 hover:border-[#3259B5]/20 bg-white">
            <div className="w-12 h-12 bg-[#807DA1]/10 rounded-lg flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-[#807DA1]" />
            </div>
            <h4 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-[#222A59]">
              {configuracion.beneficio3_titulo}
            </h4>
            <p className="text-sm md:text-base text-[#6B7280] leading-relaxed">
              {configuracion.beneficio3_descripcion}
            </p>
          </Card>
        </div>
      </section>

      <section className="bg-white py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-[#222A59] mb-3 md:mb-4">Proceso de Registro</h3>
            <p className="text-base md:text-lg text-[#6B7280] max-w-2xl mx-auto px-4">
              Tres simples pasos para comenzar tu camino exportador
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-[#3259B5] text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-lg md:text-xl font-semibold mb-2 text-[#222A59]">Registra tu Empresa</h4>
              <p className="text-sm md:text-base text-[#6B7280] leading-relaxed px-4">
                Completa el formulario con la información de tu empresa y productos
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-[#C3C840] text-[#222A59] rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-lg md:text-xl font-semibold mb-2 text-[#222A59]">Evaluación de Perfil</h4>
              <p className="text-sm md:text-base text-[#6B7280] leading-relaxed px-4">
                Nuestro equipo evaluará tu perfil exportador y te asignará una categoría
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-[#629BD2] text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-lg md:text-xl font-semibold mb-2 text-[#222A59]">Accede a Beneficios</h4>
              <p className="text-sm md:text-base text-[#6B7280] leading-relaxed px-4">
                Comienza a recibir apoyo personalizado según tu nivel de desarrollo
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-20">
        <Card className="bg-gradient-to-r from-[#222A59] to-[#3259B5] p-8 md:p-12 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">¿Listo para dar el siguiente paso?</h3>
          <p className="text-base md:text-xl mb-6 md:mb-8 text-white/90 max-w-2xl mx-auto leading-relaxed px-2">
            Únete a las empresas catamarqueñas que ya están exportando al mundo
          </p>
          <Link href="/registro">
            <Button
              size="lg"
              className="bg-[#C3C840] hover:bg-[#C3C840]/90 text-[#222A59] font-semibold text-base md:text-lg px-6 md:px-8"
            >
              Registrar mi Empresa
              <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </Link>
        </Card>
      </section>

      <footer className="bg-[#222A59] text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 md:gap-6 mb-6 md:mb-8">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">{configuracion.institucion}</h4>
              <p className="text-white/80 text-sm leading-relaxed">
                Impulsando el desarrollo económico y la competitividad de las empresas catamarqueñas
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Contacto</h4>
              <p className="text-white/80 text-sm mb-2">{configuracion.direccion}</p>
              <p className="text-white/80 text-sm mb-2">{configuracion.telefono}</p>
              <p className="text-white/80 text-sm">{configuracion.email_contacto}</p>
            </div>
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Enlaces Útiles</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Iniciar Sesión
                  </Link>
                </li>
                <li>
                  <Link href="/registro" className="hover:text-white transition-colors">
                    Registrar Empresa
                  </Link>
                </li>
                <li>
                  <Link href="#beneficios" className="hover:text-white transition-colors">
                    Beneficios
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-6 md:pt-8 text-center text-xs md:text-sm text-white/80">
            <p>© {new Date().getFullYear()} {configuracion.institucion} - Provincia de Catamarca. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
