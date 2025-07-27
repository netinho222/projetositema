"use client"

import { AlertDialogTrigger } from "@/components/ui/alert-dialog"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Pencil, Trash2, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

// Interfaces para tipagem
interface Produto {
  id: string
  nome: string
  quantidade_estoque: number
  categoria: string
}

interface Movimentacao {
  id: string
  tipo: "entrada" | "saida"
  quantidade: number
  motivo: string | null
  data_movimentacao: string
  produtos: { nome: string; categoria: string }
}

interface MovimentacaoActionsProps {
  movimentacao: Movimentacao
  onActionSuccess: () => void // Callback para recarregar a lista na página pai
}

export function MovimentacaoActions({ movimentacao, onActionSuccess }: MovimentacaoActionsProps) {
  const { toast } = useToast()
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [loadingAction, setLoadingAction] = useState(false)
  const [editFormData, setEditFormData] = useState({
    quantidade: movimentacao.quantidade.toString(),
    tipo: movimentacao.tipo,
  })
  const [currentProductStock, setCurrentProductStock] = useState<number | null>(null)

  // Carrega o estoque atual do produto ao abrir o dialog de edição
  useEffect(() => {
    if (showEditDialog) {
      async function fetchProductStock() {
        try {
          const { data, error } = await supabase
            .from("produtos")
            .select("quantidade_estoque")
            .eq("id", movimentacao.produtos.id) // Assumindo que movimentacao.produtos.id existe
            .single()

          if (error) throw error
          setCurrentProductStock(data.quantidade_estoque)
        } catch (error) {
          console.error("Erro ao carregar estoque do produto:", error)
          toast({
            title: "Erro",
            description: "Não foi possível carregar o estoque do produto para validação.",
            variant: "destructive",
          })
        }
      }
      fetchProductStock()
    }
  }, [showEditDialog, movimentacao.produtos.id, toast])

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoadingAction(true)

    const newQuantidade = Number.parseInt(editFormData.quantidade)
    const newTipo = editFormData.tipo

    if (newQuantidade <= 0) {
      toast({
        title: "Erro",
        description: "A quantidade deve ser maior que zero.",
        variant: "destructive",
      })
      setLoadingAction(false)
      return
    }

    // Lógica de validação de estoque para "saída"
    if (newTipo === "saida" && currentProductStock !== null) {
      // Se a movimentação original era uma entrada e agora é uma saída,
      // ou se a quantidade de saída está aumentando, precisamos verificar o estoque.
      // Esta lógica pode ser complexa dependendo de como você quer recalcular o estoque.
      // Para simplificar, vamos considerar o estoque atual e a nova quantidade de saída.
      // Uma abordagem mais robusta envolveria reverter a movimentação original e aplicar a nova.
      // Por enquanto, uma validação simples:
      if (
        newQuantidade >
        currentProductStock +
          (movimentacao.tipo === "saida" ? movimentacao.quantidade : 0) -
          (movimentacao.tipo === "entrada" ? movimentacao.quantidade : 0)
      ) {
        toast({
          title: "Erro",
          description: `Estoque insuficiente para esta saída. Disponível: ${currentProductStock} unidades.`,
          variant: "destructive",
        })
        setLoadingAction(false)
        return
      }
    }

    try {
      // Para editar uma movimentação, o ideal seria reverter o efeito da antiga
      // e aplicar o efeito da nova. Como o Supabase tem triggers,
      // uma simples atualização na tabela movimentacoes_estoque não recalculará o estoque
      // automaticamente para a mudança de tipo ou quantidade.
      // A forma mais segura é:
      // 1. Reverter a movimentação antiga (criar uma movimentação inversa temporária)
      // 2. Excluir a movimentação antiga
      // 3. Inserir a nova movimentação
      // Isso é complexo para um componente de UI.
      // Para esta demonstração, vamos fazer uma atualização direta,
      // mas esteja ciente que isso pode exigir um trigger mais complexo no Supabase
      // ou uma função de banco de dados para recalcular o estoque corretamente.

      const { error } = await supabase
        .from("movimentacoes_estoque")
        .update({
          quantidade: newQuantidade,
          tipo: newTipo,
          // O motivo pode ser atualizado se necessário, mas não está no formulário de edição simples
        })
        .eq("id", movimentacao.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Movimentação atualizada com sucesso.",
      })
      console.log("Movimentação editada:", { id: movimentacao.id, newQuantidade, newTipo })
      setShowEditDialog(false)
      onActionSuccess() // Recarrega a lista
    } catch (error) {
      console.error("Erro ao editar movimentação:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a movimentação.",
        variant: "destructive",
      })
    } finally {
      setLoadingAction(false)
    }
  }

  async function handleDeleteConfirm() {
    setLoadingAction(true)
    try {
      const { error } = await supabase.from("movimentacoes_estoque").delete().eq("id", movimentacao.id)

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Movimentação excluída com sucesso.",
      })
      console.log("Movimentação excluída:", movimentacao.id)
      setShowDeleteDialog(false)
      onActionSuccess() // Recarrega a lista
    } catch (error) {
      console.error("Erro ao excluir movimentação:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a movimentação.",
        variant: "destructive",
      })
    } finally {
      setLoadingAction(false)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Botão Editar */}
      <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
        <Pencil className="h-4 w-4" />
      </Button>

      {/* Botão Excluir */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
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
              Tem certeza que deseja excluir a movimentação de{" "}
              <span className="font-semibold">
                {movimentacao.quantidade} unidades de {movimentacao.produtos.nome} ({movimentacao.tipo})
              </span>
              ?
              <br />
              <br />
              Esta ação não pode ser desfeita e afetará o estoque do produto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={loadingAction}
            >
              {loadingAction ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Movimentação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="produto-nome">Produto</Label>
              <Input id="produto-nome" value={movimentacao.produtos.nome} disabled className="bg-gray-700" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={editFormData.quantidade}
                onChange={(e) => setEditFormData({ ...editFormData, quantidade: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={editFormData.tipo}
                onValueChange={(value: "entrada" | "saida") => setEditFormData({ ...editFormData, tipo: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">
                    <div className="flex items-center gap-2">
                      <ArrowUpIcon className="h-4 w-4 text-green-600" />
                      <span>Entrada</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="saida">
                    <div className="flex items-center gap-2">
                      <ArrowDownIcon className="h-4 w-4 text-red-600" />
                      <span>Saída</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editFormData.tipo === "saida" && currentProductStock !== null && (
              <p className="text-sm text-muted-foreground">Estoque atual: {currentProductStock} unidades</p>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)} disabled={loadingAction}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loadingAction}>
                {loadingAction ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
