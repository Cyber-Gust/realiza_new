"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import { formatDocument, formatPhoneBR, formatBRL } from "@/utils/currency"; // ou o nome que você deu

import {
  Loader2,
  X,
  FileText,
  Calendar,
  DollarSign,
  Lock,
  Home,
  User,
  AlertTriangle,
  Download,
  ShieldCheck, // Novo ícone
  RefreshCw,   // Novo ícone
} from "lucide-react";

export default function ContratoDetailDrawer({ contratoId, onClose }) {
  const toast = useToast();

  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [openConfirmEnd, setOpenConfirmEnd] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* ============================================================
      LOAD CONTRATO
   ============================================================ */
  const fetchContrato = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contratos?id=${contratoId}`, {
        cache: "no-store",
      });
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
      SIGNED URL
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
      toast.error("Erro ao gerar link: " + err.message);
    }
  };

  const downloadFile = async (path) => {
    if (!path) return;
    const url = await getSignedUrl(path);
    if (url) window.open(url, "_blank");
  };

  /* ============================================================
      ACTION HANDLER
   ============================================================ */
  const executeAction = async (action) => {
    try {
      setActionLoading(true);

      const res = await fetch("/api/contratos/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          contrato_id: contrato.id,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(json.message || "Ação executada!");
      await fetchContrato();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateMinuta = () => executeAction("gerar_minuta");
  const handleSendToSign = () => executeAction("enviar_assinatura");
  const handleEncerrar = async () => {
    await executeAction("encerrar");
    onClose?.();
  };

  /* ============================================================
      FLAGS DE CONTROLE
   ============================================================ */
  const canGenerateMinuta =
    contrato?.status === "em_elaboracao" &&
    !contrato?.documento_minuta_path;

  const canSendToSign =
    contrato?.status === "aguardando_assinatura" &&
    !!contrato?.documento_minuta_path &&
    !contrato?.documento_assinado_path;

  const canEncerrar = contrato?.status !== "encerrado";

  /* ============================================================
      RENDER
   ============================================================ */
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:w-[480px] h-full bg-panel-card border-l border-border shadow-xl animate-slide-left flex flex-col overflow-y-auto">

        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Detalhes do Contrato
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
        ) : !contrato ? (
          <div className="p-6 text-center text-muted-foreground">
            Contrato não encontrado.
          </div>
        ) : (
          <div className="p-6 space-y-6 text-sm">

            {/* IMÓVEL */}
            <Card className="p-4">
              <div className="flex items-center gap-2 font-semibold">
                <Home size={16} />
                {contrato.imoveis?.titulo || "Imóvel sem título"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {contrato.imoveis?.endereco_bairro || "—"}
              </p>
            </Card>

            {/* INFO FINANCEIRA */}
            <Card className="p-4 grid grid-cols-2 gap-4">
              <Field label="Tipo" value={contrato.tipo} />
              <Field
                label="Status"
                value={contrato.status?.replaceAll("_", " ")}
              />
              <Field
                label="Valor"
                value={formatBRL(contrato.valor_acordado)}
                icon={<DollarSign size={14} />}
              />
              <Field label="Índice Reajuste" value={contrato.indice_reajuste} />
            </Card>

            {/* VIGÊNCIA */}
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Vigência</p>
              <p className="flex items-center gap-2 font-medium">
                <Calendar size={14} />
                {contrato.data_inicio ? new Date(contrato.data_inicio).toLocaleDateString('pt-BR') : '—'} 
                {" → "} 
                {contrato.data_fim ? new Date(contrato.data_fim).toLocaleDateString('pt-BR') : '—'}
              </p>
            </Card>

            {/* [NOVO] GARANTIA & RENOVAÇÃO */}
            {contrato.tipo === "locacao" && (
                <Card className="p-4 space-y-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50 pb-2 mb-2">
                        Garantia & Renovação
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Field 
                            label="Garantia" 
                            value={contrato.tipo_garantia} 
                            icon={<ShieldCheck size={14}/>} 
                        />
                        <Field 
                            label="Renovação" 
                            value={contrato.tipo_renovacao} 
                            icon={<RefreshCw size={14}/>} 
                        />
                    </div>

                    {/* Exibe detalhes do fiador se a garantia for Fiador */}
                    {contrato.tipo_garantia === "Fiador" && contrato.dados_garantia && (
                        <div className="bg-secondary/30 p-3 rounded text-xs space-y-1 mt-2">
                            <p className="font-semibold text-foreground mb-1">Dados do Fiador:</p>
                            <div className="grid grid-cols-[40px_1fr] gap-1">
                                <span className="text-muted-foreground">Nome:</span>
                                <span>{contrato.dados_garantia.nome}</span>
                                
                                <span className="text-muted-foreground">Doc:</span>
                                <span>{formatDocument(contrato.dados_garantia.documento)}</span>
                                
                                <span className="text-muted-foreground">Tel:</span>
                                <span>{formatPhoneBR(contrato.dados_garantia.telefone)}</span>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* PARTICIPANTES */}
            <Card className="p-4 space-y-3">
              <Field
                label="Proprietário"
                value={contrato.proprietario?.nome}
                icon={<User size={14} />}
              />
              
              {/* Lógica para exibir PJ/PF */}
              <Field
                label="Inquilino"
                value={
                    <div className="flex items-center gap-2">
                        <span>{contrato.inquilino?.nome || "—"}</span>
                        {contrato.inquilino && contrato.locatario_pj !== null && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                contrato.locatario_pj 
                                    ? "bg-blue-50 text-blue-600 border-blue-100" 
                                    : "bg-gray-50 text-gray-600 border-gray-100"
                            }`}>
                                {contrato.locatario_pj ? "PJ" : "PF"}
                            </span>
                        )}
                    </div>
                }
                icon={<User size={14} />}
              />
            </Card>

            {/* DOCUMENTOS E AÇÕES */}
            <Card className="p-4 space-y-2">

              {canGenerateMinuta && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleGenerateMinuta}
                  disabled={actionLoading}
                >
                  <FileText size={15} /> Gerar Minuta
                </Button>
              )}

              {contrato.documento_minuta_path && (
                <Button
                  className="w-full"
                  onClick={() =>
                    downloadFile(contrato.documento_minuta_path)
                  }
                >
                  <Download size={15} /> Baixar Minuta
                </Button>
              )}

              {contrato.documento_assinado_path && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    downloadFile(contrato.documento_assinado_path)
                  }
                >
                  <Download size={15} /> Contrato Assinado
                </Button>
              )}
            </Card>

            {/* BOTOES AÇÕES FINAIS */}
            <div className="space-y-2">
              {canSendToSign && (
                <Button
                  className="w-full"
                  onClick={handleSendToSign}
                  disabled={actionLoading}
                >
                  <FileText size={15} /> Enviar para Assinatura
                </Button>
              )}

              {canEncerrar && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setOpenConfirmEnd(true)}
                >
                  <Lock size={15} /> Encerrar Contrato
                </Button>
              )}
            </div>
          </div>
        )}

        {/* MODAL ENCERRAR */}
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

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setOpenConfirmEnd(false)}
              >
                Cancelar
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleEncerrar}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Encerrar"
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

/* FIELD */
function Field({ label, value, icon }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} 
        <span>{label}</span>
      </div>
      <div className="font-medium">{value || "—"}</div>
    </div>
  );
}