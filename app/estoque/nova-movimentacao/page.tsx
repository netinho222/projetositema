"use client"

import { NovaMovimentacaoForm } from "@/components/estoque/nova-movimentacao-form"

export default function NovaMovimentacaoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nova Movimentação</h1>
        <p className="text-muted-foreground mt-2">Registre entradas e saídas de produtos no estoque</p>
      </div>

      <NovaMovimentacaoForm />
    </div>
  )
}
