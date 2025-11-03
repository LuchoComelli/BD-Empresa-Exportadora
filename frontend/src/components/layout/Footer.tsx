export function Footer() {
  return (
    <footer className="lg:ml-64 bg-[#222A59] text-white py-6 mt-auto border-t border-[#1b234a]">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Texto institucional */}
          <div className="text-center md:text-left">
            <p className="text-sm font-medium">Ministerio de Desarrollo Productivo</p>
            <p className="text-xs text-white/70">Provincia de Catamarca - Argentina</p>
          </div>

          {/* Enlaces */}
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

        {/* Derechos reservados */}
        <div className="mt-4 text-center text-xs text-white/60">
          © {new Date().getFullYear()} Ministerio de Desarrollo Productivo - Catamarca. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
