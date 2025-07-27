import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  publicSchema: {
    Tables: {
      categorias: {
        Row: {
          id: string
          nome: string
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          created_at?: string
        }
      }
      produtos: {
        Row: {
          id: string
          nome: string
          preco_custo: number
          preco_venda: number
          categoria: string // Atualizado: agora é uma string direta
          quantidade_estoque: number
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          preco_custo: number
          preco_venda: number
          categoria: string // Atualizado: agora é uma string direta
          quantidade_estoque?: number // Made optional for insert, will default to 0
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          preco_custo?: number
          preco_venda?: number
          categoria?: string // Atualizado: agora é uma string direta
          quantidade_estoque?: number // Still present for updates via trigger
          created_at?: string
        }
      }
      movimentacoes_estoque: {
        Row: {
          id: string
          produto_id: string
          tipo: "entrada" | "saida"
          quantidade: number
          motivo: string | null
          data_movimentacao: string
          created_at: string
        }
        Insert: {
          id?: string
          produto_id: string
          tipo: "entrada" | "saida"
          quantidade: number
          motivo?: string | null
          data_movimentacao?: string
          created_at?: string
        }
        Update: {
          id?: string
          produto_id?: string
          tipo?: "entrada" | "saida"
          quantidade?: number
          motivo?: string | null
          data_movimentacao?: string
          created_at?: string
        }
      }
      vendas: {
        Row: {
          id: string
          data_venda: string
          valor_total: number
          forma_pagamento: string
          created_at: string
        }
        Insert: {
          id?: string
          data_venda: string
          valor_total: number
          forma_pagamento: string
          created_at?: string
        }
        Update: {
          id?: string
          data_venda?: string
          valor_total?: number
          forma_pagamento?: string
          created_at?: string
        }
      }
      itens_venda: {
        Row: {
          id: string
          venda_id: string
          produto_id: string
          quantidade: number
          preco_unitario: number
          subtotal: number
        }
        Insert: {
          id?: string
          venda_id: string
          produto_id: string
          quantidade: number
          preco_unitario: number
          subtotal: number
        }
        Update: {
          id?: string
          venda_id?: string
          produto_id?: string
          quantidade?: number
          preco_unitario?: number
          subtotal?: number
        }
      }
      despesas: {
        Row: {
          id: string
          descricao: string
          valor: number
          data_despesa: string
          created_at: string
        }
        Insert: {
          id?: string
          descricao: string
          valor: number
          data_despesa: string
          created_at?: string
        }
        Update: {
          id?: string
          descricao?: string
          valor?: number
          data_despesa?: string
          created_at?: string
        }
      }
    }
  }
}
