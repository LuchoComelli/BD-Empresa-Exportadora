import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Building2, Globe, Award, ArrowRight, BarChart3 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-ministerio-navy sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 md:w-7 md:h-7 text-ministerio-navy" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm md:text-lg font-bold text-white truncate">
                Ministerio de Desarrollo Productivo
              </h1>
              <p className="text-xs text-white/80 hidden sm:block">Provincia de Catamarca</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Link to="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/10 text-xs md:text-sm"
              >
                <span className="hidden sm:inline">Iniciar Sesión</span>
                <span className="sm:hidden">Login</span>
              </Button>
            </Link>
            <Link to="/registro">
              <Button
                size="sm"
                className="bg-ministerio-yellow hover:bg-ministerio-yellow/90 text-ministerio-navy font-semibold text-xs md:text-sm"
              >
                <span className="hidden sm:inline">Registrar Empresa</span>
                <span className="sm:hidden">Registro</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-ministerio-navy mb-4 md:mb-6 text-balance">
            Impulsa tu Empresa hacia el Mercado Internacional
          </h2>
          <p className="text-base md:text-xl text-ministerio-gray mb-6 md:mb-8 text-pretty leading-relaxed px-2">
            Registra tu empresa en nuestro sistema y accede a herramientas de evaluación, capacitación y apoyo para
            convertirte en exportador
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <Link to="/registro" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-ministerio-blue hover:bg-ministerio-blue/90 text-white text-base md:text-lg px-6 md:px-8"
              >
                Comenzar Ahora
                <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
            <a href="#beneficios" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 border-2 border-ministerio-blue text-ministerio-blue hover:bg-ministerio-blue/5 bg-transparent"
              >
                Conocer Más
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-ministerio-navy py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center text-white">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">150+</div>
              <div className="text-xs md:text-sm text-white/80">Empresas Registradas</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">45</div>
              <div className="text-xs md:text-sm text-white/80">Empresas Exportadoras</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">12</div>
              <div className="text-xs md:text-sm text-white/80">Países de Destino</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">$2.5M</div>
              <div className="text-xs md:text-sm text-white/80">Valor Exportado</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="container mx-auto px-4 py-12 md:py-20 bg-ministerio-light-gray">
        <div className="text-center mb-8 md:mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-ministerio-navy mb-3 md:mb-4">
            ¿Por qué registrar tu empresa?
          </h3>
          <p className="text-base md:text-lg text-ministerio-gray max-w-2xl mx-auto px-4">
            Accede a beneficios exclusivos y herramientas diseñadas para impulsar tu crecimiento
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <Card className="p-5 md:p-6 hover:shadow-lg transition-shadow border-2 hover:border-ministerio-blue/20 bg-white">
            <div className="w-12 h-12 bg-ministerio-yellow/10 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-ministerio-yellow" />
            </div>
            <h4 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-ministerio-navy">
              Evaluación de Perfil Exportador
            </h4>
            <p className="text-sm md:text-base text-ministerio-gray leading-relaxed">
              Conoce tu nivel de preparación para exportar mediante nuestra matriz de clasificación
            </p>
          </Card>
          <Card className="p-5 md:p-6 hover:shadow-lg transition-shadow border-2 hover:border-ministerio-blue/20 bg-white">
            <div className="w-12 h-12 bg-ministerio-light-blue/10 rounded-lg flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-ministerio-light-blue" />
            </div>
            <h4 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-ministerio-navy">
              Acceso a Mercados Internacionales
            </h4>
            <p className="text-sm md:text-base text-ministerio-gray leading-relaxed">
              Conecta con oportunidades de exportación y participa en ferias internacionales
            </p>
          </Card>
          <Card className="p-5 md:p-6 hover:shadow-lg transition-shadow border-2 hover:border-ministerio-blue/20 bg-white">
            <div className="w-12 h-12 bg-ministerio-purple/10 rounded-lg flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-ministerio-purple" />
            </div>
            <h4 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-ministerio-navy">
              Capacitación y Asesoramiento
            </h4>
            <p className="text-sm md:text-base text-ministerio-gray leading-relaxed">
              Recibe apoyo técnico y capacitación para mejorar tu capacidad exportadora
            </p>
          </Card>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-white py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-ministerio-navy mb-3 md:mb-4">
              Proceso de Registro
            </h3>
            <p className="text-base md:text-lg text-ministerio-gray max-w-2xl mx-auto px-4">
              Tres simples pasos para comenzar tu camino exportador
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-ministerio-blue text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-lg md:text-xl font-semibold mb-2 text-ministerio-navy">Registra tu Empresa</h4>
              <p className="text-sm md:text-base text-ministerio-gray leading-relaxed px-4">
                Completa el formulario con la información de tu empresa y productos
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-ministerio-yellow text-ministerio-navy rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-lg md:text-xl font-semibold mb-2 text-ministerio-navy">Evaluación de Perfil</h4>
              <p className="text-sm md:text-base text-ministerio-gray leading-relaxed px-4">
                Nuestro equipo evaluará tu perfil exportador y te asignará una categoría
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-ministerio-light-blue text-white rounded-full flex items-center justify-center text-xl md:text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-lg md:text-xl font-semibold mb-2 text-ministerio-navy">Accede a Beneficios</h4>
              <p className="text-sm md:text-base text-ministerio-gray leading-relaxed px-4">
                Comienza a recibir apoyo personalizado según tu nivel de desarrollo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <Card className="bg-gradient-to-r from-ministerio-navy to-ministerio-blue p-8 md:p-12 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">¿Listo para dar el siguiente paso?</h3>
          <p className="text-base md:text-xl mb-6 md:mb-8 text-white/90 max-w-2xl mx-auto leading-relaxed px-2">
            Únete a las empresas catamarqueñas que ya están exportando al mundo
          </p>
          <Link to="/registro">
            <Button
              size="lg"
              className="bg-ministerio-yellow hover:bg-ministerio-yellow/90 text-ministerio-navy font-semibold text-base md:text-lg px-6 md:px-8"
            >
              Registrar mi Empresa
              <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </Link>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-ministerio-navy text-white py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">
                Ministerio de Desarrollo Productivo
              </h4>
              <p className="text-white/80 text-sm leading-relaxed">
                Impulsando el desarrollo económico y la competitividad de las empresas catamarqueñas
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Contacto</h4>
              <p className="text-white/80 text-sm mb-2">San Martín 320, San Fernando del Valle de Catamarca</p>
              <p className="text-white/80 text-sm mb-2">(0383) 4437390</p>
              <p className="text-white/80 text-sm">info@desarrolloproductivo.catamarca.gob.ar</p>
            </div>
            <div>
              <h4 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Enlaces Útiles</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Iniciar Sesión
                  </Link>
                </li>
                <li>
                  <Link to="/registro" className="hover:text-white transition-colors">
                    Registrar Empresa
                  </Link>
                </li>
                <li>
                  <a href="#beneficios" className="hover:text-white transition-colors">
                    Beneficios
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-6 md:pt-8 text-center text-xs md:text-sm text-white/80">
            <p>© 2025 Ministerio de Desarrollo Productivo - Provincia de Catamarca. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}