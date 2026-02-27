"use client";

import { useEffect, useState, useCallback } from "react";
import { Building2, Users, HandCoins, Activity } from "lucide-react";
import Image from "next/image";

import KPI from "@/components/admin/ui/KPIWidget";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/admin/ui/Card";
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

const PERIOD_OPTIONS = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "12m", label: "12 meses" },
];

export default function DashboardCorretor() {
  const [summary, setSummary] = useState(null);
  const [recents, setRecents] = useState(null);

  const [filters, setFilters] = useState({
    periodo: "30d",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleFilterChange = (key) => (e) => {
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const qs = new URLSearchParams(filters).toString();

      const [summaryResp, recentsResp] = await Promise.all([
        fetch(`/api/dashboard/corretor-summary?${qs}`),
        fetch(`/api/dashboard/recents?modo=corretor`)
      ]);

      if (!summaryResp.ok || !recentsResp.ok) {
        throw new Error("Falha ao carregar dados");
      }

      const summaryJson = await summaryResp.json();
      const recentsJson = await recentsResp.json();

      setSummary(summaryJson);
      setRecents(recentsJson);

    } catch (err) {
      setError(err?.message || "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {error && (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-500">
              Erro ao carregar o painel
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Meu Painel
        </h1>

        <Select value={filters.periodo} onChange={handleFilterChange("periodo")}>
          {PERIOD_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </Select>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPI title="Meus Imóveis" value={summary.imoveis?.total ?? 0} icon={Building2} />
          <KPI title="Meus Leads" value={summary.leads?.total ?? 0} icon={Users} />
          <KPI
            title="Minha Comissão"
            value={`R$ ${Number(summary.financeiro?.saldo_mes ?? 0).toLocaleString("pt-BR")}`}
            icon={HandCoins}
          />
        </div>
      )}

      {/* IMÓVEL DESTAQUE */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Imóvel Mais Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {summary?.destaques?.imovel ? (
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">
                  {summary.destaques.imovel.titulo}
                </h3>
                <Badge status={summary.destaques.imovel.status} className="mt-2" />
              </div>

              {summary.destaques.imovel.imagem_principal && (
                <Image
                  src={summary.destaques.imovel.imagem_principal}
                  alt=""
                  width={140}
                  height={90}
                  className="rounded-md border"
                />
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">Nenhum imóvel encontrado.</p>
          )}
        </CardContent>
      </Card>

      {/* LEADS RECENTES */}
      <Card>
        <CardHeader>
          <CardTitle>Seus Leads Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {(recents?.leads ?? []).map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.nome}</TableCell>
                  <TableCell><Badge status={l.status} /></TableCell>
                  <TableCell>
                    {new Date(l.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>

      <footer className="text-center text-muted-foreground text-sm pt-6 flex items-center justify-center gap-2">
        <Activity className="w-4 h-4" />
        Atualizado em {new Date().toLocaleString("pt-BR")}
      </footer>

    </div>
  );
}