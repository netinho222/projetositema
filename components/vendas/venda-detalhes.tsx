"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

interface VendaDetalhes {
  id: string
  data_venda: string
  valor_total: number
  forma_pagamento: string
  itens_venda: Array<{
    quantidade: number
    preco_unitario: number
    subtotal: number
    produtos: {
      nome: string
    }
  }>
}

interface VendaDetalhesProps {
  vendaId: string
  onClose: () => void
}

export function VendaDetalhes({ vendaId, onClose }: VendaDetalhesProps) {
  const [venda, setVenda] = useState<VendaDetalhes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVendaDetalhes()
  }, [vendaId])

  async function loadVendaDetalhes() {
    try {
      const { data, error } = await supabase
        .from("vendas")
        .select(`
          *,
          itens_venda(
            quantidade,
            preco_unitario,
            subtotal,
            produtos(nome)
          )
        `)
        .eq("id", vendaId)
        .single()

      if (error) throw error
      setVenda(data)
    } catch (error) {
      console.error("Erro ao carregar detalhes da venda:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!venda) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          <p className="text-center text-muted-foreground py-8">Venda não encontrada</p>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda #{venda.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações da venda */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Data:</span>
                <span>{new Date(venda.data_venda).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex justify-between">
                <span>Forma de Pagamento:</span>
                <Badge variant="outline">{venda.forma_pagamento}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Valor Total:</span>
                <span className="text-xl font-bold text-green-600">R$ {venda.valor_total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Itens da venda */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Itens da Venda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {venda.itens_venda.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.produtos.nome}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.quantidade}x R$ {item.preco_unitario.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">R$ {item.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
