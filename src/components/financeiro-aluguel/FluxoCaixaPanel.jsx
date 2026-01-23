"use client";

import { useEffect, useMemo, useState, useCallback, Fragment } from "react";
import { BarChart3, RotateCcw, Wallet, ChevronDown, ChevronRight } from "lucide-react";

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

  // ✅ vem agrupado por aluguel_base_id (rota receitas-locacao)
  const [alugueis, setAlugueis] = useState([]);

  // ✅ vem do módulo ALUGUEL (mas pode ter coisa que pertence aos aluguéis)
  const [operacional, setOperacional] = useState([]);

  // ✅ controla expansão do aluguel
  const [expandido, setExpandido] = useState({});

  /* =========================
     LOAD
  ========================== */

  const carregar = useCallback(async () => {
    try {
      setLoading(true);

      const [resAlugueis, resOperacional] = await Promise.all([
        fetch(
          `/api/alugueis/receitas-locacao?statusBaixa=baixadas&considerarDataDe=pagamento`,
          { cache: "no-store" }
        ),
        fetch(`/api/financeiro?type=fluxo&modulo=${MODULO}`, { cache: "no-store" }),
      ]);

      const jsonAlugueis = await resAlugueis.json();
      const jsonOperacional = await resOperacional.json();

      if (!resAlugueis.ok) throw new Error(jsonAlugueis.error);
      if (!resOperacional.ok) throw new Error(jsonOperacional.error);

      setAlugueis(jsonAlugueis.data || []);
      setOperacional(jsonOperacional.data || []);
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
     EXTRATO (ALUGUEL + OPERACIONAL)
  ========================== */

  const extrato = useMemo(() => {
    const linhas = [];

    // ✅ IDs já contabilizados nos grupos (pra não duplicar no operacional)
    const idsJaUsados = new Set();

    // ✅ 1) Primeiro: coloca os aluguéis agrupados
    for (const g of alugueis) {
      if (!g?.aluguelBase) continue;

      // ✅ NÃO filtra por g.aluguelBase.baixado no front
      // Quem filtra é a rota (statusBaixa=baixadas)

      const data = g.aluguelBase.dataPagamento || g.aluguelBase.dataVencimento;
      if (!dentroDoPeriodo(data)) continue;

      // ✅ total cheio do aluguel
      const bruto = Number(g?.resumo?.total || 0);

      // ✅ marca IDs reais (itens) como usados
      for (const it of g.itens || []) idsJaUsados.add(it.id);

      linhas.push({
        type: "ALUGUEL_BASE",
        id: g.aluguelBase.id, // id do grupo (aluguel_base_id)
        data,

        descricao: `Aluguel ${g.aluguelBase.dataVencimento?.slice(0, 7) || ""}`,
        locador: g?.contrato?.locadorNome || "-",
        locatario: g?.contrato?.locatarioNome || "-",

        valorEntrada: bruto,
        valorSaida: 0,

        itens: g.itens || [],
        aluguelBase: g.aluguelBase,
      });
    }

    // ✅ 2) Depois: adiciona operacional do módulo ALUGUEL (sem duplicar)
    for (const o of operacional) {
      if (!o) continue;
      if (o.status !== "pago") continue;

      // ✅ se já foi contabilizado dentro dos grupos, não entra
      if (idsJaUsados.has(o.id)) continue;

      // ✅ se for receita_aluguel base, ela já aparece no agrupado, então não duplica
      if (o.tipo === "receita_aluguel") continue;

      const data = o.data_pagamento || o.data_vencimento;
      if (!dentroDoPeriodo(data)) continue;

      const competencia = (o.data_vencimento || o.data_pagamento || "").slice(0, 7);


      linhas.push({
        type: "OPERACIONAL",
        id: o.id,
        data,
        descricao:
          o.tipo === "repasse_proprietario"
            ? `Repasse ${competencia || ""}`
            : o.descricao || "—",
        locatario: o?.contrato?.locatarioNome || "",
        imovelCodigoRef:
          o.tipo === "repasse_proprietario"
            ? o?.contrato?.imovelCodigoRef || ""
            : "",

        valorEntrada: o.natureza === "entrada" ? Number(o.valor || 0) : 0,
        valorSaida: o.natureza === "saida" ? Number(o.valor || 0) : 0,
      });
    }

    // ✅ ordenar por data (crescente)
    linhas.sort((a, b) => {
      const ta = a?.data ? new Date(a.data).getTime() : 0;
      const tb = b?.data ? new Date(b.data).getTime() : 0;
      return ta - tb;
    });

    return linhas;
  }, [alugueis, operacional, dentroDoPeriodo]);

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
                        {/* ✅ setinha só no aluguel */}
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

                          {d.imovelCodigoRef ? (
                            <span className="text-xs text-muted-foreground">
                              Imóvel: {d.imovelCodigoRef}
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

                  {/* filhos do aluguel */}
                  {isAluguel && expandido[d.id] && temItens && (
                    <tr className="bg-muted/30">
                      <td colSpan={4} className="p-3">
                        <div className="space-y-2">
                          {/* ✅ opcional: ordenar pra mostrar aluguel base primeiro */}
                          {[...(d.itens || [])]
                          .sort((a, b) => {
                            if (a.tipo === "receita_aluguel") return -1;
                            if (b.tipo === "receita_aluguel") return 1;
                            return 0;
                          })
                          .map((it) => {
                            const isSaida = it.natureza === "saida";

                            return (
                              <div key={it.id} className="flex justify-between text-xs">
                                <span className={isSaida ? "text-red-600" : "text-green-700"}>
                                  {it.descricao}
                                </span>

                                <span className={`font-medium ${isSaida ? "text-red-600" : "text-green-700"}`}>
                                  {formatCurrency(isSaida ? -Number(it.valor || 0) : Number(it.valor || 0))}
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
