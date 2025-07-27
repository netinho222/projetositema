"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface Despesa {
  id: string
  descricao: string
  valor: number
  data_despesa: string
}

interface DespesaFormProps {
  despesa?: Despesa | null
  onClose: () => void
  onSave: () => void
}

export function DespesaForm({ despesa, onClose, onSave }: DespesaFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data_despesa: new Date().toISOString().split("T")[0],
  })
  const { toast } = useToast()

  useEffect(() => {
    if (despesa) {
      setFormData({
        descricao: despesa.descricao,
        valor: despesa.valor.toString(),
        data_despesa: despesa.data_despesa,
      })
    }
  }, [despesa])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        descricao: formData.descricao,
        valor: Number.parseFloat(formData.valor),
        data_despesa: formData.data_despesa,
      }

      let error
      if (despesa) {
        const result = await supabase.from("despesas").update(data).eq("id", despesa.id)
        error = result.error
      } else {
        const result = await supabase.from("despesas").insert([data])
        error = result.error
      }

      if (error) throw error

      toast({
        title: "Sucesso",
        description: `Despesa ${despesa ? "atualizada" : "cadastrada"} com sucesso`,
      })
      onSave()
    } catch (error) {
      console.error("Erro ao salvar despesa:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a despesa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{despesa ? "Editar Despesa" : "Nova Despesa"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva a despesa..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_despesa">Data</Label>
              <Input
                id="data_despesa"
                type="date"
                value={formData.data_despesa}
                onChange={(e) => setFormData({ ...formData, data_despesa: e.target.value })}
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
