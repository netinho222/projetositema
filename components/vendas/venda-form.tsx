"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Produto {
  id: string
  nome: string
  preco_venda: number
  quantidade_estoque: number
}

interface ItemVenda {
  produto_id: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

interface VendaFormProps {
  onClose: () => void
  onSave: () => void
}

export function VendaForm({ onClose, onSave }: VendaFormProps) {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(false)
  const [itens, setItens] = useState<ItemVenda[]>([])
  const [formData, setFormData] = useState({
    data_venda: new Date().toISOString().split("T")[0],
    forma_pagamento: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadProdutos()
  }, [])

  async function loadProdutos() {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, preco_venda, quantidade_estoque")
        .gt("quantidade_estoque", 0)
        .order("nome")

      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    }
  }

  function addItem() {
    setItens([
      ...itens,
      {
        produto_id: "",
        quantidade: 1,
        preco_unitario: 0,
        subtotal: 0,
      },
    ])
  }

  function removeItem(index: number) {
    setItens(itens.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof ItemVenda, value: string | number) {
    const newItens = [...itens]
    newItens[index] = { ...newItens[index], [field]: value }

    if (field === "produto_id") {
      const produto = produtos.find((p) => p.id === value)
      if (produto) {
        newItens[index].preco_unitario = produto.preco_venda
        newItens[index].subtotal = newItens[index].quantidade * produto.preco_venda
      }
    } else if (field === "quantidade" || field === "preco_unitario") {
      newItens[index].subtotal = newItens[index].quantidade * newItens[index].preco_unitario
    }

    setItens(newItens)
  }

  const valorTotal = itens.reduce((sum, item) => sum + item.subtotal, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (itens.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item à venda",
        variant: "destructive",
      })
      return
    }

    // Verificar estoque
    for (const item of itens) {
      const produto = produtos.find((p) => p.id === item.produto_id)
      if (produto && item.quantidade > produto.quantidade_estoque) {
        toast({
          title: "Erro",
          description: `Estoque insuficiente para ${produto.nome}`,
          variant: "destructive",
        })
        return
      }
    }

    setLoading(true)

    try {
      // Criar venda
      const { data: venda, error: vendaError } = await supabase
        .from("vendas")
        .insert([
          {
            data_venda: formData.data_venda,
            valor_total: valorTotal,
            forma_pagamento: formData.forma_pagamento,
          },
        ])
        .select()
        .single()

      if (vendaError) throw vendaError

      // Criar itens da venda
      const itensVenda = itens.map((item) => ({
        venda_id: venda.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal,
      }))

      const { error: itensError } = await supabase.from("itens_venda").insert(itensVenda)

      if (itensError) throw itensError

      toast({
        title: "Sucesso",
        description: "Venda registrada com sucesso",
      })
      onSave()
    } catch (error) {
      console.error("Erro ao salvar venda:", error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a venda",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Venda</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_venda">Data da Venda</Label>
              <Input
                id="data_venda"
                type="date"
                value={formData.data_venda}
                onChange={(e) => setFormData({ ...formData, data_venda: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Itens da venda */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Itens da Venda</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {itens.map((item, index) => {
              const produto = produtos.find((p) => p.id === item.produto_id)
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label>Produto</Label>
                        <Select
                          value={item.produto_id}
                          onValueChange={(value) => updateItem(index, "produto_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {produtos.map((produto) => (
                              <SelectItem key={produto.id} value={produto.id}>
                                {produto.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2">
                        <Label>Qtd</Label>
                        <Input
                          type="number"
                          min="1"
                          max={produto?.quantidade_estoque || 999}
                          value={item.quantidade}
                          onChange={(e) => updateItem(index, "quantidade", Number.parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>Preço</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.preco_unitario}
                          onChange={(e) => updateItem(index, "preco_unitario", Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>Subtotal</Label>
                        <div className="h-10 flex items-center">
                          <Badge variant="outline">R$ {item.subtotal.toFixed(2)}</Badge>
                        </div>
                      </div>

                      <div className="col-span-1">
                        <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {produto && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Estoque disponível: {produto.quantidade_estoque} unidades
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Total */}
          {itens.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total da Venda:</span>
                  <span className="text-2xl font-bold text-green-600">R$ {valorTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || itens.length === 0}>
              {loading ? "Salvando..." : "Finalizar Venda"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
