"use client";

import KPI from "@/components/admin/ui/KPIWidget";
import ImoveisFilters from "@/components/imoveis/ImoveisFilters";
import ImoveisTable from "@/components/imoveis/ImoveisTable";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";

import { useImoveisQuery } from "@/hooks/useImoveisQuery";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { useMemo } from "react";

export default function ImoveisPage() {
  const router = useRouter();
  const { imoveis, applyFilters, loading } = useImoveisQuery();

  const stats = useMemo(() => {
    if (!Array.isArray(imoveis)) {
      return {
        disponivel: 0,
        reservado: 0,
        alugado: 0,
        inativo: 0,
      };
    }

    return imoveis.reduce(
      (acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      },
      { disponivel: 0, reservado: 0, alugado: 0, inativo: 0 }
    );
  }, [imoveis]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ============================================================
         🔥 PAGE HEADER ENTERPRISE  
      ============================================================ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gestão de Imóveis
          </h1>

          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Gerencie seu portfólio de imóveis: status, reservas, locações e disponibilidade.
            Um cockpit completo de administração imobiliária.
          </p>
        </div>

        <Button
          onClick={() => router.push("/admin/imoveis/new")}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Novo Imóvel
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI title="Disponíveis" value={stats.disponivel} />
        <KPI title="Reservados" value={stats.reservado} />
        <KPI title="Alugados" value={stats.alugado} />
        <KPI title="Inativos" value={stats.inativo} />
      </div>

      {/* Filtros + Tabela */}
      <Card className="p-4 space-y-4">
        <ImoveisFilters onFilter={applyFilters} />

        {loading ? (
          <p className="p-4 text-center text-muted-foreground">
            Carregando imóveis...
          </p>
        ) : (
          <ImoveisTable
            data={imoveis}
            onSelect={(i) => router.push(`/admin/imoveis/${i.id}`)}
          />
        )}
      </Card>
    </div>
  );
}
