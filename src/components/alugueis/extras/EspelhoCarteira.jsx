"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar, Loader2 } from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Input } from "@/components/admin/ui/Form";
import { useToast } from "@/contexts/ToastContext";

/* ================================
    HELPERS
================================ */
const formatMoney = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const formatPercent = (v) =>
  `${Number(v || 0).toFixed(2).replace(".", ",")} %`;

const Metric = ({ title, value, negative = false }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs text-muted-foreground">{title}</span>
    <span
      className={`text-lg font-semibold ${
        negative ? "text-red-600" : "text-foreground"
      }`}
    >
      {value}
    </span>
  </div>
);

export default function EspelhoCarteira() {
  const toast = useToast();

  const [mes, setMes] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  /* ================================
      LOAD DATA
  ================================ */
  const carregar = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/alugueis/espelho_carteira?mes=${mes}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar espelho");

      setData(json);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [mes, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!data && loading) {
    return (
      <div className="flex justify-center py-10 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Carregando espelho da carteira…
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-150">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-xl font-semibold tracking-tight">
          Espelho da Carteira
        </h3>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-muted-foreground" />
          <Input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
          />
          <Button onClick={carregar} disabled={loading}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Atualizar"}
          </Button>
        </div>
      </div>

      {/* ================= CONTRATOS ================= */}
      <Card className="p-5 space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Contratos
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric title="Assinados" value={data?.contratos?.assinados} />
          <Metric title="Rescindidos" value={data?.contratos?.rescindidos} />
          <Metric
            title="Saldo"
            value={data?.contratos?.saldo}
            negative={data?.contratos?.saldo < 0}
          />
          <Metric title="Acumulado" value={data?.contratos?.acumulado} />
        </div>
      </Card>

      {/* ================= MÉDIA TAXA ADM ================= */}
      <Card className="p-5 space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Média das Taxas Administrativas
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric
            title="Assinados"
            value={formatPercent(data?.taxa_adm_media?.assinados)}
          />
          <Metric
            title="Rescindidos"
            value={formatPercent(data?.taxa_adm_media?.rescindidos)}
          />
          <Metric
            title="Saldo"
            value={formatPercent(data?.taxa_adm_media?.saldo)}
            negative={data?.taxa_adm_media?.saldo < 0}
          />
          <Metric
            title="Acumulado"
            value={formatPercent(data?.taxa_adm_media?.acumulado)}
          />
        </div>
      </Card>

      {/* ================= VALORES TAXA ADM ================= */}
      <Card className="p-5 space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground">
          Valores das Taxas Administrativas (R$)
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric
            title="Entradas"
            value={formatMoney(data?.taxa_adm_valores?.entradas)}
          />
          <Metric
            title="Saídas"
            value={formatMoney(data?.taxa_adm_valores?.saidas)}
          />
          <Metric
            title="Saldo"
            value={formatMoney(data?.taxa_adm_valores?.saldo)}
            negative={data?.taxa_adm_valores?.saldo < 0}
          />
          <Metric
            title="Acumulado"
            value={formatMoney(data?.taxa_adm_valores?.acumulado)}
          />
        </div>
      </Card>

      {/* ================= TAXA CONTRATO ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Taxas de Contrato (Mês)
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <Metric
              title="Média (%)"
              value={formatPercent(data?.taxa_contrato?.media)}
            />
            <Metric
              title="Acumulado (R$)"
              value={formatMoney(data?.taxa_contrato?.acumulado)}
            />
          </div>
        </Card>

        {/* ================= ALUGUEL ================= */}
        <Card className="p-5 space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Valores de Contrato (Aluguel)
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <Metric
              title="Médio (R$)"
              value={formatMoney(data?.aluguel?.medio)}
            />
            <Metric
              title="Acumulado (R$)"
              value={formatMoney(data?.aluguel?.acumulado)}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
