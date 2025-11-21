"use client"

import type React from "react"

import { useState } from "react"
import { Header } from "./header"
import { Sidebar } from "./sidebar"
import { Footer } from "./footer"
import { Toaster } from "@/components/ui/toaster"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 pt-16 md:pt-20 relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-64 bg-[#F3F4F6] p-4 md:p-6">
          {children}
        </main>
      </div>
      <Footer showImage={false} />
      <Toaster />
    </div>
  )
}
