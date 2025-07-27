"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { MovimentacaoForm } from "@/components/estoque/movimentacao-form"
import { MovimentacaoActions } from "@/components/estoque/movimentacao-actions" // Importa o novo componente
import { useToast } from "@/hooks/use-toast"

interface Movimentacao {
  id: string
  tipo: "entrada" | "saida"
  quantidade: number
  motivo: string | null
  data_movimentacao: string
  produtos: { id: string; nome: string; categoria: string } // Adicionado 'id' para MovimentacaoActions
}

export default function EstoquePage() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFilter, setTipoFilter] = useState<string>("todos")
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadMovimentacoes()
  }, [])

  async function loadMovimentacoes() {
    try {
      const { data, error } = await supabase
        .from("movimentacoes_estoque")
        .select(`
          *,
          produtos!inner(
            id,
            nome,
            categoria
          )
        `)
        .order("data_movimentacao", { ascending: false })

      if (error) throw error
      setMovimentacoes(data || [])
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as movimentações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredMovimentacoes = movimentacoes.filter((mov) => {
    const matchesSearch =
      mov.produtos.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.produtos.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mov.motivo && mov.motivo.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = tipoFilter === "todos" || mov.tipo === tipoFilter

    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Controle de Estoque</h1>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Controle de Estoque</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Movimentação
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Pesquisar movimentações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de movimentações */}
      <div className="space-y-4">
        {filteredMovimentacoes.map((mov) => (
          <Card key={mov.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {mov.tipo === "entrada" ? (
                    <ArrowUpIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowDownIcon className="h-5 w-5 text-red-600" />
                  )}

                  <div>
                    <h3 className="font-semibold">{mov.produtos.nome}</h3>
                    <p className="text-sm text-muted-foreground">{mov.produtos.categoria}</p>
                    <p className="text-sm text-muted-foreground">
                      {mov.motivo || (mov.tipo === "entrada" ? "Entrada de estoque" : "Saída de estoque")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(mov.data_movimentacao).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  {" "}
                  {/* Adicionado flex-col e items-end */}
                  <Badge variant={mov.tipo === "entrada" ? "default" : "destructive"} className="text-lg px-3 py-1">
                    {mov.tipo === "entrada" ? "+" : "-"}
                    {mov.quantidade}
                  </Badge>
                  <MovimentacaoActions movimentacao={mov} onActionSuccess={loadMovimentacoes} /> {/* Novo componente */}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMovimentacoes.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm || tipoFilter !== "todos"
                ? "Nenhuma movimentação encontrada"
                : "Nenhuma movimentação registrada"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal do formulário */}
      {showForm && (
        <MovimentacaoForm
          onClose={() => setShowForm(false)}
          onSave={() => {
            loadMovimentacoes()
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}
