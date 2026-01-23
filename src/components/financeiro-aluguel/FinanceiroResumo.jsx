"use client";

import { useMemo } from "react";
import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { formatCurrency } from "@/utils/formatters";

export default function FinanceiroResumo({ dados = [] }) {
  const { totalEntradas, totalSaidas, saldo } = useMemo(() => {
    const totalEntradas = (dados || []).reduce(
      (sum, d) => sum + Number(d.valorEntrada || 0),
      0
    );

    const totalSaidas = (dados || []).reduce(
      (sum, d) => sum + Number(d.valorSaida || 0),
      0
    );

    const saldo = totalEntradas - totalSaidas;

    return {
      totalEntradas,
      totalSaidas,
      saldo,
    };
  }, [dados]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Card className="p-4 flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Entradas</span>
        <span className="text-lg font-semibold text-green-600">
          {formatCurrency(totalEntradas)}
        </span>
      </Card>

      <Card className="p-4 flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Saídas</span>
        <span className="text-lg font-semibold text-red-600">
          {formatCurrency(totalSaidas)}
        </span>
      </Card>

      <Card className="p-4 flex flex-col gap-1">
        <span className="text-sm text-muted-foreground">Saldo</span>
        <Badge status={saldo >= 0 ? "disponivel" : "inativo"}>
          {formatCurrency(saldo)}
        </Badge>
      </Card>
    </div>
  );
}
