"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Edit, Trash2, AlertTriangle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ProdutoForm } from "@/components/produtos/produto-form"
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
} from "@/components/ui/alert-dialog"

interface Produto {
  id: string
  nome: string
  preco_custo: number
  preco_venda: number
  quantidade_estoque: number
  categoria: string // Agora é uma string direta
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadProdutos()
  }, [])

  async function loadProdutos() {
    try {
      // Seleciona diretamente a coluna 'categoria' da tabela 'produtos'
      const { data, error } = await supabase
        .from("produtos")
        .select("*") // Não precisa mais de `categorias(nome)`
        .order("created_at", { ascending: false })

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
      setLoading(false)
    }
  }

  async function checkProductReferences(produtoId: string) {
    try {
      // Verificar se produto tem vendas
      const { data: vendas, error: vendasError } = await supabase
        .from("itens_venda")
        .select("id")
        .eq("produto_id", produtoId)
        .limit(1)

      if (vendasError) throw vendasError

      // Verificar se produto tem movimentações
      const { data: movimentacoes, error: movError } = await supabase
        .from("movimentacoes_estoque")
        .select("id")
        .eq("produto_id", produtoId)
        .limit(1)

      if (movError) throw movError

      return {
        hasVendas: vendas && vendas.length > 0,
        hasMovimentacoes: movimentacoes && movimentacoes.length > 0,
      }
    } catch (error) {
      console.error("Erro ao verificar referências:", error)
      return { hasVendas: false, hasMovimentacoes: false }
    }
  }

  async function handleDeleteClick(produto: Produto) {
    setProdutoToDelete(produto)
    setDeleteError(null)

    // Verificar se produto pode ser excluído
    const references = await checkProductReferences(produto.id)

    if (references.hasVendas || references.hasMovimentacoes) {
      let errorMessage = "Este produto não pode ser excluído porque está vinculado a:\n"
      if (references.hasVendas) errorMessage += "• Registros de vendas\n"
      if (references.hasMovimentacoes) errorMessage += "• Movimentações de estoque\n"
      errorMessage += "\nPara manter a integridade dos dados históricos, a exclusão foi bloqueada."

      setDeleteError(errorMessage)
    }

    setShowDeleteDialog(true)
  }

  async function confirmDelete() {
    if (!produtoToDelete || deleteError) return

    try {
      const { error } = await supabase.from("produtos").delete().eq("id", produtoToDelete.id)

      if (error) {
        // Tratar erro de foreign key constraint
        if (error.code === "23503") {
          setDeleteError(
            "Este produto não pode ser excluído porque está vinculado a registros existentes.\n\nPara manter a integridade dos dados históricos, a exclusão foi bloqueada.",
          )
          return
        }
        throw error
      }

      setProdutos(produtos.filter((p) => p.id !== produtoToDelete.id))
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso",
      })
      setShowDeleteDialog(false)
      setProdutoToDelete(null)
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto",
        variant: "destructive",
      })
    }
  }

  const filteredProdutos = produtos.filter((produto) => produto.nome.toLowerCase().includes(searchTerm.toLowerCase()))

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Produtos</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
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
        <h1 className="text-3xl font-bold">Produtos</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Pesquisar produtos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de produtos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProdutos.map((produto) => (
          <Card key={produto.id}>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{produto.nome}</h3>
                  {/* Exibe a categoria diretamente da coluna 'categoria' */}
                  <p className="text-sm text-muted-foreground">{produto.categoria}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Custo:</span>
                    <span>R$ {produto.preco_custo.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Venda:</span>
                    <span>R$ {produto.preco_venda.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estoque:</span>
                    <Badge variant={produto.quantidade_estoque > 0 ? "default" : "destructive"}>
                      {produto.quantidade_estoque}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingProduto(produto)
                      setShowForm(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteClick(produto)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProdutos.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal do formulário */}
      {showForm && (
        <ProdutoForm
          produto={editingProduto}
          onClose={() => {
            setShowForm(false)
            setEditingProduto(null)
          }}
          onSave={() => {
            loadProdutos()
            setShowForm(false)
            setEditingProduto(null)
          }}
        />
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {deleteError ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Exclusão Bloqueada
                </>
              ) : (
                <>
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Confirmar Exclusão
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {deleteError ? (
                deleteError
              ) : (
                <>
                  Tem certeza que deseja excluir o produto <strong>"{produtoToDelete?.nome}"</strong>?
                  <br />
                  <br />
                  Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowDeleteDialog(false)
                setProdutoToDelete(null)
                setDeleteError(null)
              }}
            >
              {deleteError ? "Entendi" : "Cancelar"}
            </AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Excluir Produto
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
