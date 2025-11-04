import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: string
}

export function StatsCard({ title, value, icon: Icon, trend, color = "#3259B5" }: StatsCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs md:text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl md:text-3xl font-bold text-[#222A59] mt-1 md:mt-2">{value}</p>
            {trend && (
              <p
                className={`text-xs md:text-sm mt-1 md:mt-2 ${trend.isPositive ? "text-[#C3C840]" : "text-[#C0217E]"}`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% vs mes anterior
              </p>
            )}
          </div>
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-6 w-6 md:h-7 md:w-7" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
