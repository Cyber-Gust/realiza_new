"use client";

import { useEffect, useState, useCallback } from "react";
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
  RefreshCw,
  Lock,
  Home,
  User,
  AlertTriangle,
} from "lucide-react";

export default function CRMContratoDetailDrawer({
  contratoId,
  onClose,
  onUpdated,
}) {
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [openConfirmEnd, setOpenConfirmEnd] = useState(false);
  const [openConfirmRenew, setOpenConfirmRenew] = useState(false);

  const toast = useToast();

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
    if (contratoId) fetchContrato();
  }, [contratoId, fetchContrato]);

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
      onClose?.();
      return json;
    } catch (err) {
      toast.error("Erro ao atualizar contrato", err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const handleEncerrar = () =>
    patchContrato({ id: contrato.id, status: "encerrado" }).then(() =>
      toast.success("Contrato encerrado com sucesso!")
    );

  const handleRenovar = () =>
    patchContrato({
      id: contrato.id,
      status: "renovado",
      data_inicio: new Date().toISOString().split("T")[0],
    }).then(() => toast.success("Contrato renovado!"));

  if (!contratoId) return null;

  return (
    <>
      {/* ===================== DRAWER ===================== */}
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-all">
        <div className="w-full sm:w-[480px] h-full bg-panel-card border-l border-border shadow-2xl overflow-y-auto flex flex-col animate-slide-left">
          
          {/* HEADER */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">
              Detalhes do Contrato
            </h2>

            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col gap-2 items-center justify-center h-72 text-muted-foreground">
              <Loader2 className="animate-spin" size={22} />
              Carregando detalhes…
            </div>
          ) : !contrato ? (
            <div className="p-6 text-center text-muted-foreground">
              Contrato não encontrado.
            </div>
          ) : (
            <div className="p-6 space-y-6 text-sm">
              
              {/* IMÓVEL */}
              <Card className="p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-base font-semibold">
                  <Home size={16} />
                  {contrato.imoveis?.titulo || "Imóvel"}
                </div>
                <p className="text-muted-foreground">
                  {contrato.imoveis?.endereco_bairro || "Endereço não informado"}
                </p>
              </Card>

              {/* INFO GERAL */}
              <Card className="p-4 grid grid-cols-2 gap-4">
                <Field label="Tipo" value={contrato.tipo} />
                <Field label="Status" value={contrato.status} />
                <Field
                  label="Valor Acordado"
                  value={`R$ ${Number(contrato.valor_acordado).toFixed(2)}`}
                  icon={<DollarSign size={14} />}
                />
                <Field
                  label="Taxa Adm."
                  value={`${Number(contrato.taxa_administracao_percent)}%`}
                />
                <Field label="Índice Reajuste" value={contrato.indice_reajuste} />
                <Field
                  label="Dia do Vencimento"
                  value={contrato.dia_vencimento_aluguel}
                />
              </Card>

              {/* PERÍODO */}
              <Card className="p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Período</p>
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  {contrato.data_inicio} → {contrato.data_fim}
                </div>
              </Card>

              {/* PARTICIPANTES */}
              <Card className="p-4 space-y-3">
                <p className="font-semibold text-sm">Participantes</p>

                <div className="flex items-start gap-2 text-xs">
                  <User size={14} className="mt-0.5" />
                  <div>
                    <strong>Proprietário: </strong>
                    {contrato.proprietario?.nome_completo || "N/D"}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs">
                  <User size={14} className="mt-0.5" />
                  <div>
                    <strong>Inquilino: </strong>
                    {contrato.inquilino?.nome_completo || "N/D"}
                  </div>
                </div>
              </Card>

              {/* DOWNLOAD DO DOCUMENTO */}
              {contrato.documento_assinado_url && (
                <Button
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2"
                  asChild
                >
                  <a
                    href={contrato.documento_assinado_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileText size={16} /> Baixar Contrato Assinado
                  </a>
                </Button>
              )}

              {/* AÇÕES */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setOpenConfirmRenew(true)}
                >
                  <RefreshCw size={16} /> Renovar Contrato
                </Button>

                <Button
                  variant="destructive"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setOpenConfirmEnd(true)}
                >
                  <Lock size={16} /> Encerrar Contrato
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================== MODAL CONFIRMAR ENCERRAMENTO ===================== */}
      <Modal
        isOpen={openConfirmEnd}
        onClose={() => setOpenConfirmEnd(false)}
        title="Encerrar Contrato"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-600 mt-1" />
            <p>
              Tem certeza que deseja <strong>encerrar</strong> este contrato?
            </p>
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
              {actionLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                "Encerrar"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================== MODAL CONFIRMAR RENOVAÇÃO ===================== */}
      <Modal
        isOpen={openConfirmRenew}
        onClose={() => setOpenConfirmRenew(false)}
        title="Renovar Contrato"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="text-emerald-600 mt-1" />
            <p>
              Confirmar renovação do contrato?  
              O novo início será{" "}
              <strong>{new Date().toLocaleDateString("pt-BR")}</strong>.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => setOpenConfirmRenew(false)}
            >
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
              {actionLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                "Renovar"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Field({ label, value, icon }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium flex items-center gap-1">
        {icon} {value}
      </p>
    </div>
  );
}
