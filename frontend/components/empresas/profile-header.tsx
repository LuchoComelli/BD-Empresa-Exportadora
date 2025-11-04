import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Mail, Phone, Globe, MapPin, Edit, Trash2 } from "lucide-react"

interface ProfileHeaderProps {
  company: {
    name: string
    category: "Exportadora" | "Potencial Exportadora" | "Etapa Inicial"
    score: number
    sector: string
    location: string
    email: string
    phone: string
    website?: string
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Exportadora":
      return "bg-[#C3C840] text-[#222A59]"
    case "Potencial Exportadora":
      return "bg-[#F59E0B] text-white"
    case "Etapa Inicial":
      return "bg-[#629BD2] text-white"
    default:
      return "bg-muted text-foreground"
  }
}

export function ProfileHeader({ company }: ProfileHeaderProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-[#3259B5]/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="h-8 w-8 text-[#3259B5]" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#222A59]">{company.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Badge className={getCategoryColor(company.category)}>{company.category}</Badge>
                <span className="text-sm font-semibold text-[#3259B5]">Puntaje: {company.score}/18</span>
                <span className="text-sm text-muted-foreground">{company.sector}</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {company.location}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {company.email}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {company.phone}
                </div>
                {company.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#3259B5]"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 bg-transparent">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
