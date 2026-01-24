"use client";

import { useEffect, useMemo, useState, useCallback, Fragment } from "react";
import {
  BarChart3,
  RotateCcw,
  Wallet,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import Badge from "@/components/admin/ui/Badge";
import { useToast } from "@/contexts/ToastContext";
import FinanceiroResumo from "./FinanceiroResumo";
import { formatCurrency } from "@/utils/formatters";
import { Input } from "../admin/ui/Form";

const MODULO = "ALUGUEL";

export default function FluxoCaixaPanel() {
  const toast = useToast();

  const [loading, setLoading] = useState(true);

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  // ✅ Agora o fluxo usa SÓ o financeiro
  const [transacoes, setTransacoes] = useState([]);

  // ✅ controla expansão dos grupos
  const [expandido, setExpandido] = useState({});

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

      setTransacoes(json.data || []);
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
     REGRAS
  ========================== */
  const limparFiltros = () => {
    setDataInicio("");
    setDataFim("");
  };

  const dentroDoPeriodo = useCallback(
    (data) => {
      if (!data) return false;

      const dt = new Date(data);
      const inicio = dataInicio ? new Date(dataInicio) : null;
      const fim = dataFim ? new Date(dataFim) : null;

      if (inicio && dt < inicio) return false;
      if (fim && dt > fim) return false;

      return true;
    },
    [dataInicio, dataFim]
  );

  /* =========================
     AGRUPAR ALUGUÉIS (BASE + ITENS)
  ========================== */
  const gruposAluguel = useMemo(() => {
    const map = new Map();

    // ✅ 1) cria grupos (base = receita_aluguel sem aluguel_base_id)
    for (const t of transacoes || []) {
      if (t.status !== "pago") continue;

      // base do aluguel
      if (t.tipo === "receita_aluguel" && !t.aluguel_base_id) {
        map.set(t.id, {
          aluguelBase: t,
          itens: [],
        });
      }
    }

    // ✅ 2) adiciona filhos (itens que possuem aluguel_base_id)
    for (const t of transacoes || []) {
      if (t.status !== "pago") continue;
      if (!t.aluguel_base_id) continue;

      if (map.has(t.aluguel_base_id)) {
        map.get(t.aluguel_base_id).itens.push(t);
      }
    }

    return Array.from(map.values());
  }, [transacoes]);

  /* =========================
     EXTRATO (SÓ FINANCEIRO)
  ========================== */
  const extrato = useMemo(() => {
    const linhas = [];

    const idsUsados = new Set();

    // ✅ 1) ALUGUÉIS AGRUPADOS
    for (const g of gruposAluguel) {
      const base = g.aluguelBase;
      if (!base) continue;

      const data = base.data_pagamento || base.data_vencimento;
      if (!dentroDoPeriodo(data)) continue;

      // ✅ total bruto do grupo:
      // base entra positivo, filhos podem ser entrada/saída
      const totalGrupo =
        Number(base.valor || 0) +
        (g.itens || []).reduce((acc, it) => {
          const valor = Number(it.valor || 0);
          if (it.natureza === "saida") return acc - valor;
          return acc + valor;
        }, 0);

      // marca IDs como usados (pra não entrar duplicado depois)
      idsUsados.add(base.id);
      for (const it of g.itens || []) idsUsados.add(it.id);

      linhas.push({
        type: "ALUGUEL_BASE",
        id: base.id,
        data,
        descricao: base.descricao || "Aluguel",
        locador: base?.contrato?.locadorNome || "-",
        locatario: base?.contrato?.locatarioNome || "-",
        valorEntrada: totalGrupo > 0 ? totalGrupo : 0,
        valorSaida: totalGrupo < 0 ? Math.abs(totalGrupo) : 0,
        itens: [base, ...(g.itens || [])],
      });
    }

    // ✅ 2) RESTO DAS TRANSAÇÕES PAGAS (fora de aluguel agrupado)
    for (const t of transacoes || []) {
      if (!t) continue;
      if (t.status !== "pago") continue;

      // se já foi usado no grupo, não duplica
      if (idsUsados.has(t.id)) continue;

      const data = t.data_pagamento || t.data_vencimento;
      if (!dentroDoPeriodo(data)) continue;

      linhas.push({
        type: "OPERACIONAL",
        id: t.id,
        data,
        descricao: t.descricao || "—",
        locador: t?.contrato?.locadorNome || "",
        locatario: t?.contrato?.locatarioNome || "",
        valorEntrada: t.natureza === "entrada" ? Number(t.valor || 0) : 0,
        valorSaida: t.natureza === "saida" ? Number(t.valor || 0) : 0,
      });
    }

    // ✅ ordenar por data crescente (fluxo)
    linhas.sort((a, b) => {
      const ta = a?.data ? new Date(a.data).getTime() : 0;
      const tb = b?.data ? new Date(b.data).getTime() : 0;
      return ta - tb;
    });

    return linhas;
  }, [transacoes, gruposAluguel, dentroDoPeriodo]);

  /* =========================
     KPIs
  ========================== */
  const totalEntradas = useMemo(() => {
    return extrato.reduce((sum, x) => sum + Number(x.valorEntrada || 0), 0);
  }, [extrato]);

  const totalSaidas = useMemo(() => {
    return extrato.reduce((sum, x) => sum + Number(x.valorSaida || 0), 0);
  }, [extrato]);

  const saldo = totalEntradas - totalSaidas;

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 size={18} />
          Fluxo de Caixa (Aluguéis)
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
      <FinanceiroResumo dados={extrato} />

      {/* EXTRATO */}
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
            {extrato.map((d) => {
              const isAluguel = d.type === "ALUGUEL_BASE";
              const temItens = isAluguel && (d.itens?.length || 0) > 0;

              return (
                <Fragment key={`${d.type}-${d.id}`}>
                  <tr
                    className={`border-b last:border-0 ${
                      isAluguel && temItens ? "cursor-pointer" : ""
                    }`}
                    onClick={() => {
                      if (!isAluguel) return;
                      if (!temItens) return;

                      setExpandido((prev) => ({
                        ...prev,
                        [d.id]: !prev[d.id],
                      }));
                    }}
                  >
                    <td className="p-2">
                      {d.data ? new Date(d.data).toLocaleDateString() : "—"}
                    </td>

                    <td className="p-2">
                      <div className="flex items-start gap-2">
                        {isAluguel && temItens ? (
                          <span className="pt-0.5 text-muted-foreground">
                            {expandido[d.id] ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </span>
                        ) : (
                          <span className="w-[16px]" />
                        )}

                        <div className="flex flex-col">
                          <span className="font-medium">{d.descricao}</span>

                          {d.locador ? (
                            <span className="text-xs text-muted-foreground">
                              Locador: {d.locador}
                            </span>
                          ) : null}

                          {d.locatario ? (
                            <span className="text-xs text-muted-foreground">
                              Locatário: {d.locatario}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    <td className="p-2 text-right font-medium text-green-600">
                      {d.valorEntrada ? formatCurrency(d.valorEntrada) : "—"}
                    </td>

                    <td className="p-2 text-right font-medium text-red-600">
                      {d.valorSaida ? formatCurrency(d.valorSaida) : "—"}
                    </td>
                  </tr>

                  {/* EXPANDIDO: itens do aluguel */}
                  {isAluguel && expandido[d.id] && temItens && (
                    <tr className="bg-muted/30">
                      <td colSpan={4} className="p-3">
                        <div className="space-y-2">
                          {[...(d.itens || [])].map((it) => {
                            const isSaida = it.natureza === "saida";

                            return (
                              <div
                                key={it.id}
                                className="flex justify-between text-xs"
                              >
                                <span
                                  className={
                                    isSaida ? "text-red-600" : "text-green-700"
                                  }
                                >
                                  {it.descricao || it.tipo}
                                </span>

                                <span
                                  className={`font-medium ${
                                    isSaida ? "text-red-600" : "text-green-700"
                                  }`}
                                >
                                  {formatCurrency(
                                    isSaida
                                      ? -Number(it.valor || 0)
                                      : Number(it.valor || 0)
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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
