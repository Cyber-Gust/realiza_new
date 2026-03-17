"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { useToast } from "@/contexts/ToastContext";
import { createPortal } from "react-dom";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  Plus,
  Clock
} from "lucide-react";

export default function CRMLeadDetailDrawer({ leadId, onClose, onEdit }) {
  const supabase = createClientComponentClient();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [historyText, setHistoryText] = useState("");
  const [savingHistory, setSavingHistory] = useState(false);

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

  async function addHistory() {
    if (!historyText.trim()) return;

    try {
      setSavingHistory(true);
      const { error } = await supabase.rpc("add_lead_history", {
        p_lead_id: leadId,
        p_texto: historyText
      });

      if (error) throw error;

      toast.success("Histórico adicionado");

      const newEntry = {
        data: new Date().toISOString(),
        texto: historyText
      };

      setLead(prev => ({
        ...prev,
        historico: [...(prev.historico || []), newEntry]
      }));

      setHistoryText("");

    } catch (err) {
      toast.error("Erro ao adicionar histórico: " + err.message);
    } finally {
      setSavingHistory(false);
    }
  }

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
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full sm:w-[480px] h-full bg-panel-card border-l border-border shadow-xl overflow-y-auto animate-slide-left flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Detalhes do Lead
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

            {/* IMÓVEL DE INTERESSE */}
            <Card className="p-4 space-y-2">
              <p className="font-semibold text-sm flex items-center gap-1">
                <Home size={14} /> Imóvel de Interesse
              </p>

              {lead.imoveis ? (
                <div className="text-xs space-y-1">
                  <p>
                    <span className="text-muted-foreground">Código:</span>{" "}
                    <span className="font-medium">{lead.imoveis?.codigo_ref}</span>
                  </p>

                  <p>
                    <span className="text-muted-foreground">Título:</span>{" "}
                    {lead.imoveis?.titulo}
                  </p>

                  <p className="text-muted-foreground">
                    {lead.imoveis?.endereco_cidade} - {lead.imoveis?.endereco_bairro}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Nenhum imóvel associado
                </p>
              )}
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

            {/* HISTÓRICO */}
            <Card className="p-4 space-y-4">

              <p className="font-semibold text-sm flex items-center gap-1">
                <Clock size={14} /> Histórico
              </p>

              {/* INPUT */}
              <div className="flex flex-col gap-2">
                <textarea
                  className="border border-border rounded-md p-2 text-xs min-h-[70px]"
                  placeholder="Adicionar histórico do lead..."
                  value={historyText}
                  onChange={(e) => setHistoryText(e.target.value)}
                />

                <Button
                  size="sm"
                  onClick={addHistory}
                  disabled={savingHistory}
                  className="flex items-center gap-2 w-fit"
                >
                  {savingHistory ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Plus size={14} />
                  )}
                  Adicionar Histórico
                </Button>
              </div>

              {/* LISTA */}
              <div className="space-y-2">
                {lead.historico?.length ? (
                  [...lead.historico]
                    .sort((a, b) => new Date(b.data) - new Date(a.data))
                    .map((item, i) => (
                      <Card key={i} className="p-3 text-xs">
                        <p className="text-muted-foreground text-[11px] mb-1">
                          {new Date(item.data).toLocaleString("pt-BR")}
                        </p>
                        <p>{item.texto}</p>
                      </Card>
                    ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Nenhum histórico registrado.
                  </p>
                )}
              </div>

            </Card>

            {/* EDITAR */}
            <Button
              className="w-full flex items-center justify-center gap-2"
              onClick={() => onEdit?.(lead)}
            >
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