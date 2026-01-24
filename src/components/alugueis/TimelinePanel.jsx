"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Wallet,
  User,
} from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
import { Select } from "@/components/admin/ui/Form";
import Badge from "@/components/admin/ui/Badge";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

import { formatDateBR } from "@/utils/currency"

function formatMoneyBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value || 0));
}

function formatMoneyCompactBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
  }).format(Number(value || 0));
}


/**
 * ✅ REGRA CENTRAL DA TIMELINE
 * - Crédito (verde): natureza === "entrada"
 * - Débito (vermelho): natureza === "saida"
 *
 * Isso modela exatamente:
 * - Inquilino pagou => crédito
 * - Descontos / repasses / taxas / abatimentos => débito
 */
function resolverMovimentoPorNatureza(natureza) {
  if (natureza === "entrada") return "credito";
  if (natureza === "saida") return "debito";
  return null;
}

function getOrigemTransacao(dados_cobranca_json) {
  const origem = dados_cobranca_json?.origem;
  if (origem === "automatica") return "automatica";
  return "manual";
}

export default function TimelinePanel() {
  const { error: toastError } = useToast();

  // =========================
  // STATES
  // =========================
  const [loadingInquilinos, setLoadingInquilinos] = useState(true);
  const [loadingContratos, setLoadingContratos] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const [inquilinos, setInquilinos] = useState([]);
  const [contratos, setContratos] = useState([]);

  const [selectedInquilinoId, setSelectedInquilinoId] = useState("");
  const [selectedContratoId, setSelectedContratoId] = useState("");

  const [timelineData, setTimelineData] = useState([]);

  // =========================
  // 1) INQUILINOS VIGENTES
  // =========================
  useEffect(() => {
    async function fetchInquilinos() {
      try {
        const res = await fetch("/api/alugueis?view=inquilinos_vigentes", {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        setInquilinos(json.data || []);
      } catch (err) {
        toastError("Erro ao carregar inquilinos");
      } finally {
        setLoadingInquilinos(false);
      }
    }

    fetchInquilinos();
  }, [toastError]);

  // =========================
  // 2) CONTRATOS POR INQUILINO
  // =========================
  const loadContratos = useCallback(
    async (inquilinoId) => {
      if (!inquilinoId) return;

      try {
        setLoadingContratos(true);

        // reset quando troca inquilino
        setSelectedContratoId("");
        setTimelineData([]);

        const res = await fetch(
          `/api/alugueis?view=contratos_por_inquilino&inquilino_id=${inquilinoId}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        setContratos(json.data || []);
      } catch (err) {
        toastError("Erro ao carregar contratos");
      } finally {
        setLoadingContratos(false);
      }
    },
    [toastError]
  );

  useEffect(() => {
    if (selectedInquilinoId) {
      loadContratos(selectedInquilinoId);
    } else {
      setContratos([]);
      setSelectedContratoId("");
      setTimelineData([]);
    }
  }, [selectedInquilinoId, loadContratos]);

  // =========================
  // 3) TIMELINE (CONTA CORRENTE DO LOCADOR)
  // =========================
  const loadTimeline = useCallback(
    async (contratoId) => {
      if (!contratoId) return;

      try {
        setLoadingTimeline(true);

        const res = await fetch(
          `/api/alugueis?view=timeline_locador&contrato_id=${contratoId}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        /**
         * ✅ Normalização forte para garantir que:
         * - cada item tenha movimento "credito" ou "debito"
         * - baseado em natureza ("entrada"/"saida")
         */
        const hojeISO = new Date().toISOString().split("T")[0];

        const normalizado = (json.data || [])
          // ✅ não mostra futuro (extrato real)
          .filter((t) => {
            const dataRef = t.data_pagamento || t.data_vencimento;
            if (!dataRef) return true; // se não tiver data, não barra

            // compara só YYYY-MM-DD
            const dataISO = String(dataRef).slice(0, 10);
            return dataISO <= hojeISO;
          })
          .map((t) => {
            const movimento =
              t.movimento ||
              resolverMovimentoPorNatureza(t.natureza) ||
              null;

            const origem = getOrigemTransacao(t.dados_cobranca_json);

            return {
              ...t,
              movimento,
              automatico: origem === "automatica",
              origem,
              valor: Number(t.valor || 0),
            };
          })
          .filter((t) => t.movimento === "credito" || t.movimento === "debito")
          .sort((a, b) => {
            const da = a.data_pagamento || a.data_vencimento || "1900-01-01";
            const db = b.data_pagamento || b.data_vencimento || "1900-01-01";
            return new Date(da).getTime() - new Date(db).getTime();
          });

        setTimelineData(normalizado);
      } catch (err) {
        toastError(err.message || "Erro ao carregar timeline");
      } finally {
        setLoadingTimeline(false);
      }
    },
    [toastError]
  );

  useEffect(() => {
    if (selectedContratoId) {
      loadTimeline(selectedContratoId);
    } else {
      setTimelineData([]);
    }
  }, [selectedContratoId, loadTimeline]);

  // =========================
  // STATS
  // =========================
  const stats = useMemo(() => {
    return timelineData.reduce(
      (acc, curr) => {
        const val = Number(curr.valor || 0);

        /**
         * ✅ Aqui eu considero:
         * - SOMENTE BAIXADO (pago) entra no saldo
         * (igual extrato real mesmo)
         */
        if (curr.status === "pago") {
          if (curr.movimento === "credito") acc.credito += val;
          if (curr.movimento === "debito") acc.debito += val;
        }

        return acc;
      },
      { credito: 0, debito: 0 }
    );
  }, [timelineData]);

  const saldo = stats.credito - stats.debito;

  // =========================
  // RENDER
  // =========================
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4">
      {/* HEADER */}
      <div className="flex items-center gap-3 border-b border-border/60 pb-6">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20">
          <Clock size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Extrato Financeiro do Locador
          </h3>
          <p className="text-sm text-muted-foreground">
            Conta corrente do contrato (créditos e débitos).
          </p>
        </div>
      </div>

      {/* SELECTS */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Select Inquilino */}
        <div>
          {loadingInquilinos ? (
            <Skeleton className="h-10 w-full rounded-md" />
          ) : (
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Select
                value={selectedInquilinoId}
                onChange={(e) => setSelectedInquilinoId(e.target.value)}
              >
                <option value="">Selecione o inquilino...</option>
                {inquilinos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {/* Select Contrato */}
        <div>
          {loadingContratos ? (
            <Skeleton className="h-10 w-full rounded-md" />
          ) : (
            <div className="relative">
              <Select
                value={selectedContratoId}
                onChange={(e) => setSelectedContratoId(e.target.value)}
                disabled={!selectedInquilinoId}
              >
                <option value="">
                  {selectedInquilinoId
                    ? "Selecione o contrato..."
                    : "Selecione um inquilino primeiro..."}
                </option>

                {contratos.map((c) => (
                  <option key={c.id} value={c.id}>
                    Contrato #{c.codigo} —{" "}
                    {c.imoveis?.codigo || c.imoveis?.titulo}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="min-h-[400px]">
        {!selectedContratoId ? (
          <EmptyState />
        ) : loadingTimeline ? (
          <TimelineSkeleton />
        ) : timelineData.length === 0 ? (
          <EmptyTimeline />
        ) : (
          <div className="space-y-6">
            {/* STATS */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <StatsBadge label="Créditos" value={stats.credito} color="emerald" />
              <StatsBadge label="Débitos" value={stats.debito} color="rose" />
              <StatsBadge
                label="Saldo"
                value={saldo}
                color={saldo >= 0 ? "emerald" : "rose"}
              />
            </div>

            {/* Timeline */}
            <div className="relative space-y-0">
              <div className="absolute left-[27px] top-4 bottom-4 w-px bg-border z-0" />
              {timelineData.map((t) => (
                <TimelineItem key={t.id} transaction={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   SUB COMPONENTES
   ========================================================================= */

function TimelineItem({ transaction: t }) {
  const isCredito = t.movimento === "credito";

  const dotClass =
    t.status === "pago"
      ? "bg-emerald-500 ring-emerald-100"
      : t.status === "atrasado"
      ? "bg-red-500 ring-red-100"
      : "bg-amber-400 ring-amber-100";

  return (
    <div className="relative pl-16 py-2 group">
      {/* Bolinha */}
      <div
        className={cn(
          "absolute left-[22px] top-6 w-3 h-3 rounded-full ring-4 z-10 transition-all duration-300 group-hover:scale-110",
          dotClass
        )}
      />

      <Card className="p-4 flex flex-col sm:flex-row gap-4 items-start justify-between shadow-sm transition-all duration-200 border">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {isCredito ? (
              <ArrowUpCircle className="text-emerald-500 w-5 h-5" />
            ) : (
              <ArrowDownCircle className="text-rose-500 w-5 h-5" />
            )}

            <span className="font-bold text-sm text-foreground">
              {t.descricao || "Movimentação"}
            </span>

            {t.automatico && (
              <Badge className="bg-muted text-muted-foreground text-[10px]">
                automático
              </Badge>
            )}

            <Badge
              className={cn(
                "text-[10px] font-bold uppercase shadow-none border-none px-2 py-0.5 ml-2",
                t.status === "pago"
                  ? "bg-emerald-100 text-emerald-700"
                  : t.status === "atrasado"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              {t.status}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar size={13} />
              Vencimento:{" "}
              <span className="font-medium text-foreground">
                {formatDateBR(t.data_vencimento)}
              </span>
            </div>

            {t.data_pagamento && (
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 size={13} />
                Pago em: {formatDateBR(t.data_pagamento)}
              </div>
            )}
          </div>

          {/* ✅ Tipo e IDs (bem detalhado, do jeito que você pediu) */}
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {t.tipo || "—"}
            </span>
            {t.aluguel_base_id ? (
              <>
                {" "}
                • aluguel_base_id:{" "}
                <span className="font-mono">{t.aluguel_base_id}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="text-right min-w-[140px]">
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">
            {isCredito ? "Crédito" : "Débito"}
          </p>

          <p
            className={cn(
              "text-lg font-black tracking-tight",
              isCredito ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {formatMoneyBRL(t.valor)}
          </p>
        </div>
      </Card>
    </div>
  );
}

function StatsBadge({ label, value, color }) {
  return (
    <div
      className={cn(
        "p-3 rounded-lg border text-center",
        color === "emerald" &&
          "text-emerald-700 bg-emerald-50 border-emerald-100",
        color === "rose" && "text-rose-700 bg-rose-50 border-rose-100"
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="text-sm font-black mt-0.5">
        {formatMoneyCompactBRL(value)}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl bg-muted/10">
      <div className="p-4 bg-muted rounded-full mb-4">
        <Search className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h4 className="text-lg font-medium text-foreground">
        Selecione um inquilino e um contrato
      </h4>
      <p className="text-sm text-muted-foreground max-w-xs mt-1">
        Escolha o inquilino vigente e depois selecione um contrato para visualizar
        o extrato completo.
      </p>
    </div>
  );
}

function EmptyTimeline() {
  return (
    <div className="text-center py-16 bg-muted/20 rounded-xl border border-border">
      <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
      <p className="text-muted-foreground font-medium">
        Nenhuma movimentação encontrada nesse contrato.
      </p>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6 pt-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 pl-4 relative">
          <Skeleton className="h-4 w-4 rounded-full absolute left-[20px] top-6" />
          <Skeleton className="h-24 w-full rounded-xl ml-12" />
        </div>
      ))}
    </div>
  );
}
