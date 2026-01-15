"use client";

import { useEffect, useMemo, useState, useCallback} from "react";

import {
  Loader2,
  BarChart3,
  Users,
  FileText,
  MapPin,
  TrendingUp,
  Filter,
  RefreshCcw,
  Award,
  PieChart,
  ListChecks,
  Handshake,
  DollarSign,
  Clock,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Select, Input } from "@/components/admin/ui/Form";
import KPIWidget from "@/components/admin/ui/KPIWidget";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import Badge from "@/components/admin/ui/Badge"; // se estiver como default, ajusta o import
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/ui/Table";
import { useToast } from "@/contexts/ToastContext";

/* ============================================================
   Helpers
============================================================ */
const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "0";
  return Number(value).toLocaleString("pt-BR");
};

const formatCurrencyBRL = (value) => {
  if (value === null || value === undefined || Number.isNaN(value))
    return "R$ 0,00";
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
};

/* ============================================================
   Skeleton (usa seu Skeleton, sem Card aninhado)
============================================================ */
function RelatoriosSkeleton() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-24" />
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>

      {/* Seções */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   Painel
============================================================ */

export default function CRMRelatoriosPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [corretores, setCorretores] = useState([]);
  const [origensLista, setOrigensLista] = useState([]);

  const toast = useToast();

  const [filtros, setFiltros] = useState({
    inicio: "",
    fim: "",
    corretor_id: "",
    origem: "",
    status_lead: "",
    interesse_tipo: "",
    interesse_disponibilidade: "",
    cidade: "",
    status_proposta: "",
    imovel_status: "",
  });

  const leadStatus = [
    "novo",
    "qualificado",
    "visita_agendada",
    "proposta_feita",
    "documentacao",
    "concluido",
    "perdido",
  ];

  const tiposImovel = ["apartamento", "casa", "terreno", "comercial", "rural"];
  const disponibilidades = ["venda", "locacao", "ambos"];
  const propostasStatus = ["pendente", "aceita", "recusada", "expirada"];
  const imovelStatus = [
    "disponivel",
    "reservado",
    "alugado",
    "vendido",
    "inativo",
  ];

  /* ============================================================
     QueryString
  ============================================================ */
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => v && params.set(k, v));
    return params.toString();
  }, [filtros]);

  /* ============================================================
     Load Listas
  ============================================================ */
  const loadListas = async () => {
    try {
      const [corrRes, origRes] = await Promise.all([
        fetch("/api/perfis/list?type=equipe", { cache: "no-store" }),
        fetch("/api/crm/leads?origens=1", { cache: "no-store" }),
      ]);

      const [corrJson, origJson] = await Promise.all([
        corrRes.json(),
        origRes.json(),
      ]);

      setCorretores(corrJson.data || []);
      setOrigensLista(origJson.data || []);
    } catch {
      // silencioso
    }
  };

  /* ============================================================
     Load KPIs
  ============================================================ */
  const loadKpis = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/crm/relatorios?${queryString}`, {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar relatórios");

      setData(json.data || null);
    } catch (err) {
      toast.error("Erro", err.message || "Falha ao carregar relatórios");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [toast, queryString]);

  /* ============================================================
     Effects
  ============================================================ */
  useEffect(() => {
    loadListas();
  }, []);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  const resetFiltros = () =>
    setFiltros({
      inicio: "",
      fim: "",
      corretor_id: "",
      origem: "",
      status_lead: "",
      interesse_tipo: "",
      interesse_disponibilidade: "",
      cidade: "",
      status_proposta: "",
      imovel_status: "",
    });

  /* ============================================================
     Early states
  ============================================================ */
  if (loading && !data) return <RelatoriosSkeleton />;

  if (!data)
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground space-y-2">
        <BarChart3 className="w-6 h-6 opacity-70" />
        <p className="text-sm font-medium">Nenhum dado disponível.</p>
        <p className="text-xs">Ajuste os filtros e tente novamente.</p>
      </div>
    );

  const totalLeads = data.totalLeads || 0;
  const totalPropostas = data.totalPropostas || 0;

  const totalPropostasStatus = Object.values(data.propostasStatus || {}).reduce(
    (acc, v) => acc + v,
    0
  );
  const totalOrigens = Object.values(data.origens || {}).reduce(
    (acc, v) => acc + v,
    0
  );

  /* ============================================================
     UI
  ============================================================ */

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-1">
              CRM • Relatórios
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={resetFiltros}
              className="flex items-center gap-2"
            >
              <RefreshCcw size={14} />
              Limpar filtros
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={loadKpis}
              className="flex items-center gap-2"
            >
              <Loader2
                size={14}
                className={loading ? "animate-spin" : "opacity-0"}
              />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* FILTROS — Card de nível raiz, conteúdo com inputs e select (sem outro Card) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Filter size={16} />
            </div>
            <div>
              <CardTitle className="text-sm">Filtros analíticos</CardTitle>
              <p className="text-xs text-muted-foreground">
                Refine o recorte por período, corretor, origem e estágio do
                funil.
              </p>
            </div>
          </div>

          <div className="hidden md:flex gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 rounded-full bg-muted/60">
              Leads no recorte:{" "}
              <span className="font-semibold text-foreground">
                {formatNumber(totalLeads)}
              </span>
            </span>
            <span className="px-2 py-1 rounded-full bg-muted/60">
              Conversão final:{" "}
              <span className="font-semibold text-foreground">
                {data.conversaoFinal.toLocaleString("pt-BR")}%
              </span>
            </span>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {/* Datas */}
            <Input
              type="date"
              value={filtros.inicio}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, inicio: e.target.value }))
              }
            />

            <Input
              type="date"
              value={filtros.fim}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, fim: e.target.value }))
              }
            />

            {/* Corretor */}
            <Select
              value={filtros.corretor_id}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, corretor_id: e.target.value }))
              }
            >
              <option value="">Todos os Corretores</option>
              {corretores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome_completo}
                </option>
              ))}
            </Select>

            {/* Origem */}
            <Select
              value={filtros.origem}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, origem: e.target.value }))
              }
            >
              <option value="">Todas as Origens</option>
              {origensLista.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>

            {/* Status Lead */}
            <Select
              value={filtros.status_lead}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, status_lead: e.target.value }))
              }
            >
              <option value="">Status do Lead</option>
              {leadStatus.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>

            {/* Tipo Imóvel */}
            <Select
              value={filtros.interesse_tipo}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, interesse_tipo: e.target.value }))
              }
            >
              <option value="">Tipo de Imóvel</option>
              {tiposImovel.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            {/* Disponibilidade */}
            <Select
              value={filtros.interesse_disponibilidade}
              onChange={(e) =>
                setFiltros((f) => ({
                  ...f,
                  interesse_disponibilidade: e.target.value,
                }))
              }
            >
              <option value="">Disponibilidade</option>
              {disponibilidades.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            {/* Cidade */}
            <Input
              placeholder="Cidade"
              value={filtros.cidade}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, cidade: e.target.value }))
              }
            />

            {/* Status Proposta */}
            <Select
              value={filtros.status_proposta}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, status_proposta: e.target.value }))
              }
            >
              <option value="">Status da Proposta</option>
              {propostasStatus.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>

            {/* Status Imóvel (Contrato) */}
            <Select
              value={filtros.imovel_status}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, imovel_status: e.target.value }))
              }
            >
              <option value="">Status do Imóvel</option>
              {imovelStatus.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* KPIs — usando KPIWidget direto (sem Card) */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPIWidget
          title="Leads"
          value={formatNumber(data.totalLeads)}
          icon={Users}
        />
        <KPIWidget
          title="Visitas"
          value={formatNumber(data.totalVisitas)}
          icon={MapPin}
        />
        <KPIWidget
          title="Propostas"
          value={formatNumber(data.totalPropostas)}
          icon={FileText}
        />
        <KPIWidget
          title="Contratos"
          value={formatNumber(data.totalContratos)}
          icon={Handshake}
        />
        <KPIWidget
          title="Conv. Lead → Proposta"
          value={`${data.taxaConversao.toLocaleString("pt-BR")} %`}
          icon={BarChart3}
        />
        <KPIWidget
          title="Conversão Final"
          value={`${data.conversaoFinal.toLocaleString("pt-BR")} %`}
          icon={TrendingUp}
        />
      </div>

      {/* KPIs financeiros / tempo — também direto */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPIWidget
          title="Ticket médio das propostas"
          value={formatCurrencyBRL(data.ticketMedioPropostas)}
          icon={DollarSign}
        />
        <KPIWidget
          title="Tempo médio Lead → Proposta"
          value={
            data.tempoMedioConversao > 0
              ? `${data.tempoMedioConversao} dias`
              : "—"
          }
          icon={Clock}
        />
      </div>

      {/* GRID MISTO: Lista + Lista */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* FUNIL DE LEADS — LISTA EM GRID */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <ListChecks className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Funil de Leads (status)</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(data.funilLeads || {}).map(([status, count]) => (
                <div
                  key={status}
                  className="flex flex-col items-center justify-center py-3"
                >
                  <span className="text-xs text-muted-foreground mb-1 capitalize text-center">
                    {status.replaceAll("_", " ")}
                  </span>

                  <span className="text-2xl font-semibold text-primary">
                    {formatNumber(count)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FUNIL COMPLETO — LISTA HORIZONTAL */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">
              Funil completo: Lead → Visita → Proposta → Contrato
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.funilCompleto || {}).map(([step, count]) => (
                <div
                  key={step}
                  className="flex flex-col items-center justify-center py-3"
                >
                  <span className="text-xs text-muted-foreground mb-1 capitalize text-center">
                    {step}
                  </span>

                  <span className="text-2xl font-semibold text-primary">
                    {formatNumber(count)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* GRID MISTO: TABELA + TABELA */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* STATUS DAS PROPOSTAS — TABELA */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Status das Propostas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>% do total</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {Object.entries(data.propostasStatus || {}).map(
                  ([status, count]) => {
                    const perc =
                      totalPropostasStatus > 0
                        ? ((count / totalPropostasStatus) * 100).toFixed(1)
                        : "0.0";

                    return (
                      <TableRow key={status}>
                        <TableCell className="flex items-center gap-2">
                          <Badge status={status}>
                            {status.replaceAll("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatNumber(count)}</TableCell>
                        <TableCell>{perc}%</TableCell>
                      </TableRow>
                    );
                  }
                )}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        {/* ORIGEM DOS LEADS — TABELA */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Origem dos Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origem</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>% do total</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {Object.entries(data.origens || {}).map(([origem, count]) => {
                  const perc =
                    totalOrigens > 0
                      ? ((count / totalOrigens) * 100).toFixed(1)
                      : "0.0";

                  return (
                    <TableRow key={origem}>
                      <TableCell className="capitalize">{origem}</TableCell>
                      <TableCell>{formatNumber(count)}</TableCell>
                      <TableCell>{perc}%</TableCell>
                    </TableRow>
                  );
                })}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* TOP CORRETORES — TABELA */}
      {data.topCorretores?.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Top 5 Corretores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Corretor</TableHead>
                  <TableHead>Leads no período</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {data.topCorretores.map((c, i) => (
                  <TableRow key={c.corretor_id}>
                    <TableCell className="font-semibold text-primary">
                      #{i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{formatNumber(c.total)}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
