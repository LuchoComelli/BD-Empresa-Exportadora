import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  category: 'Exportadora' | 'Potencial Exportadora' | 'Etapa Inicial';
  location: string;
  score: number;
  date: string;
}

const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Vitivinícola del Valle S.A.',
    category: 'Exportadora',
    location: 'Capital',
    score: 16,
    date: '2024-01-15',
  },
  {
    id: '2',
    name: 'Textiles Andinos',
    category: 'Potencial Exportadora',
    location: 'Andalgalá',
    score: 9,
    date: '2024-01-14',
  },
  {
    id: '3',
    name: 'Alimentos Orgánicos del Norte',
    category: 'Exportadora',
    location: 'Belén',
    score: 15,
    date: '2024-01-13',
  },
  {
    id: '4',
    name: 'Artesanías Catamarqueñas',
    category: 'Etapa Inicial',
    location: 'Santa María',
    score: 4,
    date: '2024-01-12',
  },
  {
    id: '5',
    name: 'Minerales del Oeste',
    category: 'Potencial Exportadora',
    location: 'Tinogasta',
    score: 8,
    date: '2024-01-11',
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

export function RecentCompaniesTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-ministerio-navy text-lg md:text-xl">Empresas Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Empresa
                </th>
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Ubicación
                </th>
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Categoría
                </th>
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Puntaje
                </th>
                <th className="text-left py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Fecha
                </th>
                <th className="text-right py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-ministerio-navy">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {mockCompanies.map((company, index) => (
                <tr key={company.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium text-gray-900">
                    {company.name}
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-ministerio-gray">
                    {company.location}
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4">
                    <Badge className={`${getCategoryColor(company.category)} text-xs`}>{company.category}</Badge>
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-semibold text-ministerio-navy">
                    {company.score}/18
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-ministerio-gray">
                    {new Date(company.date).toLocaleDateString('es-AR')}
                  </td>
                  <td className="py-2 md:py-3 px-2 md:px-4 text-right">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-3 w-3 md:h-4 md:w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}