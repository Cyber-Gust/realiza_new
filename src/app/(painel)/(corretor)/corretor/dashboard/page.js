"use client";

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";

import {
  Building2,
  FileText,
  Users,
  HandCoins,
  Activity,
  Trophy,
} from "lucide-react";

import Image from "next/image";

// UI Components
import KPI from "@/components/admin/ui/KPIWidget";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/ui/Table";
import { Select } from "@/components/admin/ui/Form";
import { Skeleton } from "@/components/admin/ui/Skeleton";

// Charts
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Tooltip,
  Legend
);

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "12m", label: "12 meses" },
];

const TIPO_IMOVEL_OPTIONS = [
  { value: "all", label: "Todos imóveis" },
  { value: "apartamento", label: "Apartamentos" },
  { value: "casa", label: "Casas" },
  { value: "terreno", label: "Terrenos" },
  { value: "comercial", label: "Comerciais" },
  { value: "rural", label: "Rural" },
];

const LEAD_STATUS_OPTIONS = [
  { value: "all", label: "Todos leads" },
  { value: "novo", label: "Novo" },
  { value: "qualificado", label: "Qualificado" },
  { value: "visita_agendada", label: "Visita Agendada" },
  { value: "proposta_feita", label: "Proposta" },
  { value: "documentacao", label: "Documentação" },
  { value: "concluido", label: "Concluído" },
  { value: "perdido", label: "Perdido" },
];

export default function DashboardPage() {
  // ==========================
  // STATES
  // ==========================
  const [summary, setSummary] = useState(null);
  const [recents, setRecents] = useState(null);

  const [filters, setFilters] = useState({
    periodo: "30d",
    tipo_imovel: "all",
    lead_status: "all",
  });

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingRecents, setLoadingRecents] = useState(true);

  const [error, setError] = useState(null);

  // ==========================
  // HANDLERS
  // ==========================
  const handleFilterChange = (key) => (e) => {
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));
  };

  // ==========================
  // LOAD DATA
  // ==========================
  const loadAll = useCallback(async () => {
    try {
      setError(null);

      const qs = new URLSearchParams(filters).toString();

      setLoadingSummary(true);
      setLoadingRecents(true);

      const [summaryResp, recentsResp] = await Promise.all([
        fetch(`/api/dashboard/summary?${qs}`),
        fetch(`/api/dashboard/recents`),
      ]);

      if (!summaryResp.ok || !recentsResp.ok) {
        throw new Error("Falha ao carregar os dados");
      }

      const summaryJson = await summaryResp.json();
      const recentsJson = await recentsResp.json();

      setSummary(summaryJson);
      setRecents(recentsJson);
    } catch (err) {
      setError(err?.message || "Erro ao carregar o painel");
    } finally {
      setLoadingSummary(false);
      setLoadingRecents(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ==========================
  // SAFE MEMOS
  // ==========================
  const receitaMeses = useMemo(
    () => summary?.charts?.receita_ultimos_meses ?? [],
    [summary]
  );

  const funilLeads = useMemo(
    () => summary?.charts?.funil_leads ?? [],
    [summary]
  );

  const distImoveis = useMemo(
    () => summary?.charts?.distribuicao_imoveis_tipo ?? [],
    [summary]
  );

  // ==========================
  // CHART DATA
  // ==========================
  const receitaData = {
    labels: receitaMeses.map((l) => l.label),
    datasets: [
      {
        label: "Receita",
        data: receitaMeses.map((l) => l.receita),
        borderColor: "rgb(16,185,129)",
        backgroundColor: "rgba(16,185,129,0.2)",
        tension: 0.3,
      },
      {
        label: "Despesa",
        data: receitaMeses.map((l) => l.despesa),
        borderColor: "rgb(239,68,68)",
        backgroundColor: "rgba(239,68,68,0.2)",
        tension: 0.3,
      },
    ],
  };

  const funilData = {
    labels: funilLeads.map((l) => l.etapa),
    datasets: [
      {
        label: "Quantidade",
        data: funilLeads.map((l) => l.valor),
        backgroundColor: "rgba(59,130,246,0.6)",
      },
    ],
  };

  const distData = {
    labels: distImoveis.map((l) => l.tipo),
    datasets: [
      {
        label: "Imóveis",
        data: distImoveis.map((l) => l.total),
        backgroundColor: [
          "#10b981",
          "#3b82f6",
          "#6366f1",
          "#f59e0b",
          "#ef4444",
        ],
      },
    ],
  };

  // ==========================
  // LOADING
  // ==========================
  if (loadingSummary && !summary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="space-y-10">

      {/* ALERTA DE ERRO */}
      {error && (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-500">
              Ocorreu um problema ao carregar o painel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-600 mb-3">{error}</p>

            <Button variant="secondary" onClick={loadAll}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={filters.periodo} onChange={handleFilterChange("periodo")}>
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>

          <Select value={filters.tipo_imovel} onChange={handleFilterChange("tipo_imovel")}>
            {TIPO_IMOVEL_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>

          <Select value={filters.lead_status} onChange={handleFilterChange("lead_status")}>
            {LEAD_STATUS_OPTIONS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI title="Imóveis Ativos" value={summary.imoveis?.total ?? 0} icon={Building2} />
          <KPI title="Leads Totais" value={summary.leads?.total ?? 0} icon={Users} />
          <KPI title="Contratos Ativos" value={summary.contratos?.ativos ?? 0} icon={FileText} />

          <KPI
            title="Saldo do Mês"
            value={`R$ ${Number(summary.financeiro?.saldo_mes ?? 0).toLocaleString("pt-BR")}`}
            icon={HandCoins}
            trend={(summary.financeiro?.saldo_mes ?? 0) >= 0 ? "up" : "down"}
            trendValue={`${(summary.financeiro?.saldo_mes ?? 0) >= 0 ? "+" : ""}${Number(summary.financeiro?.saldo_mes ?? 0).toLocaleString("pt-BR")}`}
          />
        </div>
      )}

      {/* GRAFICO PRINCIPAL */}
      <Card>
        <CardHeader>
          <CardTitle>Receita x Despesa — Últimos meses</CardTitle>
        </CardHeader>
        <CardContent>
          {receitaMeses.length > 0 ? (
            <Line data={receitaData} />
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
          )}
        </CardContent>
      </Card>

      {/* GRID SECUNDÁRIA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Funil de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {funilLeads.length ? <Bar data={funilData} /> : (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição dos Imóveis</CardTitle>
          </CardHeader>
          <CardContent>
            {distImoveis.length ? <Pie data={distData} /> : (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Corretor</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.destaques?.corretor ? (
              <div className="space-y-2">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Trophy className="text-amber-500" />
                  {summary.destaques.corretor.nome}
                </h3>
                <p className="text-muted-foreground text-sm">
                  Leads no período: <strong>{summary.destaques.corretor.total}</strong>
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">Sem dados.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* IMÓVEL DESTAQUE */}
      <Card>
        <CardHeader>
          <CardTitle>Imóvel Mais Quente</CardTitle>
        </CardHeader>
        <CardContent>
          {summary?.destaques?.imovel ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full">
                <h3 className="text-lg font-medium">{summary.destaques.imovel.titulo}</h3>
                <Badge status={summary.destaques.imovel.status} className="mt-2" />
              </div>

              {summary.destaques.imovel.imagem_principal && (
                <div className="shrink-0">
                  <Image
                    src={summary.destaques.imovel.imagem_principal}
                    alt={summary.destaques.imovel.titulo}
                    width={160}
                    height={96}
                    className="w-40 h-24 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum imóvel em destaque.</p>
          )}
        </CardContent>
      </Card>

      {/* TABELAS RECENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* IMÓVEIS */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos Imóveis</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRecents && !recents ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>

                <tbody>
                  {(recents?.imoveis ?? []).map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.codigo_ref}</TableCell>
                      <TableCell>{i.titulo}</TableCell>
                      <TableCell><Badge status={i.status} /></TableCell>
                      <TableCell>
                        {new Date(i.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* LEADS */}
        <Card>
          <CardHeader>
            <CardTitle>Novos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRecents && !recents ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>

                <tbody>
                  {(recents?.leads ?? []).map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.nome}</TableCell>
                      <TableCell>{l.telefone}</TableCell>
                      <TableCell><Badge status={l.status} /></TableCell>
                      <TableCell>
                        {new Date(l.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* TRANSAÇÕES */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRecents && !recents ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pagamento</TableHead>
                  </TableRow>
                </TableHeader>

                <tbody>
                  {(recents?.transacoes ?? []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.descricao}</TableCell>
                      <TableCell>
                        {`R$ ${Number(t.valor).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}`}
                      </TableCell>
                      <TableCell><Badge status={t.status} /></TableCell>
                      <TableCell>
                        {t.data_pagamento
                          ? new Date(t.data_pagamento).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>

      {/* FOOTER */}
      <footer className="text-center text-muted-foreground text-sm pt-10 flex items-center justify-center gap-2">
        <Activity className="w-4 h-4" />
        Atualizado em {new Date().toLocaleString("pt-BR")}
      </footer>
    </div>
  );
}
