"use client";
import PageHeader from "@/components/admin/layout/PageHeader";
import KPIWidget from "@/components/admin/layout/KPIWidget";
import ImoveisFilters from "@/components/imoveis/ImoveisFilters";
import ImoveisTable from "@/components/imoveis/ImoveisTable";
import { Button } from "@/components/ui/button";
import { useImoveisQuery } from "@/hooks/useImoveisQuery";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import  Card  from "@/components/admin/ui/Card";
import { useEffect, useState } from "react";
import isEqual from "lodash.isequal";

export default function ImoveisPage() {
  const router = useRouter();
  const { imoveis, applyFilters, loading } = useImoveisQuery();
  const [stats, setStats] = useState({ disponivel: 0, reservado: 0, alugado: 0, inativo: 0 });

  useEffect(() => {
    if (!Array.isArray(imoveis)) return;

    // 🔒 Evita loops desnecessários: só atualiza se o resumo mudou
    const newSummary = imoveis.reduce(
      (acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      },
      { disponivel: 0, reservado: 0, alugado: 0, inativo: 0 }
    );

    setStats((prev) => {
      // impede re-render infinito
      if (isEqual(prev, newSummary)) return prev;
      return newSummary;
    });
  }, [imoveis]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Imóveis"
        description="Gerencie o portfólio de imóveis, status e publicações."
        rightSection={
          <Button onClick={() => router.push("/admin/imoveis/new")} className="flex items-center gap-2">
            <Plus size={16} /> Novo Imóvel
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIWidget label="Disponíveis" value={stats.disponivel} />
        <KPIWidget label="Reservados" value={stats.reservado} />
        <KPIWidget label="Alugados" value={stats.alugado} />
        <KPIWidget label="Inativos" value={stats.inativo} />
      </div>

      <Card>
        <ImoveisFilters onFilter={applyFilters} />
        {loading ? (
          <p className="p-4 text-center text-muted-foreground">Carregando imóveis...</p>
        ) : (
          <ImoveisTable data={imoveis} onSelect={(i) => router.push(`/admin/imoveis/${i.id}`)} />
        )}
      </Card>
    </div>
  );
}
