"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Eye, Trash2 } from "lucide-react" // Removed AlertTriangle as it's not needed for blocking
import { supabase } from "@/lib/supabase"
import { VendaForm } from "@/components/vendas/venda-form"
import { VendaDetalhes } from "@/components/vendas/venda-detalhes"
import { useToast } from "@/hooks/use-toast"
import {
  // Import AlertDialog components
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Venda {
  id: string
  data_venda: string
  valor_total: number
  forma_pagamento: string
  created_at: string
}

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [selectedVenda, setSelectedVenda] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false) // State for delete dialog
  const [vendaToDelete, setVendaToDelete] = useState<Venda | null>(null) // State for sale to delete
  const { toast } = useToast()

  useEffect(() => {
    loadVendas()
  }, [])

  async function loadVendas() {
    try {
      const { data, error } = await supabase.from("vendas").select("*").order("data_venda", { ascending: false })

      if (error) throw error
      setVendas(data || [])
    } catch (error) {
      console.error("Erro ao carregar vendas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as vendas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleDeleteClick(venda: Venda) {
    setVendaToDelete(venda)
    setShowDeleteDialog(true)
  }

  async function confirmDelete() {
    if (!vendaToDelete) return

    try {
      const { error } = await supabase.from("vendas").delete().eq("id", vendaToDelete.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Venda excluída com sucesso",
      })
      loadVendas() // Refresh the list after deletion
      setShowDeleteDialog(false)
      setVendaToDelete(null)
    } catch (error) {
      console.error("Erro ao excluir venda:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a venda",
        variant: "destructive",
      })
    }
  }

  const filteredVendas = vendas.filter(
    (venda) =>
      venda.forma_pagamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      new Date(venda.data_venda).toLocaleDateString("pt-BR").includes(searchTerm),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Vendas</h1>
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
        <h1 className="text-3xl font-bold">Vendas</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Pesquisar vendas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de vendas */}
      <div className="space-y-4">
        {filteredVendas.map((venda) => (
          <Card key={venda.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Venda #{venda.id.slice(0, 8)}</h3>
                    <Badge variant="outline">{venda.forma_pagamento}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(venda.data_venda).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">R$ {venda.valor_total.toFixed(2)}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setSelectedVenda(venda.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteClick(venda)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVendas.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhuma venda encontrada" : "Nenhuma venda registrada"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal do formulário */}
      {showForm && (
        <VendaForm
          onClose={() => setShowForm(false)}
          onSave={() => {
            loadVendas()
            setShowForm(false)
          }}
        />
      )}

      {/* Modal de detalhes */}
      {selectedVenda && <VendaDetalhes vendaId={selectedVenda} onClose={() => setSelectedVenda(null)} />}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a venda de <strong>R$ {vendaToDelete?.valor_total.toFixed(2)}</strong>{" "}
              realizada em{" "}
              <strong>
                {vendaToDelete?.data_venda ? new Date(vendaToDelete.data_venda).toLocaleDateString("pt-BR") : ""}
              </strong>
              ?
              <br />
              <br />
              Esta ação não pode ser desfeita e removerá automaticamente todos os itens associados a esta venda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false)
                setVendaToDelete(null)
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Excluir Venda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
