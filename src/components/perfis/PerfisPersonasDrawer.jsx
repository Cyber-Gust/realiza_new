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
  ScrollText,
  BadgeInfo,
  Pencil,
  User2,
  Building2,
} from "lucide-react";
import Image from "next/image";

export default function PerfisPersonasDrawer({
  personaId,
  onClose,
  onEdit,
  reload,
}) {
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const toast = useToast();

  const getImageSrc = (foto) => {
    if (!foto || typeof foto !== "string") return "/placeholder-avatar.png";

    if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
    if (foto.startsWith("/")) return foto;

    return "/" + foto;
  };

  const fetchPersona = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/perfis/list?type=personas&id=${personaId}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setPersona(json.data);
    } catch (err) {
      toast.error("Erro ao carregar dados da pessoa: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [personaId, toast]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (personaId) fetchPersona();
  }, [personaId, fetchPersona]);

  if (!mounted || !personaId) return null;

  const root = document.getElementById("drawer-root");
  if (!root) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">

      <div className="w-full sm:w-[480px] h-full bg-panel-card border-l border-border shadow-xl overflow-y-auto animate-slide-left flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <User2 size={18} />
            Detalhes da Pessoa
          </h2>

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
        ) : !persona ? (
          <div className="p-6 text-center text-muted-foreground">
            Pessoa não encontrada.
          </div>
        ) : (
          <div className="p-6 space-y-6 text-sm">

            {/* CARD PRINCIPAL */}
            <Card className="p-4 flex gap-3 items-center">
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-muted border">
                <Image
                  src={getImageSrc(persona.foto)}
                  alt={persona.nome}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>

              <div className="flex flex-col">
                <p className="text-base font-semibold">{persona.nome}</p>
                <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                  <User2 size={12} /> {persona.tipo}
                </p>
              </div>
            </Card>

            {/* CONTATOS */}
            <Card className="p-4 grid grid-cols-1 gap-3">
              <Field icon={<Phone size={14} />} label="Telefone" value={persona.telefone} />
              <Field icon={<Mail size={14} />} label="Email" value={persona.email || "Não informado"} />
              <Field icon={<User size={14} />} label="CPF/CNPJ" value={persona.cpf_cnpj} />
            </Card>

            {/* ENDEREÇO */}
            {persona.endereco_logradouro ||
            persona.endereco_bairro ||
            persona.endereco_cidade ? (
              <Card className="p-4 space-y-3">
                <p className="font-semibold text-sm flex items-center gap-1">
                  <MapPin size={14} /> Endereço
                </p>

                <Field
                  label="Endereço"
                  value={`${persona.endereco_logradouro || ""}, Nº ${
                    persona.endereco_numero || "-"
                  } - ${persona.endereco_bairro || ""}`}
                />

                <Field
                  icon={<Building2 size={14} />}
                  label="Cidade"
                  value={`${persona.endereco_cidade || ""} - ${
                    persona.endereco_estado || ""
                  }`}
                />

                <Field label="CEP" value={persona.endereco_cep} />
              </Card>
            ) : null}

            {/* OBSERVAÇÕES */}
            {!!persona.observacoes && (
              <Card className="p-4 space-y-2">
                <p className="font-semibold text-sm flex items-center gap-1">
                  <ScrollText size={14} /> Observações
                </p>
                <p className="text-xs text-muted-foreground whitespace-pre-line">
                  {persona.observacoes}
                </p>
              </Card>
            )}

            {/* BOTÃO EDITAR */}
            <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={() => onEdit?.(persona)}
            >
              <Pencil size={16} /> Editar Cadastro
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
