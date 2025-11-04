import { MainLayout } from "@/components/layout/main-layout"
import { CompanyForm } from "@/components/empresas/company-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NuevaEmpresaPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/empresas">
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
