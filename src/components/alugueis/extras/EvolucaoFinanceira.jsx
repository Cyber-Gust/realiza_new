"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Select, Input } from "@/components/admin/ui/Form";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/Table";

import { Filter, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

/* ======================================================
   HELPERS
====================================================== */

const formatMoney = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function getLastMonthsRange(months = 7) {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1));
  start.setDate(1);

  return {
    inicio: start.toISOString().slice(0, 10),
    fim: end.toISOString().slice(0, 10),
  };
}

/* ======================================================
   COMPONENTE
====================================================== */

export default function EvolucaoFinanceira() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const [filters, setFilters] = useState(() => {
    const { inicio, fim } = getLastMonthsRange(7);
    return {
      periodo: "custom",
      dataInicio: inicio,
      dataFim: fim,
      considerarDataDe: "pagamento",
    };
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const aplicarPeriodoRapido = (meses) => {
    const { inicio, fim } = getLastMonthsRange(meses);
    setFilters({
      periodo: "custom",
      dataInicio: inicio,
      dataFim: fim,
      considerarDataDe: filters.considerarDataDe,
    });
  };

  /* ===========================================
     LOAD DATA
  ============================================ */

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(
        `/api/alugueis/evolucao_financeira?${params.toString()}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setData(json);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar evolução financeira");
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /* ===========================================
     UI
  ============================================ */

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold tracking-tight">
          Evolução Financeira
        </h3>
      </div>

      {/* FILTROS */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Filter size={16} /> Filtros
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <Button
            variant="secondary"
            onClick={() => aplicarPeriodoRapido(7)}
          >
            Últimos 7 meses
          </Button>

          <Button
            variant="secondary"
            onClick={() => aplicarPeriodoRapido(12)}
          >
            Últimos 12 meses
          </Button>

          <Input
            type="date"
            value={filters.dataInicio}
            onChange={(e) =>
              handleFilterChange("dataInicio", e.target.value)
            }
          />

          <Input
            type="date"
            value={filters.dataFim}
            onChange={(e) =>
              handleFilterChange("dataFim", e.target.value)
            }
          />

          <Select
            value={filters.considerarDataDe}
            onChange={(e) =>
              handleFilterChange("considerarDataDe", e.target.value)
            }
          >
            <option value="pagamento">Data de Pagamento</option>
            <option value="vencimento">Data de Vencimento</option>
          </Select>

          <Button onClick={carregar} disabled={loading}>
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Aplicar"
            )}
          </Button>
        </div>
      </Card>

      {/* GRÁFICO */}
      <Card className="p-4 h-[360px]">
        {loading || !data ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="animate-spin mr-2" />
            Carregando gráfico...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.tabela}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="competencia" />
              <YAxis />
              <Tooltip formatter={formatMoney} />
              <Legend />

              <Line
                type="monotone"
                dataKey="aluguel_bruto"
                name="Aluguel Bruto"
                stroke="#2563eb"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="aluguel_liquido"
                name="Aluguel Líquido"
                stroke="#16a34a"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="taxa_adm"
                name="Taxa Administrativa"
                stroke="#f59e0b"
              />
              <Line
                type="monotone"
                dataKey="taxa_contrato"
                name="Taxa de Contrato"
                stroke="#9333ea"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* TABELAS */}
      {data &&
        [
          ["Aluguel Bruto", "aluguel_bruto"],
          ["Aluguel Líquido", "aluguel_liquido"],
          ["Taxa Administrativa", "taxa_adm"],
          ["Taxa de Contrato", "taxa_contrato"],
        ].map(([label, key]) => (
          <Card key={key} className="p-4">
            <h4 className="font-semibold mb-3">{label}</h4>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {data.tabela.map((row) => (
                  <TableRow key={row.competencia}>
                    <TableCell>{row.competencia}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(row[key])}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </Card>
        ))}
    </div>
  );
}
