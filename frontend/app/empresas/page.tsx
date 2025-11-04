"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { FiltersSidebar } from "@/components/empresas/filters-sidebar"
import { CompaniesTable } from "@/components/empresas/companies-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Download } from "lucide-react"
import Link from "next/link"

export default function EmpresasPage() {
  const [filters, setFilters] = useState({})
  const [searchQuery, setSearchQuery] = useState("")

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters })
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#222A59]">Empresas</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Gestión de empresas exportadoras</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <Button variant="outline" className="gap-2 bg-transparent text-sm">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button className="gap-2 bg-[#3259B5] hover:bg-[#222A59] text-sm" asChild>
              <Link href="/empresas/nueva">
                <Plus className="h-4 w-4" />
                Nueva Empresa
              </Link>
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar empresas..."
            className="pl-9 md:pl-10 text-sm md:text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Filters Sidebar - hidden on mobile by default */}
          <div className="hidden lg:block lg:col-span-1">
            <FiltersSidebar onFilterChange={handleFilterChange} onClearFilters={handleClearFilters} />
          </div>

          {/* Companies Table */}
          <div className="lg:col-span-3">
            <CompaniesTable />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
