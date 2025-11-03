import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Company {
  id: string;
  name: string;
  category: 'Exportadora' | 'Potencial Exportadora' | 'Etapa Inicial';
  sector: string;
  location: string;
  score: number;
  email: string;
  phone: string;
}

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Vitivinícola del Valle S.A.',
    category: 'Exportadora',
    sector: 'Agroindustria',
    location: 'Capital',
    score: 16,
    email: 'contacto@vitivinicola.com',
    phone: '+54 383 4123456',
  },
  {
    id: '2',
    name: 'Textiles Andinos',
    category: 'Potencial Exportadora',
    sector: 'Textil',
    location: 'Andalgalá',
    score: 9,
    email: 'info@textilesandinos.com',
    phone: '+54 383 4234567',
  },
  {
    id: '3',
    name: 'Alimentos Orgánicos del Norte',
    category: 'Exportadora',
    sector: 'Alimentos',
    location: 'Belén',
    score: 15,
    email: 'ventas@alimentosnorte.com',
    phone: '+54 383 4345678',
  },
  {
    id: '4',
    name: 'Artesanías Catamarqueñas',
    category: 'Etapa Inicial',
    sector: 'Artesanías',
    location: 'Santa María',
    score: 4,
    email: 'artesanias@catamarca.com',
    phone: '+54 383 4456789',
  },
  {
    id: '5',
    name: 'Minerales del Oeste',
    category: 'Potencial Exportadora',
    sector: 'Minería',
    location: 'Tinogasta',
    score: 8,
    email: 'contacto@mineralesoeste.com',
    phone: '+54 383 4567890',
  },
  {
    id: '6',
    name: 'Aceites Esenciales Catamarca',
    category: 'Exportadora',
    sector: 'Agroindustria',
    location: 'Capital',
    score: 14,
    email: 'info@aceitesesenciales.com',
    phone: '+54 383 4678901',
  },
  {
    id: '7',
    name: 'Tejidos Tradicionales',
    category: 'Etapa Inicial',
    sector: 'Textil',
    location: 'Belén',
    score: 5,
    email: 'tejidos@tradicionales.com',
    phone: '+54 383 4789012',
  },
  {
    id: '8',
    name: 'Frutas Deshidratadas del Valle',
    category: 'Potencial Exportadora',
    sector: 'Alimentos',
    location: 'Tinogasta',
    score: 10,
    email: 'ventas@frutasdelvalle.com',
    phone: '+54 383 4890123',
  },
];

function getCategoryColor(category: Company['category']) {
  switch (category) {
    case 'Exportadora':
      return 'bg-ministerio-yellow text-ministerio-navy';
    case 'Potencial Exportadora':
      return 'bg-orange-500 text-white';
    case 'Etapa Inicial':
      return 'bg-ministerio-light-blue text-white';
  }
}

export function CompaniesTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(mockCompanies.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCompanies = mockCompanies.slice(startIndex, endIndex);

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-blue-50">
              <tr>
                <th className="text-left py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Empresa
                </th>
                <th className="text-left py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Sector
                </th>
                <th className="text-left py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Ubicación
                </th>
                <th className="text-left py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Categoría
                </th>
                <th className="text-left py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Puntaje
                </th>
                <th className="text-left py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Contacto
                </th>
                <th className="text-right py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {currentCompanies.map((company, index) => (
                <tr key={company.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-3 md:py-4 px-3 md:px-6">
                    <div className="font-medium text-gray-900 text-sm">{company.name}</div>
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-ministerio-gray">
                    {company.sector}
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6 text-xs md:text-sm text-ministerio-gray">
                    {company.location}
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6">
                    <Badge className={`${getCategoryColor(company.category)} text-xs`}>{company.category}</Badge>
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6">
                    <span className="text-xs md:text-sm font-semibold text-ministerio-navy">{company.score}/18</span>
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6">
                    <div className="text-xs md:text-sm text-ministerio-gray">
                      <div className="truncate max-w-[150px]">{company.email}</div>
                      <div>{company.phone}</div>
                    </div>
                  </td>
                  <td className="py-3 md:py-4 px-3 md:px-6">
                    <div className="flex items-center justify-end gap-1 md:gap-2">
                      <Link to={`/empresas/${company.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-3 w-3 md:h-4 md:w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 gap-3">
          <div className="text-xs md:text-sm text-ministerio-gray">
            Mostrando {startIndex + 1} a {Math.min(endIndex, mockCompanies.length)} de {mockCompanies.length} empresas
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="text-xs md:text-sm"
            >
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`text-xs md:text-sm ${currentPage === page ? 'bg-ministerio-blue' : ''}`}
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="text-xs md:text-sm"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}