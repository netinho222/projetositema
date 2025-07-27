"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Produto {
  id: string
  nome: string
  preco_custo: number
  preco_venda: number
  categoria: string // Agora é uma string direta
  quantidade_estoque: number // Ainda necessária para ler/exibir produtos existentes
}

interface ProdutoFormProps {
  produto?: Produto | null
  onClose: () => void
  onSave: () => void
}

export function ProdutoForm({ produto, onClose, onSave }: ProdutoFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: "",
    preco_custo: "",
    preco_venda: "",
    categoria_nome: "", // Mantido para o input, mas será mapeado para 'categoria'
  })
  const { toast } = useToast()

  useEffect(() => {
    if (produto) {
      setFormData({
        nome: produto.nome,
        preco_custo: produto.preco_custo.toString(),
        preco_venda: produto.preco_venda.toString(),
        categoria_nome: produto.categoria, // Usa a coluna 'categoria'
      })
    }
  }, [produto])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      let error
      if (produto) {
        // Atualiza produto existente: apenas detalhes do produto, não estoque
        const dataToUpdate = {
          nome: formData.nome,
          preco_custo: Number.parseFloat(formData.preco_custo),
          preco_venda: Number.parseFloat(formData.preco_venda),
          categoria: formData.categoria_nome.trim(), // Usa a coluna 'categoria' diretamente
          // quantidade_estoque não é incluída aqui, é gerenciada por movimentações
        }
        const result = await supabase.from("produtos").update(dataToUpdate).eq("id", produto.id)
        error = result.error
      } else {
        // Insere novo produto: estoque sempre começa com 0
        const dataToInsert = {
          nome: formData.nome,
          preco_custo: Number.parseFloat(formData.preco_custo),
          preco_venda: Number.parseFloat(formData.preco_venda),
          categoria: formData.categoria_nome.trim(), // Usa a coluna 'categoria' diretamente
          quantidade_estoque: 0, // Novos produtos sempre começam com 0 estoque
        }
        const result = await supabase.from("produtos").insert([dataToInsert])
        error = result.error
      }

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Produto ${produto ? "atualizado" : "cadastrado"} com sucesso`,
      })
      onSave()
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar o produto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{produto ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Input
                id="categoria"
                value={formData.categoria_nome}
                onChange={(e) => setFormData({ ...formData, categoria_nome: e.target.value })}
                placeholder="Digite a categoria (ex: Camisetas, Calças, Vestidos...)"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preco_custo">Preço de Custo</Label>
              <Input
                id="preco_custo"
                type="number"
                step="0.01"
                value={formData.preco_custo}
                onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_venda">Preço de Venda</Label>
              <Input
                id="preco_venda"
                type="number"
                step="0.01"
                value={formData.preco_venda}
                onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                required
              />
            </div>
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
