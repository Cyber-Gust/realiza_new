"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import { useToast } from "@/contexts/ToastContext";

import {
  Loader2,
  X,
  FileText,
  Calendar,
  DollarSign,
  RefreshCcw,
  Lock,
  Home,
  User,
  AlertTriangle,
  PlusCircle,
  Download,
} from "lucide-react";

export default function ContratoDetailDrawer({
  contratoId,
  onClose,
  onUpdated,

  // novos callbacks (opcionais / preparados)
  onGenerateMinuta,
  onSendToSign,
  onAdicionarAditivo,
}) {
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [openConfirmEnd, setOpenConfirmEnd] = useState(false);
  const [openConfirmRenew, setOpenConfirmRenew] = useState(false);

  const [mounted, setMounted] = useState(false);
  const toast = useToast();

  /* ============================================================
     LOAD
  ============================================================ */
  const fetchContrato = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contratos?id=${contratoId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setContrato(json.data);
    } catch (err) {
      toast.error("Erro ao carregar contrato", err.message);
    } finally {
      setLoading(false);
    }
  }, [contratoId, toast]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (contratoId) fetchContrato();
  }, [contratoId, fetchContrato]);

  if (!mounted || !contratoId) return null;

  const root = document.getElementById("drawer-root");
  if (!root) return null;

  /* ============================================================
     AÇÕES
  ============================================================ */
  const patchContrato = async (payload) => {
    try {
      setActionLoading(true);
      const res = await fetch("/api/contratos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      onUpdated?.();
      return json;
    } catch (err) {
      toast.error("Erro ao atualizar contrato", err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleEncerrar = () =>
    patchContrato({ id: contrato.id, status: "encerrado" }).then(() => {
      toast.success("Contrato encerrado!");
      onClose?.();
    });

  const handleRenovar = () =>
    patchContrato({
      id: contrato.id,
      status: "renovado",
      data_inicio: new Date().toISOString().split("T")[0],
    }).then(() => {
      toast.success("Contrato renovado!");
      onClose?.();
    });

  /* ============================================================
     RENDER
  ============================================================ */
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:w-[480px] h-full bg-panel-card border-l border-border shadow-xl animate-slide-left flex flex-col overflow-y-auto">

        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Detalhes do Contrato</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex items-center justify-center h-72 flex-col text-muted-foreground">
            <Loader2 className="animate-spin" size={22} />
            Carregando dados…
          </div>
        ) : !contrato ? (
          <div className="p-6 text-center text-muted-foreground">
            Contrato não encontrado.
          </div>
        ) : (
          <div className="p-6 space-y-6 text-sm">

            {/* IMÓVEL */}
            <Card className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 font-semibold text-base">
                <Home size={16} />
                {contrato.imoveis?.titulo || "Imóvel"}
              </div>
              <p className="text-muted-foreground text-xs">
                {contrato.imoveis?.endereco_bairro || "Bairro não informado"}
              </p>
            </Card>

            {/* INFO GERAL */}
            <Card className="p-4 grid grid-cols-2 gap-4">
              <Field label="Tipo" value={contrato.tipo} />
              <Field label="Status" value={contrato.status} />

              <Field
                label="Valor"
                value={`R$ ${Number(contrato.valor_acordado).toFixed(2)}`}
                icon={<DollarSign size={14} />}
              />

              {contrato.taxa_administracao_percent && (
                <Field
                  label="Taxa Adm"
                  value={`${contrato.taxa_administracao_percent}%`}
                />
              )}

              <Field label="Índice" value={contrato.indice_reajuste} />
              <Field label="Vencimento" value={contrato.dia_vencimento_aluguel} />
            </Card>

            {/* VIGÊNCIA */}
            <Card className="p-4 space-y-1">
              <p className="text-xs text-muted-foreground">Vigência</p>

              <p className="flex items-center gap-2">
                <Calendar size={14} />
                {contrato.data_inicio} → {contrato.data_fim}
              </p>
            </Card>

            {/* PARTICIPANTES */}
            <Card className="p-4 space-y-3">
              <p className="font-semibold">Participantes</p>

              <Field
                label="Proprietário"
                value={contrato.proprietario?.nome_completo}
                icon={<User size={14} />}
              />

              <Field
                label="Inquilino"
                value={contrato.inquilino?.nome_completo}
                icon={<User size={14} />}
              />
            </Card>

            {/* DOCUMENTOS */}
            <Card className="p-4 space-y-3">
              <p className="font-semibold text-sm">Documentos</p>

              <Button
                variant="secondary"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => onGenerateMinuta?.(contrato)}
              >
                <FileText size={15} /> Gerar Minuta
              </Button>

              {contrato.documento_minuta_url && (
                <Button asChild className="w-full flex items-center gap-2">
                  <a href={contrato.documento_minuta_url} target="_blank">
                    <Download size={15} /> Baixar Minuta
                  </a>
                </Button>
              )}

              {contrato.documento_assinado_url && (
                <Button asChild className="w-full flex items-center gap-2" variant="secondary">
                  <a href={contrato.documento_assinado_url} target="_blank">
                    <Download size={15} /> Contrato Assinado
                  </a>
                </Button>
              )}
            </Card>

            {/* AÇÕES */}
            <div className="flex flex-col gap-2 pt-2">

              <Button
                className="w-full flex items-center justify-center gap-2"
                onClick={() => onSendToSign?.(contrato)}
              >
                <FileText size={15} /> Enviar para Assinatura
              </Button>

              <Button
                className="w-full flex items-center gap-2 justify-center"
                onClick={() => onAdicionarAditivo?.(contrato)}
              >
                <PlusCircle size={15} /> Criar Aditivo
              </Button>

              <Button
                className="w-full flex items-center gap-2 justify-center"
                onClick={() => setOpenConfirmRenew(true)}
              >
                <RefreshCcw size={15} /> Renovar Contrato
              </Button>

              <Button
                variant="destructive"
                className="w-full flex items-center gap-2 justify-center"
                onClick={() => setOpenConfirmEnd(true)}
              >
                <Lock size={15} /> Encerrar Contrato
              </Button>

            </div>
          </div>
        )}

        {/* MODAIS */}
        <Modal
          isOpen={openConfirmEnd}
          onClose={() => setOpenConfirmEnd(false)}
          title="Encerrar Contrato"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 mt-1" />
              <p>Deseja realmente encerrar este contrato?</p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setOpenConfirmEnd(false)}>
                Cancelar
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  await handleEncerrar();
                  setOpenConfirmEnd(false);
                }}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : "Encerrar"}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={openConfirmRenew}
          onClose={() => setOpenConfirmRenew(false)}
          title="Renovar Contrato"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <RefreshCcw className="text-emerald-600 mt-1" />
              <p>
                Confirmar renovação? Novo início:{" "}
                <strong>{new Date().toLocaleDateString("pt-BR")}</strong>.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setOpenConfirmRenew(false)}>
                Cancelar
              </Button>

              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={async () => {
                  await handleRenovar();
                  setOpenConfirmRenew(false);
                }}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : "Renovar"}
              </Button>
            </div>
          </div>
        </Modal>

      </div>
    </div>,
    root
  );
}

function Field({ label, value, icon }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="font-medium">{value || "-"} </p>
    </div>
  );
}
