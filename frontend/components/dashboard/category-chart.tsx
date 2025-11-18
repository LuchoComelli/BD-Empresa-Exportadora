"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface CategoryChartProps {
  stats?: {
    exportadoras: number
    potencial_exportadora: number
    etapa_inicial: number
  } | null
}

export function CategoryChart({ stats }: CategoryChartProps) {
  const data = [
    {
      name: "Exportadora",
      cantidad: stats?.exportadoras || 0,
      fill: "#C3C840",
    },
    {
      name: "Potencial",
      cantidad: stats?.potencial_exportadora || 0,
      fill: "#F59E0B",
    },
    {
      name: "Etapa Inicial",
      cantidad: stats?.etapa_inicial || 0,
      fill: "#629BD2",
    },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#222A59] text-base md:text-lg">Empresas por Categoría</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px] md:h-[350px]">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: "10px" }} className="text-xs md:text-sm" />
            <YAxis stroke="#6B7280" style={{ fontSize: "10px" }} className="text-xs md:text-sm" />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="cantidad" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
