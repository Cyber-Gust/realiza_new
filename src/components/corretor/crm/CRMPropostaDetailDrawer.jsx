"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { useToast } from "@/contexts/ToastContext";

import {
  Loader2,
  X,
  User,
  Home,
  DollarSign,
  ClipboardList,
  Pencil,
  MessageSquare,
  Clock,
} from "lucide-react";

export default function CRMPropostaDetailDrawer({ propostaId, onClose, onEdit }) {
  const [proposta, setProposta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toast = useToast();

  /* ============================================================
     Fetch da proposta
  ============================================================ */
  const fetchProposta = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm/propostas?id=${propostaId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setProposta(json.data);
    } catch (err) {
      toast.error("Erro ao carregar proposta: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [propostaId]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (propostaId) fetchProposta();
  }, [propostaId, fetchProposta]);

  if (!mounted || !propostaId) return null;

  const root = document.getElementById("drawer-root");
  if (!root) return null;

  const formatMoney = (v) =>
    v ? `R$ ${Number(v).toLocaleString("pt-BR")}` : "-";

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:w-[480px] h-full bg-panel-card border-l border-border shadow-xl overflow-y-auto animate-slide-left flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Detalhes da Proposta</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex flex-col gap-2 items-center justify-center h-72 text-muted-foreground">
            <Loader2 className="animate-spin" size={22} />
            Carregando informações…
          </div>
        ) : !proposta ? (
          <div className="p-6 text-center text-muted-foreground">Proposta não encontrada.</div>
        ) : (
          <div className="p-6 space-y-6 text-sm">

            {/* LEAD OU PERSONA */}
            {proposta.lead ? (
              <Card className="p-4 flex flex-col gap-1">
                <p className="flex items-center gap-2 text-base font-semibold">
                  <User size={16} /> Lead
                </p>
                <p className="text-xs text-muted-foreground">{proposta.lead?.nome}</p>
                <p className="text-xs text-muted-foreground">{proposta.lead?.telefone}</p>
                <p className="text-xs text-muted-foreground">{proposta.lead?.email}</p>
              </Card>
            ) : (
              <Card className="p-4 flex flex-col gap-1">
                <p className="flex items-center gap-2 text-base font-semibold">
                  <User size={16} /> Pessoa
                </p>
                <p className="text-xs text-muted-foreground">{proposta.persona?.nome}</p>
                <p className="text-xs text-muted-foreground">{proposta.persona?.telefone}</p>
                <p className="text-xs text-muted-foreground">{proposta.persona?.email}</p>
              </Card>
            )}

            {/* IMÓVEL */}
            <Card className="p-4">
              <p className="font-semibold text-sm flex items-center gap-1">
                <Home size={14} /> Imóvel
              </p>

              <div className="mt-2 space-y-2">
                <Field label="Título" value={proposta.imovel?.titulo} />
                <Field label="Bairro" value={proposta.imovel?.endereco_bairro} />
              </div>
            </Card>

            {/* FINANCEIRO */}
            <Card className="p-4 space-y-4">
              <p className="font-semibold text-sm flex items-center gap-1">
                <DollarSign size={14} /> Informações da Proposta
              </p>

              <Field label="Valor ofertado" value={formatMoney(proposta.valor_proposta)} />
              <Field label="Tipo de Pagamento" value={proposta.tipo_pagamento || "-"} />
              <Field label="Entrada" value={formatMoney(proposta.entrada)} />
              <Field label="Parcelas" value={proposta.parcelas || "-"} />
              <Field
                label="Data de validade"
                value={
                  proposta.data_validade
                    ? new Date(proposta.data_validade).toLocaleDateString("pt-BR")
                    : "-"
                }
              />
              <Field label="Condição / Garantia" value={proposta.condicao_garantia || "-"} />
              <Field label="Origem da Proposta" value={proposta.origem_proposta || "-"} />

              {/* STATUS */}
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge status={proposta.status} />
              </div>
            </Card>

            {/* OBSERVAÇÕES */}
            {proposta.observacoes && (
              <Card className="p-4">
                <p className="font-semibold text-sm flex items-center gap-1">
                  <MessageSquare size={14} /> Observações
                </p>
                <p className="text-xs text-muted-foreground mt-1">{proposta.observacoes}</p>
              </Card>
            )}

            {/* HISTÓRICO */}
            <Card className="p-4 space-y-3">
              <p className="font-semibold text-sm flex items-center gap-1">
                <ClipboardList size={14} /> Histórico de Status
              </p>

              {proposta.historico_status?.length > 0 ? (
                <div className="space-y-3">
                  {proposta.historico_status.map((h, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Clock size={14} className="mt-0.5 text-primary" />

                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Badge status={h.from} />
                          <span className="text-[10px] text-muted-foreground">→</span>
                          <Badge status={h.to} />
                        </div>

                        <p className="text-[10px] text-muted-foreground">
                          {new Date(h.date).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Sem histórico.</p>
              )}
            </Card>

            {/* DATAS */}
            <Card className="p-4 space-y-2">
              <Field
                label="Criada em"
                value={new Date(proposta.created_at).toLocaleString("pt-BR")}
              />
              <Field
                label="Atualizada em"
                value={
                  proposta.updated_at
                    ? new Date(proposta.updated_at).toLocaleString("pt-BR")
                    : "-"
                }
              />
            </Card>

            {/* BOTÃO EDITAR */}
            <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={() => onEdit?.(proposta)}
            >
              <Pencil size={16} /> Editar Proposta
            </Button>

          </div>
        )}
      </div>
    </div>,
    root
  );
}

function Field({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}
