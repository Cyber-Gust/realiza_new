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
} from "recharts";
import dayjs from "dayjs";

import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Select } from "@/components/admin/ui/Form";
import { MultiSelectCheckbox } from "@/components/admin/ui/MultiSelectCheckbox";
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

function gerarMeses(anos = 6) {
  const inicioAno = dayjs().year();
  const meses = [];
  for (let a = inicioAno; a < inicioAno + anos; a++) {
    for (let m = 1; m <= 12; m++) {
      const mm = String(m).padStart(2, "0");
      meses.push({
        value: `${a}-${mm}`,
        label: `${mm}/${a}`,
      });
    }
  }
  return meses;
}

function montarGrafico(diasApi, mesReferencia) {
  const ultimoDia = dayjs(`${mesReferencia}-01`).daysInMonth();
  const mapa = Object.fromEntries(diasApi.map((d) => [d.dia, d.valor]));

  return Array.from({ length: ultimoDia }, (_, i) => ({
    dia: i + 1,
    valor: mapa[i + 1] || 0,
  }));
}

/* ======================================================
   COMPONENTE
====================================================== */

export default function RecebimentoDiario() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const mesAtual = dayjs().format("YYYY-MM");

  const [filters, setFilters] = useState({
    tipo: "receita_aluguel",
    base_data: "vencimento",
    meses: [mesAtual],
  });

  const mesesDisponiveis = gerarMeses();

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const carregar = useCallback(async () => {
    if (!filters.meses.length) {
      setData(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/alugueis/recebimento_diario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipos: [filters.tipo],
          base_data: filters.base_data,
          meses: filters.meses,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setData(json);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar recebimento diário");
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    if (filters.meses.length) {
      carregar();
    } else {
      setData(null);
    }
  }, [filters.meses, carregar]);

  const graficoData =
    data && filters.meses.length
      ? montarGrafico(data.dias, filters.meses[0])
      : [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Filter size={16} /> Filtros
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* TIPO */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Valor</label>
            <Select
              value={filters.tipo}
              onChange={(e) =>
                handleFilterChange("tipo", e.target.value)
              }
            >
              <option value="receita_aluguel">Valor Recebido</option>
              <option value="taxa_adm_imobiliaria">
                Taxa Administrativa
              </option>
              <option value="taxa_contrato">Taxa de Contrato</option>
            </Select>
          </div>

          {/* DATA BASE */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Data</label>
            <Select
              value={filters.base_data}
              onChange={(e) =>
                handleFilterChange("base_data", e.target.value)
              }
            >
              <option value="vencimento">Data de Vencimento</option>
              <option value="pagamento">Data de Pagamento</option>
            </Select>
          </div>

          {/* MESES */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Mês / Ano</label>
            <MultiSelectCheckbox
              options={mesesDisponiveis}
              value={filters.meses}
              onChange={(v) => handleFilterChange("meses", v)}
              placeholder="Selecione os meses"
            />
          </div>

          <Button onClick={carregar} disabled={loading}>
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Aplicar"
            )}
          </Button>
        </div>
      </Card>

      {/* RESUMO */}
      {data && (
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">
            Total no período
          </div>
          <div className="text-2xl font-semibold">
            {formatMoney(data.total_geral)}
          </div>
        </Card>
      )}

      {/* GRÁFICO */}
      <Card className="p-4 h-[360px]">
        {loading || !data ? (
          <div className="flex justify-center items-center h-full text-muted-foreground">
            <Loader2 className="animate-spin mr-2" />
            Carregando gráfico...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graficoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip formatter={formatMoney} />
              <Line
                type="monotone"
                dataKey="valor"
                name="Valor"
                stroke="#16a34a"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* TABELA */}
      {data && (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dia</TableHead>
                <TableHead>Qtd. Contratos</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {data.dias.map((d) => (
                <TableRow key={d.dia}>
                  <TableCell>{d.dia}</TableCell>
                  <TableCell>{d.quantidade_contratos}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(d.valor)}
                  </TableCell>
                  <TableCell className="text-right">
                    {d.percentual}%
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
