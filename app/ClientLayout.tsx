"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "@/components/ui/toaster"
import LoginPage from "@/app/login/page" // Importa LoginPage diretamente

const inter = Inter({ subsets: ["latin"] })

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const loggedInStatus = localStorage.getItem("isLoggedIn") === "true"
    setIsLoggedIn(loggedInStatus)
    setLoading(false)

    // Redireciona para manter a URL sincronizada com o estado de login
    if (!loggedInStatus && pathname !== "/login") {
      router.replace("/login") // Usa replace para evitar adicionar ao histórico
    } else if (loggedInStatus && pathname === "/login") {
      router.replace("/")
    }
  }, [pathname, router]) // Não precisa incluir isLoggedIn nas dependências aqui, pois o estado é lido e a renderização é baseada nele.

  // Exibe o spinner de carregamento até que o status de login seja determinado
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-dark-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  // Se não estiver logado, sempre renderiza o componente LoginPage
  if (!isLoggedIn) {
    return (
      <html lang="pt-BR" className="dark">
        <head>
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body>
          <div className={inter.className}>
            <LoginPage /> {/* Renderiza LoginPage diretamente */}
            <Toaster />
          </div>
        </body>
      </html>
    )
  }

  // Se estiver logado, renderiza o layout principal do aplicativo
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <div className={inter.className}>
          <div className="flex h-screen bg-gray-50 dark:bg-dark-background">
            <Sidebar />
            <main className="flex-1 overflow-auto lg:ml-0">
              <div className="p-4 lg:p-8 pt-16 lg:pt-8">{children}</div>
            </main>
          </div>
          <Toaster />
        </div>
      </body>
    </html>
  )
}
