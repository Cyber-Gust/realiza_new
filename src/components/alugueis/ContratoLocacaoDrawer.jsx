"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import Modal from "@/components/admin/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import ContratoForm from "@/components/contratos/ContratoForm";
import ContratoAlugueisModal from "./extras/ContratoAlugueisModal";
import ModalLancamento from "@/components/alugueis/ModalLancamento";



import {
  X,
  Home,
  User,
  Calendar,
  DollarSign,
  Hash,
  Edit3,
  Plus,
  Minus,
  FilePlus2,
  TrendingUp,
  RefreshCcw,
} from "lucide-react";

import { cn } from "@/lib/utils";

function formatBRL(v) {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(v));
}

function formatDateBR(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("pt-BR");
}

function formatPhoneBR(phone) {
  if (!phone) return "—";
  const digits = String(phone).replace(/\D/g, "");

  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }

  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }

  return phone;
}

function formatDocumentBR(doc) {
  if (!doc) return "—";
  const digits = String(doc).replace(/\D/g, "");

  // CPF
  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }

  // CNPJ
  if (digits.length === 14) {
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      "$1.$2.$3/$4-$5"
    );
  }

  return doc;
}

export default function ContratoLocacaoDrawer({ contratoId, onClose }) {
  const { error: toastError, success: toastSuccess } = useToast();

  const [mounted, setMounted] = useState(false);

  // drawer detalhe
  const [loading, setLoading] = useState(true);
  const [contrato, setContrato] = useState(null);

  // modal edição
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openAlugueisModal, setOpenAlugueisModal] = useState(false);
  const [contratoEdit, setContratoEdit] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [openLancamentoModal, setOpenLancamentoModal] = useState(false);

  /* ===========================================
      LOAD DETALHES DO DRAWER (API /api/alugueis)
  ============================================ */
  const fetchContrato = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/alugueis?view=detalhes_contrato&contrato_id=${contratoId}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar contrato");

      setContrato(json.data);
    } catch (err) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }, [contratoId, toastError]);

  /* ===========================================
      LOAD CONTRATO COMPLETO (API /api/contratos)
      pra abrir ContratoForm certinho
  ============================================ */
  const fetchContratoFullAndOpenModal = useCallback(async () => {
    try {
      setLoadingEdit(true);

      const res = await fetch(`/api/contratos?id=${contratoId}`, {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar contrato");

      setContratoEdit(json.data);
      setOpenEditModal(true);
    } catch (err) {
      toastError(err.message);
    } finally {
      setLoadingEdit(false);
    }
  }, [contratoId, toastError]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (contratoId) fetchContrato();
  }, [contratoId, fetchContrato]);

  if (!mounted) return null;

  const root = document.getElementById("drawer-root");
  if (!root) return null;

  /* ===========================================
      HANDLERS DOS BOTÕES (mock por enquanto)
  ============================================ */
  const handleAction = async (action) => {
    toastSuccess(`Ação: ${action} (vamos plugar depois) ✅`);
  };

  const imovelCodigo =
    contrato?.imoveis?.codigo_ref || contrato?.imoveis?.codigo || "—";

  const isFiador = (contrato?.tipo_garantia || "").toLowerCase() === "fiador";

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:w-[520px] h-full bg-panel-card border-l border-border shadow-xl animate-slide-left flex flex-col overflow-y-auto">
        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home size={18} className="text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Detalhes do Contrato
            </h2>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5 text-sm">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-56 w-full rounded-xl" />
              <Skeleton className="h-44 w-full rounded-xl" />
            </div>
          ) : !contrato ? (
            <div className="p-6 text-center text-muted-foreground">
              Contrato não encontrado.
            </div>
          ) : (
            <>
              {/* IMÓVEL */}
              <Card className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Imóvel</p>
                    <p className="font-semibold truncate">
                      {contrato.imoveis?.titulo || "Imóvel sem título"}
                    </p>

                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      Código do imóvel:{" "}
                      <span className="font-medium text-foreground">
                        {imovelCodigo}
                      </span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Contrato</p>
                    <p className="font-semibold flex items-center justify-end gap-1">
                      <Hash size={14} />
                      {contrato.codigo ?? contrato.id}
                    </p>
                  </div>
                </div>
              </Card>

              {/* PARTICIPANTES */}
              <Card className="p-4 grid grid-cols-2 gap-4">
                <Field
                  label="Locador"
                  value={contrato.proprietario?.nome}
                  icon={<User size={14} />}
                />
                <Field
                  label="Locatário"
                  value={contrato.inquilino?.nome}
                  icon={<User size={14} />}
                />
              </Card>

              {/* CONTRATO */}
              <Card className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Dados do contrato
                  </p>

                  <Button
                    size="sm"
                    variant="secondary"
                    className="gap-2"
                    onClick={fetchContratoFullAndOpenModal}
                    disabled={loadingEdit}
                  >
                    <Edit3 size={14} />
                    {loadingEdit ? "Carregando..." : "Alterar"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Início"
                    value={formatDateBR(contrato.data_inicio)}
                    icon={<Calendar size={14} />}
                  />

                  <Field
                    label="Término"
                    value={formatDateBR(contrato.data_fim)}
                    icon={<Calendar size={14} />}
                  />

                  <Field
                    label="Dia de vencimento"
                    value={
                      contrato.dia_vencimento_aluguel
                        ? `Dia ${contrato.dia_vencimento_aluguel}`
                        : "—"
                    }
                    icon={<DollarSign size={14} />}
                  />

                  <Field
                    label="Valor do aluguel"
                    value={formatBRL(contrato.valor_acordado)}
                    icon={<DollarSign size={14} />}
                  />

                  <Field
                    label="Tipo de garantia"
                    value={contrato.tipo_garantia || "—"}
                  />

                  <Field
                    label="Tipo de renovação"
                    value={contrato.tipo_renovacao || "—"}
                    icon={<RefreshCcw size={14} />}
                  />

                  <Field
                    label="Taxa de administração"
                    value={
                      contrato.taxa_administracao_percent !== null &&
                      contrato.taxa_administracao_percent !== undefined
                        ? `${contrato.taxa_administracao_percent}%`
                        : "—"
                    }
                    icon={<DollarSign size={14} />}
                  />

                  <Field
                    label="Tipo de reajuste"
                    value={contrato.indice_reajuste || "—"}
                    icon={<TrendingUp size={14} />}
                  />

                  <Field
                    label="Último reajuste"
                    value={formatDateBR(contrato.ultimo_reajuste_em)}
                    icon={<Calendar size={14} />}
                  />

                  <Field
                    label="Valor reajustado"
                    value={formatBRL(contrato.valor_reajustado)}
                    icon={<DollarSign size={14} />}
                  />
                </div>
              </Card>

              {/* DADOS DO FIADOR */}
              {isFiador && contrato.dados_garantia && (
                <Card className="p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Dados do Fiador
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Nome"
                      value={contrato.dados_garantia?.nome || "—"}
                    />

                    <Field
                      label="Documento"
                      value={formatDocumentBR(contrato.dados_garantia?.documento)}
                    />

                    <Field
                      label="Telefone"
                      value={formatPhoneBR(contrato.dados_garantia?.telefone)}
                    />
                  </div>
                </Card>
              )}

              {/* AÇÕES */}
              <Card className="p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ações rápidas
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    className="gap-2"
                    onClick={() => setOpenAlugueisModal(true)}
                    >
                    <Home size={14} />
                    Aluguéis
                  </Button>

                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => setOpenLancamentoModal(true)}
                  >
                    <FilePlus2 size={14} />
                    Lançamento
                  </Button>

                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => handleAction("acrescimo")}
                  >
                    <Plus size={14} />
                    Acréscimo
                  </Button>

                  <Button
                    variant="secondary"
                    className="gap-2"
                    onClick={() => handleAction("decrescimo")}
                  >
                    <Minus size={14} />
                    Decréscimo
                  </Button>

                  <Button
                    className={cn("gap-2 col-span-2")}
                    onClick={() => handleAction("reajuste")}
                  >
                    <TrendingUp size={14} />
                    Reajuste
                  </Button>
                </div>
              </Card>

              {/* MODAL EDITAR CONTRATO */}
              <Modal
                isOpen={openEditModal}
                onClose={() => {
                  setOpenEditModal(false);
                  setContratoEdit(null);
                }}
                title="Alterar contrato"
              >
                {!contratoEdit ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                ) : (
                  <ContratoForm
                    contrato={contratoEdit}
                    onClose={() => {
                      setOpenEditModal(false);
                      setContratoEdit(null);
                    }}
                    onSaved={async () => {
                      await fetchContrato(); // ✅ atualiza detalhes
                      setOpenEditModal(false);
                      setContratoEdit(null);
                    }}
                  />
                )}
              </Modal>

              <ContratoAlugueisModal
                isOpen={openAlugueisModal}
                onClose={() => setOpenAlugueisModal(false)}
                contratoId={contratoId}
                
              />
              <ModalLancamento
                open={openLancamentoModal}
                onClose={() => setOpenLancamentoModal(false)}
                contrato={{
                  id: contrato?.id,
                  codigo: contrato?.codigo,
                  imovel_id: contrato?.imovel_id,
                }}
                locador={{
                  id: contrato?.proprietario_id,
                  nome: contrato?.proprietario?.nome,
                }}
                onSaved={async () => {
                  // se você quiser, pode atualizar dados do drawer depois do lançamento
                  await fetchContrato();
                }}
              />

            </>
          )}
        </div>
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
