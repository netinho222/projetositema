"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar" // Ensure this is a named import
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Download, TrendingUp, TrendingDown, Package, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth, subDays, startOfWeek, endOfWeek, startOfToday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts"

interface DashboardData {
  mes: string
  vendas: number
  custos: number
  despesas: number
  lucro: number
  margemBruta: number
}

interface PeriodoFiltro {
  value: string
  label: string
  from: Date
  to: Date
}

interface UltimaMovimentacao {
  id: string
  tipo: "entrada" | "saida"
  quantidade: number
  produto_nome: string
  data_movimentacao: string
  motivo: string | null
}

export default function Dashboard() {
  const [dados, setDados] = useState<DashboardData[]>([])
  const [loading, setLoading] = useState(true)
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear().toString())
  const [intervaloDatas, setIntervaloDatas] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [filtroRapido, setFiltroRapido] = useState("mes_atual")
  const [totalProdutos, setTotalProdutos] = useState(0)
  const [ultimasMovimentacoes, setUltimasMovimentacoes] = useState<UltimaMovimentacao[]>([])
  const { toast } = useToast()

  const anosDisponiveis = ["2022", "2023", "2024", "2025"]

  const opcoesFiltro: PeriodoFiltro[] = [
    {
      value: "hoje",
      label: "Hoje",
      from: startOfToday(),
      to: new Date(),
    },
    {
      value: "semana_atual",
      label: "Esta semana",
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    },
    {
      value: "mes_atual",
      label: "Este mês",
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
    {
      value: "mes_passado",
      label: "Mês passado",
      from: startOfMonth(subDays(startOfMonth(new Date()), 1)),
      to: endOfMonth(subDays(startOfMonth(new Date()), 1)),
    },
    {
      value: "ultimos_30",
      label: "Últimos 30 dias",
      from: subDays(new Date(), 30),
      to: new Date(),
    },
    {
      value: "ultimos_90",
      label: "Últimos 90 dias",
      from: subDays(new Date(), 90),
      to: new Date(),
    },
  ]

  useEffect(() => {
    if (filtroRapido !== "personalizado") {
      const periodo = opcoesFiltro.find((p) => p.value === filtroRapido)
      if (periodo) {
        setIntervaloDatas({ from: periodo.from, to: periodo.to })
      }
    }
  }, [filtroRapido])

  useEffect(() => {
    loadDashboardData()
  }, [intervaloDatas, anoSelecionado])

  async function loadDashboardData() {
    try {
      setLoading(true)

      const { from, to } = intervaloDatas
      const fromStr = format(from, "yyyy-MM-dd")
      const toStr = format(to, "yyyy-MM-dd")

      // Buscar vendas com itens e custos no período
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
        .gte("data_venda", fromStr)
        .lte("data_venda", toStr)

      if (vendasError) throw vendasError

      // Buscar despesas no período
      const { data: despesas, error: despesasError } = await supabase
        .from("despesas")
        .select("valor, data_despesa")
        .gte("data_despesa", fromStr)
        .lte("data_despesa", toStr)

      if (despesasError) throw despesasError

      // Buscar total de produtos em estoque
      const { data: produtos } = await supabase.from("produtos").select("quantidade_estoque")
      const totalProdutosEstoque = produtos?.reduce((sum, produto) => sum + produto.quantidade_estoque, 0) || 0
      setTotalProdutos(totalProdutosEstoque)

      // Buscar últimas movimentações
      const { data: movimentacoes } = await supabase
        .from("movimentacoes_estoque")
        .select(`
        id,
        tipo,
        quantidade,
        motivo,
        data_movimentacao,
        produtos!inner(nome)
      `)
        .order("data_movimentacao", { ascending: false })
        .limit(5)

      const ultimasMovs =
        movimentacoes?.map((mov) => ({
          id: mov.id,
          tipo: mov.tipo,
          quantidade: mov.quantidade,
          produto_nome: (mov.produtos as any).nome,
          data_movimentacao: mov.data_movimentacao,
          motivo: mov.motivo,
        })) || []

      setUltimasMovimentacoes(ultimasMovs)

      // Processar dados mensais para o ano selecionado
      const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

      const dadosMensais: DashboardData[] = meses.map((mes, index) => {
        const mesNum = index + 1

        // Calcular vendas e custos do mês
        let vendasMes = 0
        let custosMes = 0

        vendas
          ?.filter((v) => {
            const dataVenda = new Date(v.data_venda)
            return dataVenda.getFullYear().toString() === anoSelecionado && dataVenda.getMonth() + 1 === mesNum
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
              return dataDespesa.getFullYear().toString() === anoSelecionado && dataDespesa.getMonth() + 1 === mesNum
            })
            .reduce((sum, d) => sum + d.valor, 0) || 0

        // Calcular lucro: Vendas - Custos - Despesas
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
      console.error("Erro ao carregar dados do dashboard:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleFiltroChange(value: string) {
    setFiltroRapido(value)
    if (value === "personalizado") {
      // Não altera as datas, permite que o usuário escolha
    }
  }

  function exportarRelatorio() {
    const csvContent = [
      ["Mês", "Vendas", "Custos", "Despesas", "Lucro", "Margem Bruta %"],
      ...dados.map((d) => [
        d.mes,
        d.vendas.toFixed(2),
        d.custos.toFixed(2),
        d.despesas.toFixed(2),
        d.lucro.toFixed(2),
        d.margemBruta.toFixed(2),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `dashboard-${anoSelecionado}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso",
    })
  }

  const totalVendas = dados.reduce((sum, item) => sum + item.vendas, 0)
  const totalCustos = dados.reduce((sum, item) => sum + item.custos, 0)
  const totalDespesas = dados.reduce((sum, item) => sum + item.despesas, 0)
  const lucroTotal = totalVendas - totalCustos - totalDespesas
  const margemBruta = totalVendas > 0 ? ((totalVendas - totalCustos) / totalVendas) * 100 : 0
  const margemLiquida = totalVendas > 0 ? (lucroTotal / totalVendas) * 100 : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-text-light">Dashboard</h1>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-orange-500">Dashboard</h1>
        <div className="flex gap-2">
          <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map((ano) => (
                <SelectItem key={ano} value={ano}>
                  {ano}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportarRelatorio} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros de período */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-text-light">Filtros de Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">Período:</label>
              <Select value={filtroRapido} onValueChange={handleFiltroChange}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={opcoesFiltro.find((o) => o.value === filtroRapido)?.label || "Selecione..."}
                  />
                </SelectTrigger>
                <SelectContent>
                  {opcoesFiltro.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">Data inicial:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(intervaloDatas.from, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={intervaloDatas.from}
                    onSelect={(date) => {
                      if (date) {
                        setIntervaloDatas((prev) => ({ ...prev, from: date }))
                        setFiltroRapido("personalizado")
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">Data final:</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(intervaloDatas.to, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={intervaloDatas.to}
                    onSelect={(date) => {
                      if (date) {
                        setIntervaloDatas((prev) => ({ ...prev, to: date }))
                        setFiltroRapido("personalizado")
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-vibrant-emerald" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vibrant-emerald">R$ {totalVendas.toFixed(2)}</div>
            <p className="text-xs text-text-muted">Vendas no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Custo dos Produtos</CardTitle>
            <TrendingDown className="h-4 w-4 text-vibrant-ruby" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-vibrant-ruby">R$ {totalCustos.toFixed(2)}</div>
            <p className="text-xs text-text-muted">Custo das vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-accent">R$ {totalDespesas.toFixed(2)}</div>
            <p className="text-xs text-text-muted">Gastos operacionais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Lucro Líquido</CardTitle>
            {lucroTotal >= 0 ? (
              <TrendingUp className="h-4 w-4 text-vibrant-emerald" />
            ) : (
              <TrendingDown className="h-4 w-4 text-vibrant-ruby" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lucroTotal >= 0 ? "text-vibrant-emerald" : "text-vibrant-ruby"}`}>
              R$ {lucroTotal.toFixed(2)}
            </div>
            <p className="text-xs text-text-muted">Receita - Custos - Despesas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Margem Bruta</CardTitle>
            <Badge variant={margemBruta >= 0 ? "default" : "destructive"} className="bg-accent-gold text-white">
              {margemBruta.toFixed(1)}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margemBruta >= 0 ? "text-vibrant-emerald" : "text-vibrant-ruby"}`}>
              {margemBruta.toFixed(1)}%
            </div>
            <p className="text-xs text-text-muted">(Vendas - Custos) / Vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Estoque</CardTitle>
            <Package className="h-4 w-4 text-accent-petrol" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-text-light">{totalProdutos}</div>
            <p className="text-xs text-text-muted">Produtos disponíveis</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Movimentações */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Gráfico de barras */}
          <Card>
            <CardHeader>
              <CardTitle className="text-text-light">Análise Financeira por Mês ({anoSelecionado})</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, ""]}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
                  <Bar dataKey="vendas" fill="#22c55e" name="Receita" />
                  <Bar dataKey="custos" fill="#ef4444" name="Custos" />
                  <Bar dataKey="despesas" fill="#f97316" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de linha do lucro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-text-light">Evolução do Lucro Líquido ({anoSelecionado})</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dados}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Lucro Líquido"]}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      color: "hsl(var(--foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lucro"
                    stroke="#22c55e" /* Changed to green */
                    strokeWidth={2}
                    dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }} /* Changed to green */
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Últimas movimentações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-text-light">Últimas Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ultimasMovimentacoes.length === 0 ? (
                <p className="text-text-muted text-center py-4">Nenhuma movimentação encontrada</p>
              ) : (
                ultimasMovimentacoes.map((mov) => (
                  <div
                    key={mov.id}
                    className="flex items-center justify-between p-3 border rounded-lg border-dark-border"
                  >
                    <div className="flex items-center space-x-3">
                      {mov.tipo === "entrada" ? (
                        <ArrowUpIcon className="h-4 w-4 text-vibrant-emerald" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-vibrant-ruby" />
                      )}
                      <div>
                        <p className="font-medium text-text-light text-sm">{mov.produto_nome}</p>
                        <p className="text-xs text-text-muted">
                          {mov.motivo || (mov.tipo === "entrada" ? "Entrada" : "Saída")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={mov.tipo === "entrada" ? "default" : "destructive"} className="text-xs">
                        {mov.tipo === "entrada" ? "+" : "-"}
                        {mov.quantidade}
                      </Badge>
                      <p className="text-xs text-text-muted mt-1">
                        {new Date(mov.data_movimentacao).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-text-light">Análise Detalhada - {anoSelecionado}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left p-2 text-text-muted">Mês</th>
                  <th className="text-right p-2 text-text-muted">Receita</th>
                  <th className="text-right p-2 text-text-muted">Custos</th>
                  <th className="text-right p-2 text-text-muted">Despesas</th>
                  <th className="text-right p-2 text-text-muted">Lucro Líquido</th>
                  <th className="text-right p-2 text-text-muted">Margem Bruta</th>
                </tr>
              </thead>
              <tbody>
                {dados.map((item) => (
                  <tr key={item.mes} className="border-b border-dark-border hover:bg-dark-surface">
                    <td className="p-2 font-medium text-text-light">{item.mes}</td>
                    <td className="p-2 text-right text-vibrant-emerald">R$ {item.vendas.toFixed(2)}</td>
                    <td className="p-2 text-right text-vibrant-ruby">R$ {item.custos.toFixed(2)}</td>
                    <td className="p-2 text-right text-orange-accent">R$ {item.despesas.toFixed(2)}</td>
                    <td
                      className={`p-2 text-right font-medium ${item.lucro >= 0 ? "text-vibrant-emerald" : "text-vibrant-ruby"}`}
                    >
                      R$ {item.lucro.toFixed(2)}
                    </td>
                    <td
                      className={`p-2 text-right ${item.margemBruta >= 0 ? "text-vibrant-emerald" : "text-vibrant-ruby"}`}
                    >
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
