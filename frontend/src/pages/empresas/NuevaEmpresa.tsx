import { Link } from "react-router-dom"
import { MainLayout } from "@/components/layout/MainLayout"
import { CompanyForm } from "@/components/empresas/CompanyForm"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NuevaEmpresa() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/empresas">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-[#222A59]">Nueva Empresa</h1>
            <p className="text-muted-foreground mt-1">Complete el formulario para registrar una nueva empresa</p>
          </div>
        </div>

        <CompanyForm />
      </div>
    </MainLayout>
  )
}