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
  ClipboardList,
} from "lucide-react";

export default function ContratoDetailDrawer({ contratoId, onClose }) {
  const toast = useToast();
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [openConfirmEnd, setOpenConfirmEnd] = useState(false);
  const [openConfirmRenew, setOpenConfirmRenew] = useState(false);

  const [mounted, setMounted] = useState(false);

  /* ============================================================
     LOAD CONTRATO
  ============================================================ */
  const fetchContrato = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contratos?id=${contratoId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setContrato(json.data);
    } catch (err) {
      toast.error("Erro ao carregar contrato: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [contratoId, toast]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (contratoId) fetchContrato();
  }, [contratoId, fetchContrato]);

  if (!mounted || !contratoId) return null;

  const root = document.getElementById("drawer-root");
  if (!root) return null;

  /* ============================================================
     SIGNED URL HANDLER
  ============================================================ */
  const getSignedUrl = async (path) => {
    try {
      const res = await fetch("/api/contratos/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);
      return json.signedUrl;
    } catch (err) {
      toast.error("Erro ao gerar link de download: " + err.message);
    }
  };

  const downloadFile = async (path) => {
    const url = await getSignedUrl(path);
    if (url) window.open(url, "_blank");
  };

  /* ============================================================
     ACTION HANDLER (rota única)
  ============================================================ */
  const executeAction = async (action, extra = {}) => {
    try {
      setActionLoading(true);

      const res = await fetch("/api/contratos/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          contrato_id: contrato.id,
          ...extra,
        }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      toast.success(json.message || "Ação executada!");

      await fetchContrato(); // atualiza paths novos
      return json;
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* ============================================================
     AÇÕES ESPECÍFICAS
  ============================================================ */
  const handleGenerateMinuta = async () => {
    const res = await executeAction("gerar_minuta");
    if (res?.url) {
      toast.success("Minuta gerada!");
    }
  };

  const handleSendToSign = () => executeAction("enviar_assinatura");
  const handleCreateAditivo = () => executeAction("criar_aditivo", { variaveis: {} });
  const handleReajustar = () => executeAction("reajustar");

  const handleRenovar = () =>
    executeAction("renovar").then(() => onClose?.());

  const handleEncerrar = () =>
    executeAction("encerrar").then(() => onClose?.());

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

        {loading ? (
          <div className="flex items-center justify-center h-72 flex-col text-muted-foreground">
            <Loader2 className="animate-spin" size={22} />
            Carregando…
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
                {contrato.imoveis?.titulo || "Imóvel sem título"}
              </div>
              <p className="text-muted-foreground text-xs">
                {contrato.imoveis?.endereco_bairro || "—"}
              </p>
            </Card>

            {/* INFO GERAL */}
            <Card className="p-4 grid grid-cols-2 gap-4">
              <Field label="Tipo" value={contrato.tipo} />
              <Field
                label="Status"
                value={contrato.status ? contrato.status.replace("_", " ") : "—"}
              />

              <Field
                label="Valor"
                value={`R$ ${Number(contrato.valor_acordado).toFixed(2)}`}
                icon={<DollarSign size={14} />}
              />

              {contrato.taxa_administracao_percent && (
                <Field label="Taxa Adm" value={`${contrato.taxa_administracao_percent}%`} />
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

              <Field label="Proprietário" value={contrato.proprietario?.nome} icon={<User size={14} />} />
              <Field label="Inquilino" value={contrato.inquilino?.nome} icon={<User size={14} />} />
            </Card>

            {/* DOCUMENTOS */}
            <Card className="p-4 space-y-3">
              <p className="font-semibold text-sm">Documentos</p>

              {/* Gerar minuta */}
              <Button
                variant="secondary"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleGenerateMinuta}
              >
                <FileText size={15} /> Gerar Minuta
              </Button>

              {/* MINUTA */}
              {(contrato.documento_minuta_url || contrato.documento_minuta_path) && (
                <Button
                  className="w-full flex items-center gap-2"
                  onClick={() =>
                    downloadFile(contrato.documento_minuta_url || contrato.documento_minuta_path)
                  }
                >
                  <Download size={15} /> Baixar Minuta
                </Button>
              )}

              {/* CONTRATO ASSINADO */}
              {(contrato.documento_assinado_url || contrato.documento_assinado_path) && (
                <Button
                  variant="secondary"
                  className="w-full flex items-center gap-2"
                  onClick={() =>
                    downloadFile(
                      contrato.documento_assinado_url || contrato.documento_assinado_path
                    )
                  }
                >
                  <Download size={15} /> Contrato Assinado
                </Button>
              )}

            </Card>

            {/* AÇÕES */}
            <div className="flex flex-col gap-2 pt-2">

              <Button
                className="w-full flex items-center justify-center gap-2"
                onClick={handleSendToSign}
              >
                <FileText size={15} /> Enviar para Assinatura
              </Button>

              <Button
                className="w-full flex items-center gap-2 justify-center"
                onClick={handleCreateAditivo}
              >
                <PlusCircle size={15} /> Criar Aditivo
              </Button>

              <Button
                className="w-full flex items-center gap-2 justify-center"
                variant="secondary"
                onClick={handleReajustar}
              >
                <ClipboardList size={15} /> Reajustar Aluguel
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

        {/* MODAL ENCERRAR */}
        <Modal isOpen={openConfirmEnd} onClose={() => setOpenConfirmEnd(false)} title="Encerrar Contrato">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-600 mt-1" />
              <p>Deseja realmente encerrar este contrato?</p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setOpenConfirmEnd(false)}>Cancelar</Button>

              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleEncerrar}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : "Encerrar"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* MODAL RENOVAR */}
        <Modal isOpen={openConfirmRenew} onClose={() => setOpenConfirmRenew(false)} title="Renovar Contrato">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <RefreshCcw className="text-emerald-600 mt-1" />
              <p>
                Deseja renovar este contrato?  
                Novo início: <strong>{new Date().toLocaleDateString("pt-BR")}</strong>.
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setOpenConfirmRenew(false)}>Cancelar</Button>

              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleRenovar}
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

/* FIELD COMPONENT */
function Field({ label, value, icon }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
