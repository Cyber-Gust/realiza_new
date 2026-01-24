"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Modal from "@/components/admin/ui/Modal";
import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
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

import { TrendingUp, Save, Loader2, User2 } from "lucide-react";

import {
  formatBRL,
  parseCurrencyToNumber,
  formatDateBR,
  formatPercentInput,
  parsePercentToNumber,
} from "@/utils/currency";
import { Input } from "@/components/admin/ui/Form";

export default function ContratoReajustesModal({
  isOpen,
  onClose,
  contratoId,
  valorAtualContrato,
  onSaved,
}) {
  const { error: toastError, success: toastSuccess } = useToast();

  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [reajustes, setReajustes] = useState([]);

  // inputs novo reajuste
  const [percent, setPercent] = useState(""); // ex: "10,50"
  const [novoValor, setNovoValor] = useState(""); // ex: "R$ 1.200,50"

  const valorAntigo = useMemo(() => {
    return Number(valorAtualContrato || 0);
  }, [valorAtualContrato]);

  // ✅ Quando abrir modal, resetar inputs pra evitar lixo no estado
  useEffect(() => {
    if (isOpen) {
      setPercent("");
      setNovoValor("");
    }
  }, [isOpen]);

  // ==============================
  // FETCH REAJUSTES (DO JSONB NO CONTRATO)
  // ==============================
  const fetchReajustes = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/contratos/reajuste?contrato_id=${contratoId}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar reajustes");

      setReajustes(json.data?.historico || []);
    } catch (err) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contratoId, toastError]);

  useEffect(() => {
    if (isOpen && contratoId) fetchReajustes();
  }, [isOpen, contratoId, fetchReajustes]);

  // ==============================
  // INPUT % → CALCULA VALOR NOVO (BRL)
  // ==============================
  const handleChangePercent = (val) => {
    const formatted = formatPercentInput(val);
    setPercent(formatted);

    const pctNum = parsePercentToNumber(formatted);

    if (pctNum === null) {
      setNovoValor("");
      return;
    }

    const novo = valorAntigo * (1 + pctNum / 100);
    setNovoValor(formatBRL(novo));
  };

  // ==============================
  // INPUT BRL → CALCULA %
  // ==============================
  const handleChangeNovoValor = (val) => {
    const parsed = parseCurrencyToNumber(val);

    // se apagar tudo
    if (!val) {
      setNovoValor("");
      setPercent("");
      return;
    }

    // mantém preenchedor BRL
    setNovoValor(formatBRL(parsed));

    if (!valorAntigo || valorAntigo <= 0) {
      setPercent("");
      return;
    }

    if (!parsed || parsed <= 0) {
      setPercent("");
      return;
    }

    const pct = ((parsed - valorAntigo) / valorAntigo) * 100;

    // transforma em formato "preenchedor" de porcentagem
    const pctDigits = String(Math.round(pct * 100)); // ex: 10,50 -> "1050"
    setPercent(formatPercentInput(pctDigits));
  };

  // ==============================
  // SALVAR REAJUSTE
  // ==============================
  const handleSalvar = async () => {
    try {
      if (!contratoId) return;

      const pctFinal = parsePercentToNumber(percent);
      const newNum = parseCurrencyToNumber(novoValor);

      if (!valorAntigo || valorAntigo <= 0) {
        toastError("Valor antigo inválido no contrato.");
        return;
      }

      if (!newNum || newNum <= 0) {
        toastError("Informe um valor novo válido.");
        return;
      }

      if (Number(newNum) === Number(valorAntigo)) {
        toastError("O valor novo não pode ser igual ao valor atual.");
        return;
      }

      setSalvando(true);

      const res = await fetch(`/api/contratos/reajuste`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contrato_id: contratoId,
          percentual: pctFinal, // pode ser null
          valor_novo: newNum,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao realizar reajuste");

      toastSuccess("Reajuste aplicado com sucesso ✅");

      await fetchReajustes();

      setPercent("");
      setNovoValor("");

      if (onSaved) await onSaved();
    } catch (err) {
      toastError(err.message);
    } finally {
      setSalvando(false);
    }
  };

  // ==============================
  // UI
  // ==============================
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reajustes manuais do contrato"
      className="max-w-6xl w-full"
    >
      <div className="space-y-5">
        <Card className="p-4 border border-border bg-muted/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-primary" />
                <h3 className="font-semibold text-foreground">
                  Controle de reajustes manuais
                </h3>
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                Reajustes manuais ajustam o valor do contrato e atualizam os
                próximos aluguéis (a partir do próximo mês).
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                Valor atual do aluguel
              </p>
              <p className="font-bold text-lg tabular-nums">
                {formatBRL(valorAntigo)}
              </p>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[140px]">Data</TableHead>
                  <TableHead className="text-right">Valor antigo</TableHead>
                  <TableHead className="text-right">% reajuste</TableHead>
                  <TableHead className="text-right">Valor novo</TableHead>
                  <TableHead className="w-[220px]">Usuário</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {/* HISTÓRICO */}
                {reajustes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center">
                      <span className="text-muted-foreground">
                        Nenhum reajuste manual registrado ainda.
                      </span>
                    </TableCell>
                  </TableRow>
                ) : (
                  reajustes.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {formatDateBR(r.created_at)}
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        {formatBRL(r.valor_antigo)}
                      </TableCell>

                      <TableCell className="text-right tabular-nums">
                        {r.percentual !== null && r.percentual !== undefined
                          ? `${Number(r.percentual).toFixed(2).replace(".", ",")}%`
                          : "—"}
                      </TableCell>

                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatBRL(r.valor_novo)}
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <User2 size={14} />
                          <span>{r.user_nome || "—"}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}

                {/* NOVO REAJUSTE */}
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableCell className="font-semibold">
                    Novo reajuste
                  </TableCell>

                  <TableCell className="text-right tabular-nums font-semibold">
                    {formatBRL(valorAntigo)}
                  </TableCell>

                  <TableCell className="text-right">
                    <Input
                      value={percent}
                      onChange={(e) => handleChangePercent(e.target.value)}
                      placeholder="0,00"
                      disabled={salvando}
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    <Input
                      value={novoValor}
                      onChange={(e) => handleChangeNovoValor(e.target.value)}
                      placeholder="R$ 0,00"
                      disabled={salvando}
                    />
                  </TableCell>

                  <TableCell>
                    <Button
                      onClick={handleSalvar}
                      className="gap-2"
                      disabled={salvando}
                    >
                      {salvando ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Realizar reajuste
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </Modal>
  );
}
