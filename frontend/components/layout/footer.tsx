export function Footer() {
  return (
    <footer className="bg-[#222A59] text-white py-6 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm font-medium">Dirección de Intercambio Comercial Internacional y Regional</p>
            <p className="text-xs text-white/70">Provincia de Catamarca - Argentina</p>
          </div>
          <div className="flex gap-6 text-xs">
            <a href="#" className="hover:text-white/80 transition-colors">
              Términos y Condiciones
            </a>
            <a href="#" className="hover:text-white/80 transition-colors">
              Política de Privacidad
            </a>
            <a href="#" className="hover:text-white/80 transition-colors">
              Contacto
            </a>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Todos los derechos reservados
        </div>
      </div>
    </footer>
  )
}
