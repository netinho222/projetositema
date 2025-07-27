"use client"

import { useEffect } from "react"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Package, Plus, Minus } from "lucide-react"

interface Produto {
  id: string
  nome: string
  quantidade_estoque: number
  categoria: string // Atualizado: categoria é uma string direta
}

interface MovimentacaoData {
  produto_id: string
  quantidade: number
  tipo: "entrada" | "saida"
}

export function NovaMovimentacaoForm() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingProdutos, setLoadingProdutos] = useState(true)
  const [formData, setFormData] = useState({
    produto_id: "",
    quantidade: "",
    tipo: "" as "" | "entrada" | "saida",
  })
  const { toast } = useToast()

  useEffect(() => loadProdutos(), [])

  async function loadProdutos() {
    try {
      setLoadingProdutos(true)
      const { data, error } = await supabase
        .from("produtos")
        .select(`
          id, 
          nome, 
          quantidade_estoque,
          categoria
        `)
        .order("nome")

      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive",
      })
    } finally {
      setLoadingProdutos(false)
    }
  }

  async function salvarMovimentacao(data: MovimentacaoData) {
    try {
      const { error } = await supabase.from("movimentacoes_estoque").insert([
        {
          produto_id: data.produto_id,
          tipo: data.tipo,
          quantidade: data.quantidade,
          motivo: `${data.tipo === "entrada" ? "Entrada" : "Saída"} manual de estoque`,
        },
      ])

      if (error) throw error

      console.log("Movimentação salva", data)
      return true
    } catch (error) {
      console.error("Erro ao salvar movimentação:", error)
      throw error
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.produto_id || !formData.quantidade || !formData.tipo) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    const quantidade = Number.parseInt(formData.quantidade)
    if (quantidade <= 0) {
      toast({
        title: "Erro",
        description: "A quantidade deve ser maior que zero",
        variant: "destructive",
      })
      return
    }

    // Verificar estoque para saídas
    if (formData.tipo === "saida") {
      const produto = produtos.find((p) => p.id === formData.produto_id)
      if (produto && quantidade > produto.quantidade_estoque) {
        toast({
          title: "Erro",
          description: `Estoque insuficiente. Disponível: ${produto.quantidade_estoque} unidades`,
          variant: "destructive",
        })
        return
      }
    }

    setLoading(true)

    try {
      await salvarMovimentacao({
        produto_id: formData.produto_id,
        quantidade: quantidade,
        tipo: formData.tipo,
      })

      // Limpar formulário
      setFormData({
        produto_id: "",
        quantidade: "",
        tipo: "",
      })

      // Recarregar produtos para atualizar estoque
      await loadProdutos()

      // Notificação de sucesso
      toast({
        title: "Sucesso!",
        description: `${formData.tipo === "entrada" ? "Entrada" : "Saída"} de ${quantidade} unidades registrada com sucesso`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar a movimentação",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedProduto = produtos.find((p) => p.id === formData.produto_id)

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Nova Movimentação de Estoque
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção do Produto */}
          <div className="space-y-2">
            <Label htmlFor="produto_id">Produto *</Label>
            <Select
              value={formData.produto_id}
              onValueChange={(value) => setFormData({ ...formData, produto_id: value })}
              disabled={loadingProdutos}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProdutos ? "Carregando produtos..." : "Selecione um produto"} />
              </SelectTrigger>
              <SelectContent>
                {produtos.map((produto) => (
                  <SelectItem key={produto.id} value={produto.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{produto.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {produto.categoria} • Estoque atual: {produto.quantidade_estoque} {/* Usa produto.categoria */}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Movimentação */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Movimentação *</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value: "entrada" | "saida") => setFormData({ ...formData, tipo: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    <span>Entrada</span>
                  </div>
                </SelectItem>
                <SelectItem value="saida">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-600" />
                    <span>Saída</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quantidade */}
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade *</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              value={formData.quantidade}
              onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
              placeholder="Digite a quantidade"
            />
          </div>

          {/* Informações do produto selecionado */}
          {selectedProduto && (
            <div
              className={`p-4 rounded-lg border ${
                formData.tipo === "saida" && Number.parseInt(formData.quantidade) > selectedProduto.quantidade_estoque
                  ? "bg-red-50 border-red-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{selectedProduto.nome}</p>
                  <p className="text-sm text-muted-foreground">{selectedProduto.categoria}</p>{" "}
                  {/* Usa selectedProduto.categoria */}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Estoque atual</p>
                  <p className="text-lg font-bold">{selectedProduto.quantidade_estoque} unidades</p>
                </div>
              </div>

              {formData.tipo === "saida" &&
                Number.parseInt(formData.quantidade) > selectedProduto.quantidade_estoque && (
                  <p className="text-red-600 text-sm mt-2 font-medium">⚠️ Quantidade insuficiente em estoque</p>
                )}
            </div>
          )}

          {/* Botão de envio */}
          <Button type="submit" className="w-full" disabled={loading || loadingProdutos}>
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Salvando...
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Registrar Movimentação
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
