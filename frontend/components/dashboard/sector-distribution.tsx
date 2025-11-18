"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

interface SectorDistributionProps {
  stats?: {
    tipo_producto: number
    tipo_servicio: number
    tipo_mixta: number
  } | null
}

export function SectorDistribution({ stats }: SectorDistributionProps) {
  const data = [
    { name: "Productos", value: stats?.tipo_producto || 0, color: "#3259B5" },
    { name: "Servicios", value: stats?.tipo_servicio || 0, color: "#C3C840" },
    { name: "Mixta", value: stats?.tipo_mixta || 0, color: "#66A29C" },
  ]
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#222A59] text-base md:text-lg">Distribución por Sector</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <ResponsiveContainer width="100%" height={250} className="sm:h-[300px] md:h-[350px]">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} className="sm:outerRadius-[100px]" fill="#8884d8" dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
