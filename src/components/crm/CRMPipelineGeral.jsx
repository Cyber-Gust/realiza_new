"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Loader2,
  UserPlus,
  UserCheck,
  CalendarClock,
  FileText,
  Briefcase,
  Trophy,
  XCircle,
  Phone,
  MapPin
} from "lucide-react";

import { useToast } from "@/contexts/ToastContext";
import CRMLeadDetailDrawer from "./CRMLeadDetailDrawer";

const STAGE_CONFIG = {
  novo: {
    label: "Novo Lead",
    icon: UserPlus,
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/20",
    border: "border-blue-200 dark:border-blue-500/30",
    barColor: "bg-blue-500"
  },
  qualificado: {
    label: "Qualificando",
    icon: UserCheck,
    color: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-500/20",
    border: "border-indigo-200 dark:border-indigo-500/30",
    barColor: "bg-indigo-500"
  },
  visita_agendada: {
    label: "Visita Agendada",
    icon: CalendarClock,
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/20",
    border: "border-amber-200 dark:border-amber-500/30",
    barColor: "bg-amber-500"
  },
  proposta_feita: {
    label: "Proposta Enviada",
    icon: FileText,
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-500/20",
    border: "border-purple-200 dark:border-purple-500/30",
    barColor: "bg-purple-500"
  },
  documentacao: {
    label: "Documentação",
    icon: Briefcase,
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-500/20",
    border: "border-orange-200 dark:border-orange-500/30",
    barColor: "bg-orange-500"
  },
  concluido: {
    label: "Venda Fechada",
    icon: Trophy,
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/20",
    border: "border-emerald-200 dark:border-emerald-500/30",
    barColor: "bg-emerald-500"
  },
  perdido: {
    label: "Perdido",
    icon: XCircle,
    color: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/20",
    border: "border-rose-200 dark:border-rose-500/30",
    barColor: "bg-rose-500"
  }
};

const STAGES = Object.keys(STAGE_CONFIG);

function getLeadProfile(lead) {
  return lead?.corretor || lead?.profiles || null;
}

function getCorretorNome(lead) {
  const profile = getLeadProfile(lead);

  return (
    lead?.corretor_nome ||
    profile?.nome_completo ||
    lead?.responsavel_nome ||
    "Sem corretor"
  );
}

function getCorretorId(lead) {
  const profile = getLeadProfile(lead);
  return String(lead?.corretor_id ?? profile?.id ?? getCorretorNome(lead));
}

export default function CRMPipelineGeral() {
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCorretor, setSelectedCorretor] = useState("todos");

  const toast = useToast();

  const openLeadDrawer = (lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  const loadPipeline = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/crm/pipeline_geral", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Erro ao carregar pipeline");

      setPipeline(json.data || {});
    } catch (err) {
      toast.error(err.message || "Erro ao carregar pipeline");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  const allLeads = useMemo(() => {
    return STAGES.flatMap((stage) => pipeline[stage] || []);
  }, [pipeline]);

  const corretorOptions = useMemo(() => {
    const map = new Map();

    allLeads.forEach((lead) => {
      const nome = getCorretorNome(lead);
      const id = getCorretorId(lead);

      if (!map.has(id)) {
        map.set(id, { id, nome });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
    );
  }, [allLeads]);

  const filteredPipeline = useMemo(() => {
    if (selectedCorretor === "todos") return pipeline;

    const next = {};

    for (const stage of STAGES) {
      next[stage] = (pipeline[stage] || []).filter(
        (lead) => getCorretorId(lead) === selectedCorretor
      );
    }

    return next;
  }, [pipeline, selectedCorretor]);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col justify-center items-center text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p className="text-sm font-medium">Carregando oportunidades...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-2 pb-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex flex-col gap-1 w-full md:w-[280px]">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Filtrar por corretor
            </label>

            <select
              value={selectedCorretor}
              onChange={(e) => setSelectedCorretor(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="todos">Todos os corretores</option>
              {corretorOptions.map((corretor) => (
                <option key={corretor.id} value={corretor.id}>
                  {corretor.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="md:ml-auto text-xs text-muted-foreground">
            {selectedCorretor === "todos"
              ? `Exibindo ${allLeads.length} lead(s) no total`
              : `Filtro ativo: ${
                  corretorOptions.find((c) => c.id === selectedCorretor)?.nome ||
                  "Corretor"
                }`}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto md:overflow-x-auto p-2">
        <div className="flex flex-col md:flex-row gap-5 min-w-full md:min-w-max">
          {STAGES.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              leads={filteredPipeline[stage] || []}
              onOpenLead={openLeadDrawer}
            />
          ))}
        </div>
      </div>

      {drawerOpen && (
        <CRMLeadDetailDrawer
          leadId={selectedLead?.id}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}

function PipelineColumn({ stage, leads, onOpenLead }) {
  const config = STAGE_CONFIG[stage];
  const Icon = config.icon;

  return (
    <div
      className="
        flex flex-col shrink-0
        w-full md:w-[320px]
        h-[380px] md:h-full
        rounded-2xl md:rounded-none
        border md:border-transparent
        p-2 md:p-0
        bg-panel-card/30 border-border/50 md:bg-transparent
      "
    >
      <div
        className="
          flex items-center justify-between
          p-3 mb-3 rounded-xl border
          bg-panel-card/80 backdrop-blur-sm
        "
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`p-1.5 rounded-xl ${config.bg} ${config.color} border ${config.border}`}
          >
            <Icon size={16} strokeWidth={2.5} />
          </div>

          <span className="font-semibold text-foreground text-sm">
            {config.label}
          </span>
        </div>

        <span className="px-2.5 py-0.5 text-xs font-bold text-muted-foreground bg-background rounded-full border border-border shadow-sm">
          {leads.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-2 space-y-3">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            stage={stage}
            onOpenLead={onOpenLead}
          />
        ))}

        {leads.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground bg-panel-card/40">
            Nenhum lead nesta etapa
          </div>
        )}
      </div>
    </div>
  );
}

function LeadCard({ lead, stage, onOpenLead }) {
  const config = STAGE_CONFIG[stage];
  const corretorNome = getCorretorNome(lead);

  return (
    <div
      onClick={() => onOpenLead?.(lead)}
      className="
        group relative p-4 rounded-xl border transition-all duration-200 ease-in-out
        bg-panel-card border-border cursor-pointer
        shadow-sm hover:shadow-md hover:border-primary/30
      "
    >
      <div
        className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${config.barColor}`}
      />

      <div className="pl-3 flex flex-col gap-2">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.14em] mb-1">
              {corretorNome}
            </p>

            <p className="font-semibold text-foreground text-sm leading-tight mb-0.5 truncate">
              {lead.nome}
            </p>

            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
              {lead.origem || "Sem origem"}
            </p>
          </div>
        </div>

        <div className="h-px w-full bg-border" />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Phone size={12} className="text-muted-foreground/70 shrink-0" />
          <span className="truncate">{lead.telefone || "Sem telefone"}</span>
        </div>

        {lead.imovel_interesse && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin size={12} className="text-muted-foreground/70 shrink-0" />
            <span className="truncate max-w-[220px]">
              {lead.imovel_interesse}
            </span>
          </div>
        )}

        {!!lead.faixa_preco_max && (
          <div className="mt-1 self-start px-2 py-1 bg-background text-foreground text-[10px] font-bold rounded-md border border-border">
            Até R$ {Number(lead.faixa_preco_max).toLocaleString("pt-BR")}
          </div>
        )}
      </div>
    </div>
  );
}