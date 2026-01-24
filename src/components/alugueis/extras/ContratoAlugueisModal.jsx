"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import React from "react";

import Modal from "@/components/admin/ui/Modal";
import { Card } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";

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

import { formatBRL, formatDateBR } from "@/utils/currency"

// ==========================================
// HELPERS
// ==========================================


function toCompetenciaFromISO(isoDate) {
  if (!isoDate) return null;
  const [y, m] = String(isoDate).split("-");
  if (!y || !m) return null;
  return `${y}-${m}`;
}

function getCompetencia(t) {
  if (!t) return null;

  const raw = t?.dados_cobranca_json;

  if (raw && typeof raw === "object" && raw.competencia) {
    return raw.competencia;
  }

  if (raw && typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.competencia) return parsed.competencia;
    } catch (e) {}
  }

  return toCompetenciaFromISO(t.data_vencimento);
}

function groupByCompetencia(transacoes) {
  const map = new Map();

  for (const t of transacoes || []) {
    const competencia = getCompetencia(t) || "sem-competencia";

    if (!map.has(competencia)) {
      map.set(competencia, {
        competencia,
        transacoes: [],
      });
    }

    map.get(competencia).transacoes.push(t);
  }

  return Array.from(map.values()).sort((a, b) => {
    return String(a.competencia).localeCompare(String(b.competencia));
  });
}

function isCompetenciaAteMesAtual(competenciaYYYYMM) {
  if (!competenciaYYYYMM || competenciaYYYYMM === "sem-competencia") return false;

  const now = new Date();
  const compAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}`;

  return competenciaYYYYMM <= compAtual;
}

function getMenorVencimentoDoGrupo(transacoes) {
  const datas = (transacoes || [])
    .map((t) => t.data_vencimento)
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return datas.length ? datas[0] : null;
}

function getUltimaDataPagamento(transacoes) {
  const datas = (transacoes || [])
    .map((t) => t.data_pagamento)
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return datas.length ? datas[datas.length - 1] : null;
}

/**
 * ✅ Soma financeira correta:
 * - entrada soma
 * - saida subtrai
 */
function somarPorNatureza(itens) {
  return (itens || []).reduce((acc, t) => {
    const valor = Number(t.valor || 0);
    const natureza = t.natureza;

    if (natureza === "saida") return acc - valor;
    return acc + valor;
  }, 0);
}

/**
 * ✅ Calcula valor "pago" também respeitando natureza
 */
function somarPagosPorNatureza(itens) {
  return (itens || [])
    .filter((t) => t.status === "pago")
    .reduce((acc, t) => {
      const valor = Number(t.valor || 0);
      const natureza = t.natureza;

      if (natureza === "saida") return acc - valor;
      return acc + valor;
    }, 0);
}

// ==========================================
// TIPOS
// ==========================================
const TIPOS_ALUGUEL = [
  "receita_aluguel",
  "multa",
  "juros",
  "taxa_contrato",

  "seguro_incendio",
  "seguro_fianca",
  "condominio",
  "iptu",
  "consumo_agua",
  "consumo_luz",
  "gas",
  "fundo_reserva",
  "taxa",
  "boleto",
  "outros",
  "desconto_aluguel",

  // ✅ aqui entra seu exemplo:
  // manutenção por conta do locador (natureza = saida)
  "manutencao",
  "despesa_manutencao",
];

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
    const base = groupByCompetencia(timeline);

    const filtrado = base.filter((g) => isCompetenciaAteMesAtual(g.competencia));

    const filtradoSemLixo = filtrado.filter((g) => {
      const aluguelItems = (g.transacoes || []).filter((t) =>
        TIPOS_ALUGUEL.includes(t.tipo)
      );
      const repasseItems = (g.transacoes || []).filter((t) =>
        TIPOS_REPASSE.includes(t.tipo)
      );

      const somaAluguel = somarPorNatureza(aluguelItems);
      const somaRepasse = somarPorNatureza(repasseItems);

      return somaAluguel !== 0 || somaRepasse !== 0;
    });

    return filtradoSemLixo.map((g) => {
      const dataVencimentoGrupo = getMenorVencimentoDoGrupo(g.transacoes);

      const aluguelItems = g.transacoes.filter((t) =>
        TIPOS_ALUGUEL.includes(t.tipo)
      );

      const repasseItems = g.transacoes.filter((t) =>
        TIPOS_REPASSE.includes(t.tipo)
      );

      // =============================
      // ✅ RESUMO ALUGUEL (COM NATUREZA)
      // =============================
      const valorAluguelTotal = somarPorNatureza(aluguelItems);

      const dataPagamento = getUltimaDataPagamento(aluguelItems);

      const valorPago = somarPagosPorNatureza(aluguelItems);

      // =============================
      // ✅ RESUMO REPASSE (AGORA MOSTRA O VALOR REPASSADO)
      // =============================
      const repasseProprietarioItems = repasseItems.filter(
        (t) => t.tipo === "repasse_proprietario"
      );

      const taxaAdmItems = repasseItems.filter(
        (t) => t.tipo === "taxa_adm_imobiliaria"
      );

      // valor que aparece na linha (topo): SOMENTE repasse ao proprietário
      const valorRepassadoTopo = repasseProprietarioItems.reduce(
        (acc, t) => acc + Number(t.valor || 0),
        0
      );

      const valorRepassadoPagoTopo = repasseProprietarioItems
        .filter((t) => t.status === "pago")
        .reduce((acc, t) => acc + Number(t.valor || 0), 0);

      const dataRepasse = getUltimaDataPagamento(repasseProprietarioItems);
      const repassado = repasseProprietarioItems.some((t) => t.status === "pago");

      /**
       * ✅ Itens do detalhamento do repasse:
       * Queremos explicar a conta:
       * - "Aluguel base" positivo
       * - "Taxa adm" negativo
       *
       * OBS: eu vou pegar o "receita_aluguel" pra explicar (principal)
       */
      const aluguelBaseItems = g.transacoes.filter(
        (t) => t.tipo === "receita_aluguel"
      );

      // pega o primeiro aluguel base do mês (normalmente só tem 1)
      const aluguelBaseValor = aluguelBaseItems.length
        ? Number(aluguelBaseItems[0]?.valor || 0)
        : 0;

      const taxaAdmTotal = taxaAdmItems.reduce(
        (acc, t) => acc + Number(t.valor || 0),
        0
      );

      return {
        key: g.competencia,
        competencia: g.competencia,

        aluguelItems,
        repasseItems,

        // extras para o detalhamento do repasse explicar a conta
        repasseDetalhe: {
          aluguelBaseValor,
          taxaAdmTotal,
        },

        resumo: {
          aluguel: {
            data_vencimento: dataVencimentoGrupo,
            valor: valorAluguelTotal,
            data_pagamento: dataPagamento,
            valor_pago: valorPago !== 0 ? valorPago : null,
          },
          repasse: {
            data_para_repasse: dataVencimentoGrupo,

            // ✅ na linha de cima, não é mais "bruto"
            valor: valorRepassadoTopo,

            data_repasse: dataRepasse,
            repassado,

            // ✅ pago = somente repasse pago
            valor_pago: valorRepassadoPagoTopo,
          },
        },
      };
    });
  }, [timeline]);

  return (
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
              Visualize abaixo a composição detalhada dos valores recebidos
              (Aluguel) e transferidos (Repasse). Clique nas linhas para expandir
              os detalhes.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {/* =======================
                TABELA ALUGUEL
               ======================= */}
            <Card className="flex flex-col overflow-hidden shadow-sm">
              <div className="p-4 border-b bg-muted/10 flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                  <DollarSign
                    size={18}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Recebimento de Aluguel
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    O que o inquilino paga
                  </p>
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
                              {open ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
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
                                      {g.aluguelItems.map((t) => {
                                        const isSaida = t.natureza === "saida";

                                        return (
                                          <div
                                            key={t.id}
                                            className="flex justify-between items-center text-sm border-b border-border/40 last:border-0 pb-2 last:pb-0"
                                          >
                                            <div className="flex items-center gap-2">
                                              <ArrowUpCircle
                                                size={14}
                                                className="text-emerald-500"
                                              />
                                              <span className="capitalize text-foreground/80">
                                                {t.descricao ||
                                                  t.tipo.replaceAll("_", " ")}
                                              </span>
                                            </div>

                                            <span
                                              className={
                                                "font-medium tabular-nums " +
                                                (isSaida ? "text-red-600" : "text-emerald-600")
                                              }
                                            >
                                              {isSaida ? "-" : ""}
                                              {formatBRL(t.valor)}
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

            {/* =======================
                TABELA REPASSE
               ======================= */}
            <Card className="flex flex-col overflow-hidden shadow-sm">
              <div className="p-4 border-b bg-muted/10 flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <ArrowDownCircle
                    size={18}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">
                    Repasse ao Proprietário
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Líquido a receber
                  </p>
                </div>
              </div>

              <div className="flex-1">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Previsão</TableHead>

                      {/* ✅ Mantive o nome "Bruto" pra não mexer no design,
                          mas agora o valor aqui é o REPASSE topo */}
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
                              {open ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                            </TableCell>

                            <TableCell className="font-medium">
                              {formatDateBR(resumo.data_para_repasse)}
                            </TableCell>

                            {/* ✅ AGORA É O VALOR REPASSADO NO TOPO */}
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
                                <span className="text-muted-foreground/30 text-lg">
                                  •
                                </span>
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

                                  {/* ✅ Agora o detalhamento explica a conta do repasse */}
                                  <div className="space-y-2">
                                    {/* ALUGUEL BASE (positivo) */}
                                    <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                      <div className="flex items-center gap-2">
                                        <ArrowDownCircle
                                          size={14}
                                          className="text-foreground/70"
                                        />
                                        <span className="text-foreground/80 capitalize">
                                          Aluguel base do mês
                                        </span>
                                      </div>
                                      <span className="font-medium tabular-nums">
                                        {formatBRL(g.repasseDetalhe.aluguelBaseValor)}
                                      </span>
                                    </div>

                                    {/* TAXA ADM (negativo) */}
                                    <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                                      <div className="flex items-center gap-2">
                                        <ArrowDownCircle
                                          size={14}
                                          className="text-red-500"
                                        />
                                        <span className="text-red-600 font-medium">
                                          Taxa Administração
                                        </span>
                                      </div>
                                      <span className="text-red-600 font-semibold tabular-nums">
                                        -{formatBRL(Math.abs(g.repasseDetalhe.taxaAdmTotal))}
                                      </span>
                                    </div>

                                      {/* ✅ Itens extras do repasse (tirando taxa e repasse, pq já explicamos acima) */}
                                      {g.repasseItems
                                      .filter((t) => t.tipo !== "taxa_adm_imobiliaria" && t.tipo !== "repasse_proprietario")
                                      .length === 0 ? (
                                      <span className="text-sm text-muted-foreground italic">
                                        Sem outros lançamentos.
                                      </span>
                                      ) : (
                                      <div className="space-y-2">
                                        {g.repasseItems
                                          .filter((t) => t.tipo !== "taxa_adm_imobiliaria" && t.tipo !== "repasse_proprietario")
                                          .map((t) => {
                                            const isSaida = t.natureza === "saida";
                                            return (
                                              <div
                                                key={t.id}
                                                className="flex justify-between items-center text-sm border-b border-border/40 last:border-0 pb-2 last:pb-0"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <ArrowDownCircle
                                                    size={14}
                                                    className={isSaida ? "text-red-500" : "text-emerald-500"}
                                                  />
                                                  <span className={isSaida ? "text-red-600 font-medium" : "text-foreground/80 capitalize"}>
                                                    {t.descricao || t.tipo.replaceAll("_", " ")}
                                                  </span>
                                                  <span className="text-xs px-2 py-0.5 rounded-full bg-background border text-muted-foreground">
                                                    {t.status}
                                                  </span>
                                                </div>

                                                <span
                                                  className={
                                                    "font-medium tabular-nums " +
                                                    (isSaida ? "text-red-600" : "text-emerald-600")
                                                  }
                                                >
                                                  {isSaida ? "-" : ""}
                                                  {formatBRL(t.valor)}
                                                </span>
                                              </div>
                                            );
                                          })}
                                      </div>
                                      )}
                                  </div>
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
