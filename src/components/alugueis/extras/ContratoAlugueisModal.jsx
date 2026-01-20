"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import React from "react"; // Necessário para React.Fragment

import Modal from "@/components/admin/ui/Modal";
import { Card } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";

// Importando seus componentes de tabela compartilhados
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/ui/Table";

import {
  ChevronDown,
  ChevronRight,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertCircle,
} from "lucide-react";

// ==========================================
// HELPERS
// ==========================================
function formatBRL(v) {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(v));
}

function formatDateBR(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("pt-BR");
}

function groupByVencimento(transacoes) {
  const map = new Map();
  for (const t of transacoes || []) {
    const key = t.data_vencimento || "sem-data";
    if (!map.has(key)) {
      map.set(key, {
        data_vencimento: t.data_vencimento,
        transacoes: [],
      });
    }
    map.get(key).transacoes.push(t);
  }
  return Array.from(map.values()).sort((a, b) => {
    return (
      new Date(a.data_vencimento).getTime() -
      new Date(b.data_vencimento).getTime()
    );
  });
}

const TIPOS_ALUGUEL = ["receita_aluguel", "multa", "juros", "taxa_contrato"];
const TIPOS_REPASSE = ["repasse_proprietario", "taxa_adm_imobiliaria"];

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function ContratoAlugueisModal({ isOpen, onClose, contratoId }) {
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [openRows, setOpenRows] = useState({});

  const toggleRow = (key) => {
    setOpenRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/alugueis?view=timeline_locador&contrato_id=${contratoId}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar aluguéis");
      setTimeline(json.data || []);
    } catch (err) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contratoId, toastError]);

  useEffect(() => {
    if (isOpen && contratoId) fetchTimeline();
  }, [isOpen, contratoId, fetchTimeline]);

  const grupos = useMemo(() => {
    const base = groupByVencimento(timeline);
    return base.map((g) => {
      const aluguelItems = g.transacoes.filter((t) =>
        TIPOS_ALUGUEL.includes(t.tipo)
      );
      const repasseItems = g.transacoes.filter((t) =>
        TIPOS_REPASSE.includes(t.tipo)
      );

      // Cálculos (mantidos da sua lógica original)
      const valorAluguelTotal = aluguelItems.reduce(
        (acc, t) => acc + Number(t.valor || 0),
        0
      );
      const pagamentos = aluguelItems
        .map((t) => t.data_pagamento)
        .filter(Boolean);
      const dataPagamento = pagamentos.length
        ? pagamentos[pagamentos.length - 1]
        : null;
      const valorPago = aluguelItems
        .filter((t) => t.status === "pago")
        .reduce((acc, t) => acc + Number(t.valor || 0), 0);

      const valorRepasseTotal = repasseItems.reduce(
        (acc, t) => acc + Number(t.valor || 0),
        0
      );
      const repasses = repasseItems
        .map((t) => t.data_pagamento)
        .filter(Boolean);
      const dataRepasse = repasses.length
        ? repasses[repasses.length - 1]
        : null;
      const repassado = repasseItems.some((t) => t.status === "pago");

      return {
        key: g.data_vencimento,
        aluguelItems,
        repasseItems,
        resumo: {
          aluguel: {
            data_vencimento: g.data_vencimento,
            valor: valorAluguelTotal,
            data_pagamento: dataPagamento,
            valor_pago: valorPago > 0 ? valorPago : null,
          },
          repasse: {
            data_para_repasse: g.data_vencimento,
            valor: valorRepasseTotal,
            data_repasse: dataRepasse,
            repassado,
            valor_pago: repasseItems
              .filter((t) => t.status === "pago")
              .reduce((acc, t) => acc + Number(t.valor || 0), 0),
          },
        },
      };
    });
  }, [timeline]);

  return (
    /* Aumentei a largura máxima do modal (max-w-6xl ou max-w-7xl) 
       para as tabelas ficarem confortáveis lado a lado 
    */
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Aluguéis e Repasses"
      className="max-w-7xl w-full" 
    >
      {loading ? (
        <div className="space-y-4 p-4">
          <Skeleton className="h-12 w-full rounded-md" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/40">
            <AlertCircle size={16} />
            <p>
              Visualize abaixo a composição detalhada dos valores recebidos (Aluguel) e transferidos (Repasse). Clique nas linhas para expandir os detalhes.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            
            {/* =======================
                TABELA ALUGUEL
               ======================= */}
            <Card className="flex flex-col overflow-hidden shadow-sm">
              <div className="p-4 border-b bg-muted/10 flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                    <DollarSign size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Recebimento de Aluguel</h3>
                    <p className="text-xs text-muted-foreground">O que o inquilino paga</p>
                </div>
              </div>

              <div className="flex-1">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead className="text-right">Pago</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {grupos.map((g) => {
                      const open = !!openRows[g.key];
                      const resumo = g.resumo.aluguel;

                      return (
                        <React.Fragment key={`aluguel-${g.key}`}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleRow(g.key)}
                            data-state={open ? "selected" : ""}
                          >
                            <TableCell className="py-3">
                              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatDateBR(resumo.data_vencimento)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatBRL(resumo.valor)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDateBR(resumo.data_pagamento)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatBRL(resumo.valor_pago)}
                            </TableCell>
                          </TableRow>

                          {/* EXPANDED ROW ALUGUEL */}
                          {open && (
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={5} className="p-0">
                                <div className="p-4 pl-12 border-b border-border/50 space-y-3 shadow-inner">
                                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Detalhamento da Fatura
                                  </p>
                                  {g.aluguelItems.length === 0 ? (
                                    <span className="text-sm text-muted-foreground italic">
                                      Sem transações.
                                    </span>
                                  ) : (
                                    <div className="space-y-2">
                                      {g.aluguelItems.map((t) => (
                                        <div key={t.id} className="flex justify-between items-center text-sm border-b border-border/40 last:border-0 pb-2 last:pb-0">
                                          <div className="flex items-center gap-2">
                                            <ArrowUpCircle size={14} className="text-emerald-500" />
                                            <span className="capitalize text-foreground/80">
                                              {t.tipo.replaceAll("_", " ")}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-background border text-muted-foreground">
                                              {t.status}
                                            </span>
                                          </div>
                                          <span className="font-medium tabular-nums">
                                            {formatBRL(t.valor)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* =======================
                TABELA REPASSE
               ======================= */}
            <Card className="flex flex-col overflow-hidden shadow-sm">
              <div className="p-4 border-b bg-muted/10 flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <ArrowDownCircle size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Repasse ao Proprietário</h3>
                    <p className="text-xs text-muted-foreground">Líquido a receber</p>
                </div>
              </div>

              <div className="flex-1">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Previsão</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead>Efetuado</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right">Pago</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {grupos.map((g) => {
                      const open = !!openRows[g.key];
                      const resumo = g.resumo.repasse;

                      return (
                        <React.Fragment key={`repasse-${g.key}`}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleRow(g.key)}
                            data-state={open ? "selected" : ""}
                          >
                            <TableCell className="py-3">
                              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatDateBR(resumo.data_para_repasse)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatBRL(resumo.valor)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDateBR(resumo.data_repasse)}
                            </TableCell>
                            <TableCell className="text-center">
                              {resumo.repassado ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30 text-lg">•</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-blue-600 dark:text-blue-400">
                              {formatBRL(resumo.valor_pago)}
                            </TableCell>
                          </TableRow>

                          {/* EXPANDED ROW REPASSE */}
                          {open && (
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={6} className="p-0">
                                <div className="p-4 pl-12 border-b border-border/50 space-y-3 shadow-inner">
                                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Detalhamento do Repasse
                                  </p>
                                  {g.repasseItems.length === 0 ? (
                                    <span className="text-sm text-muted-foreground italic">
                                      Sem transações.
                                    </span>
                                  ) : (
                                    <div className="space-y-2">
                                      {g.repasseItems.map((t) => {
                                        const isTaxa = t.tipo === "taxa_adm_imobiliaria";
                                        return (
                                          <div key={t.id} className="flex justify-between items-center text-sm border-b border-border/40 last:border-0 pb-2 last:pb-0">
                                            <div className="flex items-center gap-2">
                                              {isTaxa ? (
                                                <ArrowDownCircle size={14} className="text-red-500" />
                                              ) : (
                                                <ArrowDownCircle size={14} className="text-foreground/70" />
                                              )}
                                              <span className={isTaxa ? "text-red-600 font-medium" : "text-foreground/80 capitalize"}>
                                                {t.descricao || t.tipo.replaceAll("_", " ")}
                                              </span>
                                              <span className="text-xs px-2 py-0.5 rounded-full bg-background border text-muted-foreground">
                                                {t.status}
                                              </span>
                                            </div>
                                            <span className={isTaxa ? "text-red-600 font-semibold" : "font-medium tabular-nums"}>
                                              {isTaxa ? "-" : ""}{formatBRL(t.valor)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </Modal>
  );
}