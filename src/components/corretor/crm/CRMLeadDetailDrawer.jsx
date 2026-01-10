"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { useToast } from "@/contexts/ToastContext";
import { createPortal } from "react-dom";

import {
  Loader2,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Home,
  Info,
  Pencil,
} from "lucide-react";

export default function CRMLeadDetailDrawer({ leadId, onClose, onEdit }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toast = useToast();

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm/leads?id=${leadId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLead(json.data);
    } catch (err) {
      toast.error("Erro ao carregar lead: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [leadId, toast]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (leadId) fetchLead();
  }, [leadId, fetchLead]);

  if (!mounted) return null;
  if (!leadId) return null;

  const root = document.getElementById("drawer-root");
  if (!root) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:w-[480px] h-full bg-panel-card border-l border-border shadow-xl overflow-y-auto animate-slide-left flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Detalhes do Lead</h2>
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
        ) : !lead ? (
          <div className="p-6 text-center text-muted-foreground">
            Lead não encontrado.
          </div>
        ) : (
          <div className="p-6 space-y-6 text-sm">

            {/* CARD PRINCIPAL */}
            <Card className="p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-base font-semibold">
                <User size={16} />
                {lead.nome}
              </div>
              <p className="text-muted-foreground text-xs">
                {lead.status?.toUpperCase()}
              </p>
            </Card>

            {/* CONTATOS */}
            <Card className="p-4 grid grid-cols-1 gap-3">
              <Field icon={<Phone size={14} />} label="Telefone" value={lead.telefone} />
              <Field icon={<Mail size={14} />} label="Email" value={lead.email || "Não informado"} />
              <Field icon={<Info size={14} />} label="Origem" value={lead.origem || "Manual"} />
              <Field icon={<User size={14} />} label="Corretor" value={lead.profiles?.nome_completo || "Nenhum"} />
            </Card>

            {/* PERFIL DO IMÓVEL */}
            <Card className="p-4 space-y-4">
              <p className="font-semibold text-sm flex items-center gap-1">
                <Home size={14} /> Perfil de Busca
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo" value={lead.interesse_tipo} />
                <Field label="Disponibilidade" value={lead.interesse_disponibilidade} />
                <Field label="Preço Mín." value={lead.faixa_preco_min ? `R$ ${lead.faixa_preco_min}` : "-"} />
                <Field label="Preço Máx." value={lead.faixa_preco_max ? `R$ ${lead.faixa_preco_max}` : "-"} />
                <Field label="Quartos" value={lead.quartos} />
                <Field label="Banheiros" value={lead.banheiros} />
                <Field label="Suítes" value={lead.suites} />
                <Field label="Vagas" value={lead.vagas} />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Field icon={<MapPin size={14} />} label="Cidade" value={lead.cidade_preferida} />
                <Field icon={<MapPin size={14} />} label="Bairro" value={lead.bairro_preferido} />
              </div>
            </Card>

            {/* EXTRAS */}
            <Card className="p-4 grid grid-cols-2 gap-4">
              <Field label="Pet Friendly" value={lead.pet_friendly ? "Sim" : "Não"} />
              <Field label="Mobiliado" value={lead.mobiliado ? "Sim" : "Não"} />
              <Field label="Condomínio Máx." value={lead.condominio_max ? `R$ ${lead.condominio_max}` : "-"} />
              <Field label="Urgência" value={lead.urgencia || "-"} />
            </Card>

            {!!lead.motivo_busca && (
              <Card className="p-4">
                <p className="font-semibold text-sm">Motivo da Busca</p>
                <p className="text-xs text-muted-foreground mt-1">{lead.motivo_busca}</p>
              </Card>
            )}

            {!!lead.observacoes && (
              <Card className="p-4">
                <p className="font-semibold text-sm">Observações</p>
                <p className="text-xs text-muted-foreground mt-1">{lead.observacoes}</p>
              </Card>
            )}

            <Button className="w-full flex items-center justify-center gap-2" onClick={() => onEdit?.(lead)}>
              <Pencil size={16} /> Editar Lead
            </Button>
          </div>
        )}
      </div>
    </div>,
    root
  );
}

function Field({ label, value, icon }) {
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}
