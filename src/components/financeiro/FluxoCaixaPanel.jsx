"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import Badge from "@/components/admin/ui/Badge";
import { useToast } from "@/contexts/ToastContext";

import FinanceiroResumo from "./FinanceiroResumo";
import { formatCurrency } from "@/utils/formatters";

export default function FluxoCaixaPanel() {
  const toast = useToast();

  const [dados, setDados] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD
  ========================== */

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/financeiro?type=fluxo", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setDados(json.data || []);
      setMeta(json.meta || {});
    } catch (err) {
      toast.error("Erro ao carregar fluxo de caixa", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  /* =========================
     CLASSIFICAÇÃO CONTÁBIL
  ========================== */

  const receitas = useMemo(
    () =>
      dados.filter((d) =>
        [
          "receita_aluguel",
          "taxa_adm_imobiliaria",
          "receita_venda_imovel",
        ].includes(d.tipo)
      ),
    [dados]
  );

  const despesas = useMemo(
    () =>
      dados.filter(
        (d) =>
          ![
            "receita_aluguel",
            "taxa_adm_imobiliaria",
            "receita_venda_imovel",
          ].includes(d.tipo)
      ),
    [dados]
  );

  /* =========================
     INDICADORES
  ========================== */

  const totalReceitas = useMemo(
    () => receitas.reduce((sum, r) => sum + Number(r.valor || 0), 0),
    [receitas]
  );

  const totalDespesas = useMemo(
    () => despesas.reduce((sum, d) => sum + Number(d.valor || 0), 0),
    [despesas]
  );

  const saldo = totalReceitas - totalDespesas;

  const statusSaldo =
    saldo > 0 ? "positivo" : saldo < 0 ? "negativo" : "neutro";

  /* =========================
     RENDER
  ========================== */

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <BarChart3 size={18} />
          Fluxo de Caixa
        </h3>

        <Button variant="secondary" onClick={carregar} disabled={loading}>
          <RotateCcw size={16} />
          Atualizar
        </Button>
      </div>

      {/* KPIs / RESUMO EXECUTIVO */}
      <FinanceiroResumo meta={meta} />

      {/* CARD PRINCIPAL */}
      <Card className="p-4 space-y-3">

        <div className="flex justify-between items-center text-sm">
          <span className="flex items-center gap-2">
            <TrendingUp size={14} className="text-green-600" />
            Total de Receitas
          </span>
          <span className="font-semibold text-green-600">
            {formatCurrency(totalReceitas)}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="flex items-center gap-2">
            <TrendingDown size={14} className="text-red-600" />
            Total de Despesas
          </span>
          <span className="font-semibold text-red-600">
            {formatCurrency(totalDespesas)}
          </span>
        </div>

        <div className="border-t border-border pt-3 flex justify-between items-center">
          <span className="flex items-center gap-2 font-medium">
            <Wallet size={16} />
            Saldo do Período
          </span>

          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-bold ${
                saldo >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {formatCurrency(saldo)}
            </span>

            <Badge
              status={
                statusSaldo === "positivo"
                  ? "success"
                  : statusSaldo === "negativo"
                  ? "danger"
                  : "default"
              }
            >
              {statusSaldo === "positivo"
                ? "Superávit"
                : statusSaldo === "negativo"
                ? "Déficit"
                : "Equilíbrio"}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
