"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { BarChart3, RotateCcw, Wallet } from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import Badge from "@/components/admin/ui/Badge";
import { useToast } from "@/contexts/ToastContext";
import FinanceiroResumo from "./FinanceiroResumo";
import { formatCurrency } from "@/utils/formatters";
import { Input } from "../admin/ui/Form";

const MODULO = "ALUGUEL";

const TIPOS_RECEITA = [
  "receita_aluguel",
  "taxa_adm_imobiliaria",
  "multa_atraso",
  "juros_atraso",
];

export default function FluxoCaixaPanel() {
  const toast = useToast();

  const [dados, setDados] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  /* =========================
     LOAD
  ========================== */

  const carregar = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/financeiro?type=fluxo&modulo=${MODULO}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setDados(json.data || []);
      setMeta(json.meta || {});
    } catch (err) {
      toast.error("Erro ao carregar fluxo de caixa", err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /* =========================
     REGRAS DE NEGÓCIO
  ========================== */

  const isReceita = (t) => t.natureza === "entrada";

  const limparFiltros = () => {
    setDataInicio("");
    setDataFim("");
  };

  /* =========================
     FILTRO – SOMENTE PAGOS
  ========================== */

  const dadosFiltrados = useMemo(() => {
    return dados
      .filter((d) => d.status === "pago")
      .filter((d) => {
        const data = new Date(d.data_pagamento);
        const inicio = dataInicio ? new Date(dataInicio) : null;
        const fim = dataFim ? new Date(dataFim) : null;

        if (inicio && data < inicio) return false;
        if (fim && data > fim) return false;

        return true;
      })
      .sort((a, b) => new Date(a.data_pagamento) - new Date(b.data_pagamento));
  }, [dados, dataInicio, dataFim]);

  /* =========================
     KPIs
  ========================== */

  const totalReceitas = useMemo(() => {
    return dadosFiltrados
      .filter((d) => isReceita(d))
      .reduce((sum, r) => sum + Number(r.valor || 0), 0);
  }, [dadosFiltrados]);

  const totalDespesas = useMemo(() => {
    return dadosFiltrados
      .filter((d) => !isReceita(d))
      .reduce((sum, d) => sum + Number(d.valor || 0), 0);
  }, [dadosFiltrados]);

  const saldo = totalReceitas - totalDespesas;

  /* =========================
     RENDER
  ========================== */

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 size={18} />
          Fluxo de Caixa
        </h3>

        <Button variant="secondary" onClick={carregar} disabled={loading}>
          <RotateCcw size={16} />
          Atualizar
        </Button>
      </div>

      {/* FILTRO POR DATA */}
      <Card className="p-3 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col text-sm">
          <label>Data início</label>
          <Input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div className="flex flex-col text-sm">
          <label>Data fim</label>
          <Input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <Button
          variant="secondary"
          onClick={limparFiltros}
          disabled={!dataInicio && !dataFim}
        >
          Limpar filtros
        </Button>
      </Card>

      {/* RESUMO */}
      <FinanceiroResumo dados={dadosFiltrados} isReceita={isReceita} />

      {/* EXTRATO BANCÁRIO */}
      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Data</th>
              <th className="p-2 text-left">Descrição</th>
              <th className="p-2 text-right">Entrada</th>
              <th className="p-2 text-right">Saída</th>
            </tr>
          </thead>

          <tbody>
            {dadosFiltrados.map((d) => {
              const receita = isReceita(d);

              return (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="p-2">
                    {new Date(d.data_pagamento).toLocaleDateString()}
                  </td>

                  <td className="p-2">{d.descricao}</td>

                  <td className="p-2 text-right font-medium text-green-600">
                    {receita ? formatCurrency(d.valor) : "—"}
                  </td>

                  <td className="p-2 text-right font-medium text-red-600">
                    {!receita ? formatCurrency(d.valor) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* SALDO FINAL */}
      <Card className="p-4 flex justify-between items-center">
        <span className="flex items-center gap-2 font-medium">
          <Wallet size={16} />
          Saldo do período
        </span>

        <Badge status={saldo >= 0 ? "success" : "danger"}>
          {formatCurrency(saldo)}
        </Badge>
      </Card>
    </div>
  );
}
