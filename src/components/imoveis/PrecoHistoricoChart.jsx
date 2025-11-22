"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import { useMemo } from "react";
import { formatCurrency } from "@/utils/formatters";

export default function PrecoHistoricoChart({ data = [] }) {
  const formatted = useMemo(() => {
    return (data || []).map((e) => {
      // Normaliza valor (compatível com antigo "xxx → 12345")
      const parsed =
        typeof e.valor === "number"
          ? e.valor
          : parseFloat(
              String(e.descricao || "")
                .split("→")[1]?.trim() ||
                e.valor_atual ||
                0
            );

      return {
        data: new Date(e.created_at).toLocaleDateString("pt-BR"),
        valor: Number.isFinite(parsed) ? parsed : 0,
        tipo: e.tipo || "ajuste_preco",
      };
    });
  }, [data]);

  if (!formatted.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem histórico de preço.
      </p>
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
          <XAxis dataKey="data" interval="preserveStartEnd" tickMargin={6} />
          <YAxis
            width={80}
            tickFormatter={(v) => formatCurrency(v)}
          />
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Line
            type="monotone"
            dataKey="valor"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
