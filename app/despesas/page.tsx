"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DespesaForm } from "@/components/despesas/despesa-form"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Despesa {
  id: string
  descricao: string
  valor: number
  data_despesa: string
  created_at: string
}

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null)
  const [deletingDespesa, setDeletingDespesa] = useState<Despesa | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadDespesas()
  }, [])

  async function loadDespesas() {
    try {
      const { data, error } = await supabase.from("despesas").select("*").order("data_despesa", { ascending: false })

      if (error) throw error
      setDespesas(data || [])
    } catch (error) {
      console.error("Erro ao carregar despesas:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as despesas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function deleteDespesa(id: string) {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from("despesas").delete().eq("id", id)

      if (error) throw error

      setDespesas(despesas.filter((d) => d.id !== id))
      toast({
        title: "Sucesso",
        description: "Despesa excluída com sucesso",
      })
    } catch (error) {
      console.error("Erro ao excluir despesa:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a despesa",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setDeletingDespesa(null)
    }
  }

  const filteredDespesas = despesas.filter((despesa) =>
    despesa.descricao.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalDespesas = filteredDespesas.reduce((sum, despesa) => sum + despesa.valor, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Despesas</h1>
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
        <h1 className="text-3xl font-bold">Despesas</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Total de despesas */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total de Despesas:</span>
            <span className="text-2xl font-bold text-red-600">R$ {totalDespesas.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Pesquisar despesas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de despesas */}
      <div className="space-y-4">
        {filteredDespesas.map((despesa) => (
          <Card key={despesa.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold">{despesa.descricao}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(despesa.data_despesa).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-red-600">R$ {despesa.valor.toFixed(2)}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingDespesa(despesa)
                        setShowForm(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Botão de exclusão com AlertDialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setDeletingDespesa(despesa)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-500" />
                            Confirmar Exclusão
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir a despesa{" "}
                            <span className="font-semibold">"{deletingDespesa?.descricao}"</span> no valor de{" "}
                            <span className="font-semibold text-red-600">R$ {deletingDespesa?.valor.toFixed(2)}</span>
                            ?
                            <br />
                            <br />
                            Esta ação não pode ser desfeita e afetará os relatórios financeiros.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeletingDespesa(null)}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => deletingDespesa && deleteDespesa(deletingDespesa.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Excluindo...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Confirmar Exclusão
                              </>
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDespesas.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhuma despesa encontrada" : "Nenhuma despesa cadastrada"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal do formulário */}
      {showForm && (
        <DespesaForm
          despesa={editingDespesa}
          onClose={() => {
            setShowForm(false)
            setEditingDespesa(null)
          }}
          onSave={() => {
            loadDespesas()
            setShowForm(false)
            setEditingDespesa(null)
          }}
        />
      )}
    </div>
  )
}
