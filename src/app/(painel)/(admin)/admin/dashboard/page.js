"use client";
import { useEffect, useState } from "react";
import { Activity, Building2, FileText, HandCoins, Users } from "lucide-react";
import KPIWidget from "@/components/admin/layout/KPIWidget";
import Card from "@/components/admin/ui/Card";
import Table from "@/components/admin/ui/Table";
import PageHeader from "@/components/admin/layout/PageHeader";
import Badge from "@/components/admin/ui/Badge";

export default function DashboardPage() {
  const [summary, setSummary] = useState({});
  const [recentes, setRecentes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [res1, res2] = await Promise.all([
          fetch("/api/dashboard/summary").then((r) => r.json()),
          fetch("/api/dashboard/recentes").then((r) => r.json()),
        ]);
        setSummary(res1);
        setRecentes(res2);
      } catch (e) {
        console.error("Erro ao carregar dashboard:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 animate-pulse">
        <div className="h-24 bg-muted rounded-xl"></div>
        <div className="h-80 bg-muted rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Visão Geral" />

      {/* KPIs principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIWidget icon={Building2} label="Imóveis Ativos" value={summary.imoveis || 0} />
        <KPIWidget icon={FileText} label="Contratos Ativos" value={summary.contratos || 0} />
        <KPIWidget icon={Users} label="Leads" value={summary.leads || 0} />
        <KPIWidget icon={HandCoins} label="Receita do Mês" value={`R$ ${summary.receitaMes?.toLocaleString("pt-BR") || "0,00"}`} />
      </div>

      {/* Sessão de atividades recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Últimos Imóveis">
          <Table
            columns={["Código", "Título", "Status", "Data"]}
            data={recentes.imoveis?.map((i) => ({
              codigo_ref: i.codigo_ref,
              titulo: i.titulo,
              status: <Badge status={i.status} />,
              created_at: new Date(i.created_at).toLocaleDateString("pt-BR"),
            }))}
          />
        </Card>

        <Card title="Novos Leads">
          <Table
            columns={["Nome", "Telefone", "Status", "Data"]}
            data={recentes.leads?.map((l) => ({
              nome: l.nome,
              telefone: l.telefone,
              status: <Badge status={l.status} />,
              created_at: new Date(l.created_at).toLocaleDateString("pt-BR"),
            }))}
          />
        </Card>

        <Card title="Transações Recentes" className="lg:col-span-2">
          <Table
            columns={["Descrição", "Valor", "Status", "Data"]}
            data={recentes.transacoes?.map((t) => ({
              descricao: t.descricao,
              valor: `R$ ${Number(t.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
              status: <Badge status={t.status} />,
              data_pagamento: t.data_pagamento
                ? new Date(t.data_pagamento).toLocaleDateString("pt-BR")
                : "-",
            }))}
          />
        </Card>
      </div>

      <footer className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-10">
        <Activity className="w-4 h-4" />
        Atualizado em {new Date().toLocaleString("pt-BR")}
      </footer>
    </div>
  );
}
