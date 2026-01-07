"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import Badge from "@/components/admin/ui/Badge";
import { useToast } from "@/contexts/ToastContext";
import { formatBRL, parseCurrencyToNumber } from "@/utils/currency";


import {
  Loader2,
  X,
  Wrench,
  FileText,
  Plus,
  Check,
  Trash2,
} from "lucide-react";
import { Input } from "../admin/ui/Form";

export default function OrdemServicoDetailDrawer({
  ordemId,
  onClose,
  onUpdated,
}) {
  const toast = useToast();

  const [ordem, setOrdem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [openAddBudget, setOpenAddBudget] = useState(false);
  const [saving, setSaving] = useState(false);

  const [novoOrcamento, setNovoOrcamento] = useState({
    prestador: "",
    valor: 0,
    prazo_dias: "",
    observacao: "",
  });

  

  /* ======================================================
     LOAD ORDEM
  ====================================================== */
  const loadOrdem = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/manutencao/ordens-servico?id=${ordemId}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const found = json.data?.find((o) => o.id === ordemId);
      setOrdem(found || null);
    } catch (err) {
      toast.error("Erro ao carregar OS", err.message);
    } finally {
      setLoading(false);
    }
  }, [ordemId, toast]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (ordemId) loadOrdem();
  }, [ordemId, loadOrdem]);

  if (!mounted || !ordemId) return null;

  const root = document.getElementById("drawer-root");
  if (!root) return null;

  const orcamentos = ordem?.orcamentos_json || [];

  /* ======================================================
     HELPERS
  ====================================================== */
  const updateOrdem = async (updates) => {
    try {
      setSaving(true);
      const res = await fetch("/api/manutencao/ordens-servico", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ordem.id,
          ...updates,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Ordem de serviço atualizada");
      await loadOrdem();
      onUpdated?.();
    } catch (err) {
      toast.error("Erro ao atualizar OS", err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ======================================================
     ORÇAMENTOS
  ====================================================== */
  const handleAddOrcamento = async () => {
    if (!novoOrcamento.prestador || !novoOrcamento.valor) {
      toast.error("Preencha prestador e valor");
      return;
    }

    const novo = {
      id: crypto.randomUUID(),
      prestador: novoOrcamento.prestador,
      valor: Number(novoOrcamento.valor),
      prazo_dias: novoOrcamento.prazo_dias
        ? Number(novoOrcamento.prazo_dias)
        : null,
      observacao: novoOrcamento.observacao || "",
      status: "pendente",
      created_at: new Date().toISOString(),
    };

    await updateOrdem({
      orcamentos_json: [...orcamentos, novo],
      status: ordem.status === "aberta" ? "orcamento" : ordem.status,
    });

    setNovoOrcamento({
      prestador: "",
      valor: "",
      prazo_dias: "",
      observacao: "",
    });
    setOpenAddBudget(false);
  };

  const handleApprove = async (orcamentoId) => {
    const updated = orcamentos.map((o) => ({
      ...o,
      status: o.id === orcamentoId ? "aprovado" : "rejeitado",
    }));

    const aprovado = updated.find((o) => o.id === orcamentoId);

    await updateOrdem({
      orcamentos_json: updated,
      prestador_aprovado: aprovado.prestador,
      custo_final: aprovado.valor,
      status: "aprovada_pelo_proprietario",
    });
  };

  const handleRemove = async (orcamentoId) => {
    const updated = orcamentos.filter((o) => o.id !== orcamentoId);

    const reset =
      updated.length === 0
        ? {
            prestador_aprovado: null,
            custo_final: null,
            status: "aberta",
          }
        : {};

    await updateOrdem({
      orcamentos_json: updated,
      ...reset,
    });
  };

  /* ======================================================
     RENDER
  ====================================================== */
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:w-[480px] h-full bg-panel-card border-l border-border shadow-xl animate-slide-left flex flex-col overflow-y-auto">

        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Wrench size={18} />
            {ordem?.nome || "Ordem de Serviço"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-72 flex-col text-muted-foreground">
            <Loader2 className="animate-spin" size={22} />
            Carregando…
          </div>
        ) : !ordem ? (
          <div className="p-6 text-center text-muted-foreground">
            Ordem não encontrada.
          </div>
        ) : (
          <div className="p-6 space-y-6 text-sm">

            {/* INFO */}
            <Card className="p-4 space-y-1">
              <p>
               <strong>Nome:</strong> {ordem.nome || "—"}
              </p>
              <p>
                <strong>Imóvel:</strong>{" "}
                {ordem.imovel?.titulo || "—"}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <Badge status={ordem.status}>
                  {ordem.status?.replaceAll("_", " ")}
                </Badge>
              </p>
              <p>
                <strong>Descrição:</strong> {ordem.descricao_problema}
              </p>
              <p>
                <strong>Prestador:</strong>{" "}
                {ordem.prestador_aprovado || "—"}
              </p>
              {ordem.custo_final && (
                <p>
                  <strong>Custo:</strong> {formatBRL(ordem.custo_final)}
                </p>
              )}
            </Card>

            {/* ORÇAMENTOS */}
            <Card className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold flex items-center gap-1">
                  <FileText size={14} /> Orçamentos
                </h4>
                <Button
                  size="sm"
                  onClick={() => setOpenAddBudget(true)}
                >
                  <Plus size={14} /> Adicionar
                </Button>
              </div>
              
              {orcamentos.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum orçamento cadastrado.
                </p>
              ) : (
                <Card className="space-y-2">
                  {orcamentos.map((o) => (
                    <li
                      key={o.id}
                      className="flex justify-between items-center rounded-md p-2"
                    >
                      <div>
                        <p className="font-medium">
                          {o.prestador}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatBRL(o.valor)} •{" "}
                          {o.status}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        {o.status !== "aprovado" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleApprove(o.id)}
                            disabled={saving}
                          >
                            <Check size={16} />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemove(o.id)}
                          disabled={saving}
                        >
                          <Trash2
                            size={16}
                            className="text-red-500"
                          />
                        </Button>
                      </div>
                    </li>
                  ))}
                </Card>
              )}

            </Card>
          </div>
        )}

        {/* MODAL ADD ORÇAMENTO */}
        <Modal
          isOpen={openAddBudget}
          onClose={() => setOpenAddBudget(false)}
          title="Adicionar Orçamento"
        >
          <div className="space-y-3">
            <Input
              placeholder="Prestador"
              value={novoOrcamento.prestador}
              onChange={(e) =>
                setNovoOrcamento((p) => ({
                  ...p,
                  prestador: e.target.value,
                }))
              }
            />
            <Input
              placeholder="R$ 0,00"
              type="text"
              inputMode="numeric"
              value={formatBRL(novoOrcamento.valor || 0)}
              onChange={(e) => {
                const numeric = parseCurrencyToNumber(e.target.value);

                setNovoOrcamento((p) => ({
                  ...p,
                  valor: numeric,
                }));
              }}
            />
            <Input
              placeholder="Prazo (dias)"
              type="number"
              value={novoOrcamento.prazo_dias}
              onChange={(e) =>
                setNovoOrcamento((p) => ({
                  ...p,
                  prazo_dias: e.target.value,
                }))
              }
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setOpenAddBudget(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleAddOrcamento} disabled={saving}>
                {saving ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>,
    root
  );
}
