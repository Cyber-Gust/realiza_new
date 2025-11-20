"use client";
import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";

import CRMKPIWidget from "./CRMKPIWidget";
import Card from "@/components/admin/ui/Card";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";

export default function CRMRelatoriosPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filtros, setFiltros] = useState({
    inicio: "",
    fim: "",
    corretor_id: "",
    origem: "",
  });

  const [corretores, setCorretores] = useState([]);
  const [origens, setOrigens] = useState([]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => v && params.set(k, v));
    return params.toString();
  }, [filtros]);

  // ===================== LOAD LISTAS =====================
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
      setOrigens(origJson.data || []);
    } catch {
      /* silencioso */
    }
  };

  // ===================== LOAD KPIS =====================
  const loadKpis = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/crm/relatorios?${queryString}`, {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar relatórios");

      setData(json.data);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===================== FIX: useEffect correto =====================
  useEffect(() => {
    async function run() {
      await loadListas();
    }
    run();
  }, []);

  useEffect(() => {
    async function run() {
      await loadKpis();
    }
    run();
  }, [queryString]);

  const resetFiltros = () =>
    setFiltros({ inicio: "", fim: "", corretor_id: "", origem: "" });

  // ===================== LOADING =====================
  if (loading)
    return (
      <div className="flex justify-center items-center py-16 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Carregando relatórios...
      </div>
    );

  if (!data)
    return (
      <div className="text-center py-16 text-muted-foreground">
        Nenhum dado disponível.
      </div>
    );

  // ============================================================
  //                      PAINEL DE RELATÓRIOS
  // ============================================================
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* CABEÇALHO EXECUTIVO */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Painel de Inteligência Comercial
        </h1>
        <p className="text-muted-foreground text-sm">
          Visão consolidada do funil, performance da equipe e indicadores de conversão.
        </p>
      </div>

      {/* FILTROS */}
      <Card className="p-6 shadow-md border-border bg-panel-card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Filter size={18} /> Filtros Analíticos
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={resetFiltros}
          >
            <RefreshCcw size={16} /> Limpar filtros
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <input
            type="date"
            value={filtros.inicio}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, inicio: e.target.value }))
            }
            className="p-2 rounded-md border border-border bg-panel-card text-sm"
          />

          <input
            type="date"
            value={filtros.fim}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, fim: e.target.value }))
            }
            className="p-2 rounded-md border border-border bg-panel-card text-sm"
          />

          <select
            value={filtros.corretor_id}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, corretor_id: e.target.value }))
            }
            className="p-2 rounded-md border border-border bg-panel-card text-sm"
          >
            <option value="">Todos os Corretores</option>
            {corretores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_completo}
              </option>
            ))}
          </select>

          <select
            value={filtros.origem}
            onChange={(e) =>
              setFiltros((f) => ({ ...f, origem: e.target.value }))
            }
            className="p-2 rounded-md border border-border bg-panel-card text-sm"
          >
            <option value="">Todas as Origens</option>
            {origens.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* KPIS */}
      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-5">
        <CRMKPIWidget label="Total de Leads" value={data.totalLeads} icon={Users} />
        <CRMKPIWidget label="Propostas Enviadas" value={data.totalPropostas} icon={FileText} />
        <CRMKPIWidget label="Visitas Agendadas" value={data.totalVisitas} icon={MapPin} />
        <CRMKPIWidget label="Taxa de Conversão" value={`${data.taxaConversao}%`} icon={BarChart3} />
        <CRMKPIWidget label="Tempo Médio Lead → Proposta" value={`${data.tempoMedioConversao} dias`} icon={TrendingUp} />
      </div>

      {/* FUNIL */}
      <Card className="p-6 shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <ListChecks size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">Funil de Leads</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(data.funilLeads || {}).map(([status, count]) => (
            <div key={status} className="rounded-xl border border-border bg-muted/40 p-4 text-center">
              <p className="text-sm font-medium capitalize text-muted-foreground">
                {status.replaceAll("_", " ")}
              </p>
              <p className="text-3xl font-bold text-primary mt-1">{count}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* STATUS PROPOSTAS */}
      <Card className="p-6 shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <PieChart size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">Status das Propostas</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.entries(data.propostasStatus || {}).map(([status, count]) => (
            <div key={status} className="rounded-xl border border-border bg-muted/40 p-4 text-center">
              <p className="text-sm font-medium capitalize text-muted-foreground">
                {status.replaceAll("_", " ")}
              </p>
              <p className="text-3xl font-bold text-primary mt-1">{count}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ORIGEM LEADS */}
      <Card className="p-6 shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <MapPin size={20} className="text-primary" />
          <h3 className="text-xl font-semibold">Origem dos Leads</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(data.origens || {}).map(([origem, count]) => (
            <div key={origem} className="rounded-xl border border-border bg-muted/40 p-4 text-center">
              <p className="text-sm font-medium capitalize text-muted-foreground">{origem}</p>
              <p className="text-3xl font-bold text-primary mt-1">{count}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* TOP CORRETORES */}
      {data.topCorretores?.length > 0 && (
        <Card className="p-6 shadow-md">
          <div className="flex items-center gap-2 mb-6">
            <Award size={20} className="text-primary" />
            <h3 className="text-xl font-semibold">Top 5 Corretores</h3>
          </div>

          <ul className="divide-y divide-border">
            {data.topCorretores.map((c, idx) => (
              <li
                key={c.corretor_id}
                className="flex justify-between items-center py-3 text-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="text-primary font-bold text-lg">#{idx + 1}</span>
                  <span className="text-foreground/90">{c.nome}</span>
                </span>
                <span className="font-semibold text-foreground">{c.total}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
