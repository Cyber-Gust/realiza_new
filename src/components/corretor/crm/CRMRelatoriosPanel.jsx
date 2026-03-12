"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

import {
  Loader2,
  BarChart3,
  Users,
  FileText,
  MapPin,
  TrendingUp,
  Filter,
  RefreshCcw,
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
import { Select, Input, Label } from "@/components/admin/ui/Form";
import KPIWidget from "@/components/admin/ui/KPIWidget";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import Badge from "@/components/admin/ui/Badge";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/ui/Table";

import { useToast } from "@/contexts/ToastContext";
import { useUser } from "@/contexts/UserContext";

/* ============================================================
   Helpers
============================================================ */

const formatNumber = (value) => {
  if (!value) return "0";
  return Number(value).toLocaleString("pt-BR");
};

const formatCurrency = (value) => {
  if (!value) return "R$ 0,00";

  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

/* ============================================================
   Skeleton
============================================================ */

function RelatoriosSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-40" />

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function CRMRelatoriosPanel() {
  const { user } = useUser();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filtros, setFiltros] = useState({
    inicio: "",
    fim: "",
    origem: "",
    status_lead: "",
    interesse_tipo: "",
    interesse_disponibilidade: "",
    cidade: "",
    status_proposta: "",
    imovel_status: "",
  });

  /* ============================================================
     QueryString
  ============================================================ */

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    Object.entries(filtros).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });

    if (user?.id) params.set("corretor_id", user.id);

    return params.toString();
  }, [filtros, user]);

  /* ============================================================
     Load KPIs
  ============================================================ */

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/corretor/crm/relatorios?${queryString}`,
        { cache: "no-store" }
      );

      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setData(json.data);
    } catch (err) {
      toast.error("Erro", err.message);
    } finally {
      setLoading(false);
    }
  }, [queryString, user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetFiltros = () =>
    setFiltros({
      inicio: "",
      fim: "",
      origem: "",
      status_lead: "",
      interesse_tipo: "",
      interesse_disponibilidade: "",
      cidade: "",
      status_proposta: "",
      imovel_status: "",
    });

  if (loading && !data) return <RelatoriosSkeleton />;

  if (!data)
    return (
      <div className="py-20 text-center text-muted-foreground">
        Nenhum dado encontrado
      </div>
    );

  const totalPropostasStatus = Object.values(data.propostasStatus || {}).reduce(
    (a, b) => a + b,
    0
  );

  const totalOrigens = Object.values(data.origens || {}).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div className="space-y-10">

      {/* HEADER */}

      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          CRM • Relatórios
        </p>

        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={resetFiltros}>
            <RefreshCcw size={14} />
            Limpar
          </Button>

          <Button size="sm" onClick={loadData}>
            <Loader2
              size={14}
              className={loading ? "animate-spin" : "opacity-0"}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* FILTROS */}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter size={16} />
            Filtros
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
            <Label htmlFor="inicio">Início</Label>
            <Input
              type="date"
              value={filtros.inicio}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, inicio: e.target.value }))
              }
            />
            </div>

            <div className="flex flex-col gap-1"> 
            <Label htmlFor="fim">Fim</Label>
            <Input
              type="date"
              value={filtros.fim}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, fim: e.target.value }))
              }
            />
            </div>
            <div className="flex flex-col gap-1">
            <Label htmlFor="origem">Origem</Label>
            <Input
              placeholder="Cidade"
              value={filtros.cidade}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, cidade: e.target.value }))
              }
            />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">

        <KPIWidget title="Leads" value={formatNumber(data.totalLeads)} icon={Users} />

        <KPIWidget title="Visitas" value={formatNumber(data.totalVisitas)} icon={MapPin} />

        <KPIWidget title="Propostas" value={formatNumber(data.totalPropostas)} icon={FileText} />

        <KPIWidget title="Contratos" value={formatNumber(data.totalContratos)} icon={Handshake} />

        <KPIWidget
          title="Conversão Lead → Proposta"
          value={`${data.taxaConversao}%`}
          icon={BarChart3}
        />

        <KPIWidget
          title="Conversão Final"
          value={`${data.conversaoFinal}%`}
          icon={TrendingUp}
        />

      </div>

      {/* FUNIL */}

      <div className="grid lg:grid-cols-2 gap-6">

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Funil de Leads</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 gap-4">

              {Object.entries(data.funilLeads || {}).map(([status, count]) => (
                <div key={status} className="text-center">

                  <p className="text-xs text-muted-foreground capitalize">
                    {status.replaceAll("_", " ")}
                  </p>

                  <p className="text-2xl font-semibold text-primary">
                    {formatNumber(count)}
                  </p>

                </div>
              ))}

            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Lead → Visita → Proposta → Contrato
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-4 gap-4">

              {Object.entries(data.funilCompleto || {}).map(([step, count]) => (
                <div key={step} className="text-center">

                  <p className="text-xs text-muted-foreground capitalize">
                    {step}
                  </p>

                  <p className="text-xl font-semibold text-primary">
                    {formatNumber(count)}
                  </p>

                </div>
              ))}

            </div>
          </CardContent>
        </Card>

      </div>

      {/* STATUS PROPOSTAS */}

      <Card>

        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChart size={16} />
            Status das Propostas
          </CardTitle>
        </CardHeader>

        <CardContent>

          <Table>

            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>%</TableHead>
              </TableRow>
            </TableHeader>

            <tbody>

              {Object.entries(data.propostasStatus || {}).map(([status, count]) => {

                const perc =
                  totalPropostasStatus > 0
                    ? ((count / totalPropostasStatus) * 100).toFixed(1)
                    : "0";

                return (
                  <TableRow key={status}>
                    <TableCell>
                      <Badge>{status}</Badge>
                    </TableCell>

                    <TableCell>{count}</TableCell>

                    <TableCell>{perc}%</TableCell>
                  </TableRow>
                );
              })}

            </tbody>

          </Table>

        </CardContent>

      </Card>

    </div>
  );
}