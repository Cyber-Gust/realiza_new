"use client";
import { useEffect, useState } from "react";
import { Loader2, BarChart3, Users, FileText, MapPin, TrendingUp } from "lucide-react";
import CRMKPIWidget from "./CRMKPIWidget";
import Card from "@/components/admin/ui/Card";

/**
 * Painel completo de KPIs e gráficos do CRM
 * - Integra com /api/crm/relatorios
 * - Exibe KPIs, funil de leads e origens de leads
 */
export default function CRMRelatoriosPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadKpis = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/crm/relatorios", { cache: "no-store" });
      const json = await res.json();
      if (!json?.data) throw new Error("Sem dados");
      setData(json.data);
    } catch (err) {
      console.error("❌ Erro ao carregar relatórios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKpis();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Carregando KPIs...
      </div>
    );

  if (!data)
    return (
      <div className="text-center py-10 text-muted-foreground">
        Nenhum dado disponível no momento.
      </div>
    );

  return (
    <div className="space-y-8">
      {/* ===================== KPIs PRINCIPAIS ===================== */}
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
