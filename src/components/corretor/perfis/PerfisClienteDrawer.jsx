"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { useToast } from "@/contexts/ToastContext";

import {
  Loader2,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Info,
  ScrollText,
  Pencil,
  Trash2,
  User2,
  Building2,
  AlertTriangle,
} from "lucide-react";
import Modal from "@/components/admin/ui/Modal";
import Image from "next/image";

export default function PerfisClienteDrawer({ clienteId, onClose, onEdit, reload }) {
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  const getImageSrc = (foto) => {
    if (!foto || typeof foto !== "string") return "/placeholder-avatar.png";
    if (foto.startsWith("/")) return foto;
    if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
    return "/" + foto;
  };

  const fetchCliente = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/perfis/list?type=clientes&id=${clienteId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setCliente(json.data);
    } catch (err) {
      toast.error("Erro ao carregar cliente: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [clienteId, toast]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (clienteId) fetchCliente();
  }, [clienteId, fetchCliente]);

  if (!mounted || !clienteId) return null;

  const root = document.getElementById("drawer-root");
  if (!root) return null;

  // --- DELETE CLIENTE ---
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);

      const res = await fetch("/api/perfis/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cliente.id, type: "clientes" }),
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Cliente removido com sucesso!");
      setDeleteTarget(null);
      onClose();
      reload?.();
    } catch (err) {
      toast.error("Erro ao remover: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">

        <div className="w-full sm:w-[480px] h-full bg-panel-card border-l border-border shadow-xl overflow-y-auto animate-slide-left flex flex-col">

          {/* HEADER */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <User2 size={18} />
              Detalhes do Cliente
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>

          {/* LOADING */}
          {loading ? (
            <div className="flex flex-col gap-2 items-center justify-center h-72 text-muted-foreground">
              <Loader2 className="animate-spin" size={22} />
              Carregando informações do cliente…
            </div>
          ) : !cliente ? (
            <div className="p-6 text-center text-muted-foreground">Cliente não encontrado.</div>
          ) : (
            <div className="p-6 space-y-6 text-sm">

              {/* CARD PRINCIPAL */}
              <Card className="p-4 flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-muted border">
                  <Image
                    src={getImageSrc(cliente.foto)}
                    alt={cliente.nome}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>

                <div className="flex flex-col">
                  <p className="text-base font-semibold">{cliente.nome}</p>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                </div>
              </Card>

              {/* CONTATOS */}
              <Card className="p-4 grid grid-cols-1 gap-3">
                <Field icon={<Phone size={14} />} label="Telefone" value={cliente.telefone} />
                <Field icon={<Mail size={14} />} label="Email" value={cliente.email || "Não informado"} />
                <Field icon={<User size={14} />} label="CPF/CNPJ" value={cliente.cpf_cnpj} />
              </Card>

              {/* ORIGEM */}
              {cliente.origem && (
                <Card className="p-4 grid grid-cols-1 gap-3">
                  <Field icon={<Info size={14} />} label="Origem" value={cliente.origem} />
                </Card>
              )}

              {/* ENDEREÇO */}
              {(cliente.endereco_logradouro || cliente.endereco_bairro || cliente.endereco_cidade) && (
                <Card className="p-4 space-y-3">
                  <p className="font-semibold text-sm flex items-center gap-1">
                    <MapPin size={14} /> Endereço
                  </p>

                  <Field
                    label="Endereço"
                    value={`${cliente.endereco_logradouro || ""}, Nº ${cliente.endereco_numero || "-"
                      } - ${cliente.endereco_bairro || ""}`}
                  />

                  <Field
                    icon={<Building2 size={14} />}
                    label="Cidade"
                    value={`${cliente.endereco_cidade || ""} - ${cliente.endereco_estado || ""}`}
                  />

                  <Field label="CEP" value={cliente.endereco_cep} />
                </Card>
              )}

              {/* OBSERVAÇÕES */}
              {!!cliente.observacoes && (
                <Card className="p-4 space-y-2">
                  <p className="font-semibold text-sm flex items-center gap-1">
                    <ScrollText size={14} /> Observações
                  </p>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {cliente.observacoes}
                  </p>
                </Card>
              )}

              {/* AÇÕES */}
              <div className="flex gap-2">

                {/* REMOVER */}
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                  onClick={() => setDeleteTarget(cliente)}
                >
                  <Trash2 size={16} className="text-white" />
                  Remover
                </Button>

                {/* EDITAR */}
                <Button
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={() => onEdit?.(cliente)}
                >
                  <Pencil size={16} />
                  Editar Cliente
                </Button>

              </div>

            </div>
          )}
        </div>
      </div>

      {/* MODAL DELETAR */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Cliente"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-1" />
              <div>
                <p>
                  Remover o cliente <strong>{deleteTarget.nome}</strong>?
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Origem: {deleteTarget.origem || "Manual"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="w-1/2"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </Button>

              <Button
                className="w-1/2 bg-red-600 hover:bg-red-700"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Removendo...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>,
    root
  );
}

function Field({ label, value, icon }) {
  if (!value) return null;

  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
