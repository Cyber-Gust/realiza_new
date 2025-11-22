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

import KPI from "@/components/admin/ui/KPIWidget";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import Table from "@/components/admin/ui/Table";
import { Select } from "@/components/admin/ui/Form";
import { Skeleton } from "@/components/admin/ui/Skeleton";

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
  // ==============================
  // STATES
  // ==============================
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

  // =======================================
  // HANDLERS
  // =======================================
  const handleFilterChange = (key) => (e) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // =======================================
  // LOAD DATA
  // =======================================
  const loadAll = useCallback(async () => {
    try {
      setError(null);

      const qs = new URLSearchParams(filters).toString();

      setLoadingSummary(true);
      setLoadingRecents(true);

      const summaryReq = fetch(`/api/dashboard/summary?${qs}`).then((r) => {
        if (!r.ok) {
          throw new Error("Falha ao carregar resumo do dashboard");
        }
        return r.json();
      });

      const recentsReq = fetch(`/api/dashboard/recents`).then((r) => {
        if (!r.ok) {
          throw new Error("Falha ao carregar dados recentes");
        }
        return r.json();
      });

      const [summaryData, recentsData] = await Promise.all([
        summaryReq,
        recentsReq,
      ]);

      setSummary(summaryData);
      setRecents(recentsData);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      setError(err?.message || "Erro ao carregar o painel");
    } finally {
      setLoadingSummary(false);
      setLoadingRecents(false);
    }
  }, [filters]);

  // =======================================
  // EFFECT
  // =======================================
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // =======================================
  // SAFE MEMOS
  // =======================================
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

  // =======================================
  // CHART DATA
  // =======================================
  const receitaData = useMemo(
    () => ({
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
    }),
    [receitaMeses]
  );

  const funilData = useMemo(
    () => ({
      labels: funilLeads.map((l) => l.etapa),
      datasets: [
        {
          label: "Quantidade",
          data: funilLeads.map((l) => l.valor),
          backgroundColor: "rgba(59,130,246,0.6)",
        },
      ],
    }),
    [funilLeads]
  );

  const distData = useMemo(
    () => ({
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
    }),
    [distImoveis]
  );

  // =======================================
  // LOADING STATE
  // =======================================
  if (loadingSummary && !summary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // =======================================
  // RENDER
  // =======================================
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
            <button
              onClick={loadAll}
              className="text-xs px-3 py-1 rounded-md border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition"
            >
              Tentar novamente
            </button>
          </CardContent>
        </Card>
      )}

      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Painel Administrativo
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filters.periodo}
            onChange={handleFilterChange("periodo")}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            value={filters.tipo_imovel}
            onChange={handleFilterChange("tipo_imovel")}
          >
            {TIPO_IMOVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            value={filters.lead_status}
            onChange={handleFilterChange("lead_status")}
          >
            {LEAD_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* ---------------- KPIs ---------------- */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI
            title="Imóveis Ativos"
            value={summary.imoveis?.total ?? 0}
            icon={Building2}
          />
          <KPI
            title="Leads Totais"
            value={summary.leads?.total ?? 0}
            icon={Users}
          />
          <KPI
            title="Contratos Ativos"
            value={summary.contratos?.ativos ?? 0}
            icon={FileText}
          />

          <KPI
            title="Saldo do Mês"
            value={`R$ ${Number(
              summary.financeiro?.saldo_mes ?? 0
            ).toLocaleString("pt-BR")}`}
            icon={HandCoins}
            trend={
              (summary.financeiro?.saldo_mes ?? 0) >= 0 ? "up" : "down"
            }
            trendValue={`${
              (summary.financeiro?.saldo_mes ?? 0) >= 0 ? "+" : ""
            }${Number(
              summary.financeiro?.saldo_mes ?? 0
            ).toLocaleString("pt-BR")}`}
          />
        </div>
      )}

      {/* ---------------- GRÁFICO PRINCIPAL ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Receita x Despesa — Últimos meses</CardTitle>
        </CardHeader>
        <CardContent>
          {receitaMeses.length > 0 ? (
            <Line data={receitaData} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Sem dados suficientes para gerar gráfico.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ---------------- GRID SECUNDÁRIA ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funil de Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Funil de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {funilLeads.length > 0 ? (
              <Bar data={funilData} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem dados de leads para o período.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Distribuição dos Imóveis */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição dos Imóveis</CardTitle>
          </CardHeader>
          <CardContent>
            {distImoveis.length > 0 ? (
              <Pie data={distData} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Sem dados suficientes para distribuição por tipo.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Corretor */}
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
                  Leads no período:{" "}
                  <strong>{summary.destaques.corretor.total}</strong>
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Sem dados de corretores no período.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---------------- IMÓVEL DESTAQUE ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Imóvel Mais Quente</CardTitle>
        </CardHeader>
        <CardContent>
          {summary?.destaques?.imovel ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full">
                <h3 className="text-lg font-medium">
                  {summary.destaques.imovel.titulo}
                </h3>
                <Badge
                  status={summary.destaques.imovel.status}
                  className="mt-2"
                />
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
            <p className="text-muted-foreground">
              Nenhum imóvel em destaque no momento.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ---------------- TABELAS RECENTES ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Imóveis */}
        <Card>
          <CardHeader>
            <CardTitle>Últimos Imóveis</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRecents && !recents ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Table
                columns={["Código", "Título", "Status", "Criado em"]}
                data={(recents?.imoveis ?? []).map((i) => ({
                  codigo_ref: i.codigo_ref,
                  titulo: i.titulo,
                  status: <Badge status={i.status} />,
                  created_at: new Date(i.created_at).toLocaleDateString(
                    "pt-BR"
                  ),
                }))}
              />
            )}
          </CardContent>
        </Card>

        {/* Novos Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Novos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRecents && !recents ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Table
                columns={["Nome", "Telefone", "Status", "Criado em"]}
                data={(recents?.leads ?? []).map((l) => ({
                  nome: l.nome,
                  telefone: l.telefone,
                  status: <Badge status={l.status} />,
                  created_at: new Date(l.created_at).toLocaleDateString(
                    "pt-BR"
                  ),
                }))}
              />
            )}
          </CardContent>
        </Card>

        {/* Transações Recentes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRecents && !recents ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Table
                columns={["Descrição", "Valor", "Status", "Pagamento"]}
                data={(recents?.transacoes ?? []).map((t) => ({
                  descricao: t.descricao,
                  valor: `R$ ${Number(t.valor).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}`,
                  status: <Badge status={t.status} />,
                  data_pagamento: t.data_pagamento
                    ? new Date(t.data_pagamento).toLocaleDateString("pt-BR")
                    : "-",
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="text-center text-muted-foreground text-sm pt-10 flex items-center justify-center gap-2">
        <Activity className="w-4 h-4" />
        Atualizado em {new Date().toLocaleString("pt-BR")}
      </footer>
    </div>
  );
}
