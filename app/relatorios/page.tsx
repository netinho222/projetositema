"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface RelatorioDetalhado {
  mes: string
  vendas: number
  custos: number
  despesas: number
  lucro: number
  margemBruta: number
}

export default function RelatoriosPage() {
  const [dados, setDados] = useState<RelatorioDetalhado[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadRelatoriosDetalhados()
  }, [])

  async function loadRelatoriosDetalhados() {
    try {
      const anoAtual = new Date().getFullYear().toString()
      const inicioAno = `${anoAtual}-01-01`
      const fimAno = `${anoAtual}-12-31`

      // Buscar vendas com custos do ano atual
      const { data: vendas, error: vendasError } = await supabase
        .from("vendas")
        .select(`
          id,
          valor_total,
          data_venda,
          itens_venda(
            quantidade,
            preco_unitario,
            produtos(preco_custo)
          )
        `)
        .gte("data_venda", inicioAno)
        .lte("data_venda", fimAno)

      if (vendasError) throw vendasError

      // Buscar despesas do ano atual
      const { data: despesas, error: despesasError } = await supabase
        .from("despesas")
        .select("valor, data_despesa")
        .gte("data_despesa", inicioAno)
        .lte("data_despesa", fimAno)

      if (despesasError) throw despesasError

      // Processar dados mensais
      const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

      const dadosMensais: RelatorioDetalhado[] = meses.map((mes, index) => {
        const mesNum = index + 1

        // Calcular vendas e custos do mês
        let vendasMes = 0
        let custosMes = 0

        vendas
          ?.filter((v) => {
            const dataVenda = new Date(v.data_venda)
            return dataVenda.getMonth() + 1 === mesNum
          })
          .forEach((venda) => {
            vendasMes += venda.valor_total

            // Calcular custo dos produtos vendidos
            venda.itens_venda?.forEach((item: any) => {
              const custoProduto = item.produtos?.preco_custo || 0
              custosMes += item.quantidade * custoProduto
            })
          })

        // Calcular despesas do mês
        const despesasMes =
          despesas
            ?.filter((d) => {
              const dataDespesa = new Date(d.data_despesa)
              return dataDespesa.getMonth() + 1 === mesNum
            })
            .reduce((sum, d) => sum + d.valor, 0) || 0

        // Calcular lucro e margem
        const lucroMes = vendasMes - custosMes - despesasMes
        const margemBruta = vendasMes > 0 ? ((vendasMes - custosMes) / vendasMes) * 100 : 0

        return {
          mes,
          vendas: vendasMes,
          custos: custosMes,
          despesas: despesasMes,
          lucro: lucroMes,
          margemBruta,
        }
      })

      setDados(dadosMensais)
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os relatórios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const totalVendas = dados.reduce((sum, item) => sum + item.vendas, 0)
  const totalCustos = dados.reduce((sum, item) => sum + item.custos, 0)
  const totalDespesas = dados.reduce((sum, item) => sum + item.despesas, 0)
  const lucroTotal = totalVendas - totalCustos - totalDespesas
  const margemBrutaTotal = totalVendas > 0 ? ((totalVendas - totalCustos) / totalVendas) * 100 : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Relatórios Anuais</h1>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totalVendas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Vendas anuais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Custos Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">R$ {totalCustos.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Custo dos produtos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {totalDespesas.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Gastos operacionais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lucroTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
              R$ {lucroTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Resultado anual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Margem Bruta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margemBrutaTotal >= 0 ? "text-green-600" : "text-red-600"}`}>
              {margemBrutaTotal.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Margem anual</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de dados mensais */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada - {new Date().getFullYear()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Mês</th>
                  <th className="text-right p-2">Receita</th>
                  <th className="text-right p-2">Custos</th>
                  <th className="text-right p-2">Despesas</th>
                  <th className="text-right p-2">Lucro Líquido</th>
                  <th className="text-right p-2">Margem Bruta</th>
                </tr>
              </thead>
              <tbody>
                {dados.map((item) => (
                  <tr key={item.mes} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{item.mes}</td>
                    <td className="p-2 text-right text-green-600">R$ {item.vendas.toFixed(2)}</td>
                    <td className="p-2 text-right text-orange-600">R$ {item.custos.toFixed(2)}</td>
                    <td className="p-2 text-right text-red-600">R$ {item.despesas.toFixed(2)}</td>
                    <td className={`p-2 text-right font-medium ${item.lucro >= 0 ? "text-green-600" : "text-red-600"}`}>
                      R$ {item.lucro.toFixed(2)}
                    </td>
                    <td className={`p-2 text-right ${item.margemBruta >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {item.margemBruta.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
