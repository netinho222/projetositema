"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Star, Mail, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DM_Serif_Display } from "next/font/google"

// Configura a fonte DM Serif Display
const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif-display",
})

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email || !password) {
      setError("Por favor, preencha todos os campos.")
      setLoading(false)
      return
    }

    // Simulação de autenticação simples
    if (email === "admin@example.com" && password === "password123") {
      localStorage.setItem("isLoggedIn", "true") // Define um flag no localStorage
      toast({
        title: "Sucesso!",
        description: "Login realizado com sucesso. Redirecionando...",
      })
      router.push("/") // Redireciona para o dashboard
    } else {
      setError("Email ou senha incorretos.")
      toast({
        title: "Erro de Login",
        description: "Email ou senha incorretos.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-dark-gradient-via to-black flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-dark-surface/80 backdrop-blur-md rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-center mb-6">
          <Star className="text-orange-accent w-6 h-6 mr-2" />
          <h1 className={`text-3xl font-bold text-orange-accent ${dmSerifDisplay.className}`}>Elarion</h1>
        </div>
        <p className="text-center text-muted-foreground mb-6">Acesse sua conta para continuar</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-white block mb-1">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-muted-foreground w-5 h-5" />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 bg-dark-background text-white border border-dark-border focus:border-vibrant-blue focus:ring-vibrant-blue focus:ring-opacity-50 transition-all duration-200"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-white block mb-1">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-muted-foreground w-5 h-5" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 bg-dark-background text-white border border-dark-border focus:border-vibrant-blue focus:ring-vibrant-blue focus:ring-opacity-50 transition-all duration-200"
              />
            </div>
          </div>

          {error && <p className="text-sm text-vibrant-ruby text-center">{error}</p>}

          <Button
            type="submit"
            className="w-full bg-orange-accent hover:bg-orange-600 text-white font-semibold text-base mt-4 py-3 rounded-md transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-orange-accent focus:ring-opacity-75"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <a
            href="#"
            className="text-sm text-muted-foreground hover:underline hover:text-text-light transition-colors duration-200"
          >
            Esqueceu a senha?
          </a>
        </div>
      </div>
    </div>
  )
}
