import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { name: 'Agroindustria', value: 85, color: '#3259B5' },
  { name: 'Textil', value: 45, color: '#C3C840' },
  { name: 'Minería', value: 38, color: '#66A29C' },
  { name: 'Alimentos', value: 52, color: '#807DA1' },
  { name: 'Artesanías', value: 26, color: '#EB7DBF' },
];

export function SectorDistribution() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-ministerio-navy">Distribución por Sector</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}