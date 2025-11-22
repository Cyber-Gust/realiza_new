"use client";

import { useEffect, useState } from "react";
import { BarChart3, RotateCcw } from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/contexts/ToastContext";

import FinanceiroResumo from "./FinanceiroResumo";
import { formatCurrency } from "@/utils/formatters";

export default function FluxoCaixaPanel() {
  const [dados, setDados] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const carregar = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/financeiro?type=fluxo", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setDados(json.data || []);
      setMeta(json.meta || {});

    } catch (err) {
      toast.error("Erro ao carregar", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const receitas = dados.filter((d) =>
    ["receita_aluguel", "taxa_adm_imobiliaria"].includes(d.tipo)
  );

  const despesas = dados.filter(
    (d) => !["receita_aluguel", "taxa_adm_imobiliaria"].includes(d.tipo)
  );

  const totalReceitas = receitas.reduce((a, b) => a + Number(b.valor || 0), 0);
  const totalDespesas = despesas.reduce((a, b) => a + Number(b.valor || 0), 0);
  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="space-y-4">

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <BarChart3 size={18} /> Fluxo de Caixa
        </h3>

        <Button variant="secondary" onClick={carregar} disabled={loading}>
          <RotateCcw size={16} />
          Atualizar
        </Button>
      </div>

      <FinanceiroResumo meta={meta} />

      <Card className="p-4 space-y-2">
        <div className="flex justify-between text-sm text-foreground">
          <span>Total de Receitas:</span>
          <span className="font-medium text-green-600">
            {formatCurrency(totalReceitas)}
          </span>
        </div>

        <div className="flex justify-between text-sm text-foreground">
          <span>Total de Despesas:</span>
          <span className="font-medium text-red-600">
            {formatCurrency(totalDespesas)}
          </span>
        </div>

        <div className="flex justify-between text-sm text-foreground border-t border-border pt-2">
          <span>Saldo do Período:</span>
          <span className={`font-bold ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(saldo)}
          </span>
        </div>
      </Card>
    </div>
  );
}
