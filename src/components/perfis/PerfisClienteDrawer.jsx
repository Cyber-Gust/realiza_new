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
  User2,
  Building2,
} from "lucide-react";
import Image from "next/image";

export default function PerfisClienteDrawer({
  clienteId,
  onClose,
  onEdit,
  reload,
}) {
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (clienteId) fetchCliente();
  }, [clienteId, fetchCliente]);

  if (!mounted || !clienteId) return null;

  const root = document.getElementById("drawer-root");
  if (!root) return null;

  return createPortal(
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
          <div className="p-6 text-center text-muted-foreground">
            Cliente não encontrado.
          </div>
        ) : (
          <div className="p-6 space-y-6 text-sm">

            {/* CARD PRINCIPAL */}
            <Card className="p-4 flex flex-col gap-3">

              {/* AVATAR */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <Image
                    src={getImageSrc(cliente.foto)}
                    alt={cliente.nome}
                    fill
                    className="rounded-full object-cover border border-border"
                    sizes="48px"
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <User size={16} />
                    {cliente.nome}
                  </div>

                  <p className="text-xs text-muted-foreground capitalize">
                    Cliente
                  </p>
                </div>
              </div>

            </Card>

            {/* CONTATOS */}
            <Card className="p-4 grid grid-cols-1 gap-3">
              <Field icon={<Phone size={14} />} label="Telefone" value={cliente.telefone} />
              <Field icon={<Mail size={14} />} label="Email" value={cliente.email || "Não informado"} />
              <Field icon={<User size={14} />} label="CPF/CNPJ" value={cliente.cpf_cnpj} />
            </Card>

            {/* ORIGEM DO CADASTRO */}
            {cliente.origem && (
              <Card className="p-4 grid grid-cols-1 gap-3">
                <Field icon={<Info size={14} />} label="Origem" value={cliente.origem} />
              </Card>
            )}

            {/* ENDEREÇO */}
            {(cliente.endereco_logradouro ||
              cliente.endereco_bairro ||
              cliente.endereco_cidade) && (
              <Card className="p-4 space-y-3">
                <p className="font-semibold text-sm flex items-center gap-1">
                  <MapPin size={14} /> Endereço
                </p>

                <Field
                  label="Endereço"
                  value={`${cliente.endereco_logradouro || ""}, Nº ${
                    cliente.endereco_numero || "-"
                  } - ${cliente.endereco_bairro || ""}`}
                />

                <Field
                  icon={<Building2 size={14} />}
                  label="Cidade"
                  value={`${cliente.endereco_cidade || ""} - ${
                    cliente.endereco_estado || ""
                  }`}
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

            {/* BOTÃO EDITAR */}
            <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={() => onEdit?.(cliente)}
            >
              <Pencil size={16} /> Editar Cliente
            </Button>

          </div>
        )}
      </div>

    </div>,
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
