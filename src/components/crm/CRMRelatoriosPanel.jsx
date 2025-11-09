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
    Object.entries(filtros).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    return params.toString();
  }, [filtros]);

  const loadListas = async () => {
    try {
      const [corrRes, origRes] = await Promise.all([
        fetch("/api/perfis/list?type=equipe", { cache: "no-store" }),
        fetch("/api/crm/origens/list", { cache: "no-store" }),
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

  useEffect(() => {
    loadListas();
  }, []);

  useEffect(() => {
    loadKpis();
  }, [queryString]);

  const resetFiltros = () =>
    setFiltros({ inicio: "", fim: "", corretor_id: "", origem: "" });

  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Carregando KPIs...
      </div>
    );

  if (!data)
    return (
      <div className="text-center py-10 text-muted-foreground">
        Nenhum dado disponível.
      </div>
    );

  return (
    <div className="space-y-8">
      {/* ===================== FILTROS ===================== */}
      <Card className="p-4 border border-border bg-panel-card">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Filter size={16} /> Filtros
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={resetFiltros}
          >
            <RefreshCcw size={14} /> Limpar
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
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
              <option key={o.id || o.nome} value={o.nome}>
                {o.nome}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* ===================== KPIs ===================== */}
      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
        <CRMKPIWidget label="Total de Leads" value={data.totalLeads} icon={Users} />
        <CRMKPIWidget label="Propostas Enviadas" value={data.totalPropostas} icon={FileText} />
        <CRMKPIWidget label="Visitas Agendadas" value={data.totalVisitas} icon={MapPin} />
        <CRMKPIWidget
          label="Taxa de Conversão"
          value={`${data.taxaConversao}%`}
          icon={BarChart3}
        />
        <CRMKPIWidget
          label="Tempo Médio Lead → Proposta"
          value={`${data.tempoMedioConversao} dias`}
          icon={TrendingUp}
        />
      </div>

      {/* ===================== FUNIL DE LEADS ===================== */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Funil de Leads</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(data.funilLeads || {}).map(([status, count]) => (
            <div
              key={status}
              className="rounded-lg border border-border bg-muted/40 p-4 text-center"
            >
              <p className="text-sm font-medium capitalize text-muted-foreground">
                {status.replaceAll("_", " ")}
              </p>
              <p className="text-2xl font-bold text-primary mt-1">{count}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ===================== PROPOSTAS POR STATUS ===================== */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Propostas por Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(data.propostasStatus || {}).map(([status, count]) => (
            <div
              key={status}
              className="rounded-lg border border-border bg-muted/40 p-4 text-center"
            >
              <p className="text-sm font-medium capitalize text-muted-foreground">
                {status.replaceAll("_", " ")}
              </p>
              <p className="text-2xl font-bold text-primary mt-1">{count}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ===================== ORIGEM DOS LEADS ===================== */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">Origem dos Leads</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(data.origens || {}).map(([origem, count]) => (
            <div
              key={origem}
              className="rounded-lg border border-border bg-muted/40 p-4 text-center"
            >
              <p className="text-sm font-medium capitalize text-muted-foreground">
                {origem}
              </p>
              <p className="text-2xl font-bold text-primary mt-1">{count}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ===================== TOP CORRETORES ===================== */}
      {data.topCorretores?.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Top 5 Corretores (Propostas Fechadas)
          </h3>
          <ul className="divide-y divide-border">
            {data.topCorretores.map((c, idx) => (
              <li
                key={c.corretor_id}
                className="flex justify-between items-center py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className="font-semibold text-primary">#{idx + 1}</span>
                  <span className="text-foreground/80">{c.nome}</span>
                </span>
                <span className="font-bold text-foreground">{c.total}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
