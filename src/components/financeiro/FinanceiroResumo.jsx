"use client";

import { ListChecks, TrendingUp, TrendingDown } from "lucide-react";
import KPIWidget from "@/components/admin/ui/KPIWidget";
import { formatCurrency } from "@/utils/formatters";

export default function FinanceiroResumo({ dados, isReceita }) {
  const quantidadeLancamentos = dados.length;

  const totalReceitas = dados
    .filter((d) => isReceita(d.tipo))
    .reduce((sum, r) => sum + Number(r.valor || 0), 0);

  const totalDespesas = dados
    .filter((d) => !isReceita(d.tipo))
    .reduce((sum, d) => sum + Number(d.valor || 0), 0);

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
      <KPIWidget
        icon={ListChecks}
        title="Lançamentos"
        value={quantidadeLancamentos}
      />

      <KPIWidget
        icon={TrendingUp}
        title="Total de Receitas"
        value={formatCurrency(totalReceitas)}
      />

      <KPIWidget
        icon={TrendingDown}
        title="Total de Despesas"
        value={formatCurrency(totalDespesas)}
      />
    </div>
  );
}
