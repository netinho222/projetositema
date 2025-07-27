"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Produto {
  id: string
  nome: string
  quantidade_estoque: number
  categoria?: string
}

interface MovimentacaoFormProps {
  onClose: () => void
  onSave: () => void
}

export function MovimentacaoForm({ onClose, onSave }: MovimentacaoFormProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    produto_id: "",
    tipo: "" as "entrada" | "saida" | "",
    quantidade: "",
    motivo: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadProdutos()
  }, [])

  async function loadProdutos() {
    try {
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
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const quantidade = Number.parseInt(formData.quantidade)
      const produto = produtos.find((p) => p.id === formData.produto_id)

      // Verificar se há estoque suficiente para saída
      if (formData.tipo === "saida" && produto && quantidade > produto.quantidade_estoque) {
        toast({
          title: "Erro",
          description: "Quantidade insuficiente em estoque",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("movimentacoes_estoque").insert([
        {
          produto_id: formData.produto_id,
          tipo: formData.tipo,
          quantidade: quantidade,
          motivo: formData.motivo || null,
        },
      ])

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso",
      })
      onSave()
    } catch (error) {
      console.error("Erro ao salvar movimentação:", error)
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Movimentação de Estoque</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="produto">Produto</Label>
            <Select
              value={formData.produto_id}
              onValueChange={(value) => setFormData({ ...formData, produto_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto..." />
              </SelectTrigger>
              <SelectContent>
                {produtos.map((produto) => (
                  <SelectItem key={produto.id} value={produto.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{produto.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {produto.categoria} • Estoque: {produto.quantidade_estoque}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: "entrada" | "saida") => setFormData({ ...formData, tipo: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={formData.quantidade}
                onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                required
              />
            </div>
          </div>

          {selectedProduto && formData.tipo === "saida" && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">Estoque atual: {selectedProduto.quantidade_estoque} unidades</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo (opcional)</Label>
            <Textarea
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              placeholder="Descreva o motivo da movimentação..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
