"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useMemo } from "react";
import { formatCurrency } from "@/utils/formatters";

export default function PrecoHistoricoChart({ data = [] }) {
  const formatted = useMemo(() => {
    return (data || []).map((item) => {
      const valor =
        typeof item.valor === "number"
          ? item.valor
          : Number(
              String(item.descricao || "")
                .split("→")[1]
                ?.trim() || item.valor_atual || 0
            );

      return {
        data: new Date(item.created_at).toLocaleDateString("pt-BR"),
        valor: Number.isFinite(valor) ? valor : 0,
        tipo: item.tipo || "ajuste_preco",
      };
    });
  }, [data]);

  if (!formatted.length) {
    return (
      <p className="text-sm text-muted-foreground">Sem histórico de preço.</p>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formatted}
          margin={{ top: 10, right: 16, left: 40, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" tickMargin={6} />
          <YAxis tickFormatter={formatCurrency} width={80} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Line type="monotone" dataKey="valor" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
