"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  rectIntersection,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";

import { useDroppable, useDraggable } from "@dnd-kit/core";
import { createPortal } from "react-dom";

import { 
  Loader2, 
  UserPlus, 
  UserCheck, 
  CalendarClock, 
  FileText, 
  Briefcase, 
  Trophy, 
  XCircle,
  GripVertical,
  Phone,
  MapPin
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
// import { cn } from "@/lib/utils"; // Descomente se precisar usar cn()

/* ============================================================
   CONFIGURAÇÃO VISUAL E ÍCONES
============================================================ */
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
  },
};

const STAGES = Object.keys(STAGE_CONFIG);

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */
export default function CRMPipeline() {
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeLead, setActiveLead] = useState(null);
  const [activeStage, setActiveStage] = useState(null);

  const toast = useToast();
  
  // TouchSensor crucial: Permite scroll nativo da página. Só ativa o drag se segurar por 250ms.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, 
        tolerance: 5,
      },
    })
  );

  const loadPipeline = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/crm/pipeline", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPipeline(json.data || {});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  const handleMoveLead = async (leadId, fromStage, toStage) => {
    leadId = String(leadId);
    if (fromStage === toStage) return;

    const newPipeline = { ...pipeline };
    const leadIndex = newPipeline[fromStage].findIndex(l => String(l.id) === leadId);
    
    if (leadIndex > -1) {
       const [movedLead] = newPipeline[fromStage].splice(leadIndex, 1);
       if (!newPipeline[toStage]) newPipeline[toStage] = [];
       newPipeline[toStage].push(movedLead);
       setPipeline(newPipeline);
    }

    try {
      const res = await fetch("/api/crm/pipeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, new_status: toStage }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error);
      }
      toast.success("Lead atualizado");
    } catch (err) {
      toast.error("Erro ao mover lead");
      loadPipeline(); 
    }
  };

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col justify-center items-center text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin mb-4 text-muted-foreground/50" />
        <p className="text-sm font-medium">Carregando oportunidades...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={(event) => {
          const [fromStage, leadId] = event.active.id.split(":");
          const lead = pipeline[fromStage]?.find(
            (l) => String(l.id) === String(leadId)
          );
          setActiveLead(lead || null);
          setActiveStage(fromStage);
        }}
        onDragEnd={(event) => {
          const { active, over } = event;
          setActiveLead(null);
          setActiveStage(null);
          
          if (!over) return;

          const [fromStage, leadId] = active.id.split(":");
          const toStage = over.id;
          
          handleMoveLead(leadId, fromStage, toStage);
        }}
      >
        {/* CONTAINER PRINCIPAL: Vertical no Mobile (overflow-y), Horizontal no Desktop (overflow-x) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden md:overflow-x-auto md:overflow-y-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent p-2 md:pb-4 md:pt-0">
          <div className="flex flex-col md:flex-row h-auto md:h-full gap-5 md:gap-5 min-w-full md:min-w-max pb-16 md:pb-0">
            {STAGES.map((stage) => (
              <PipelineColumn
                key={stage}
                id={stage}
                stage={stage}
                leads={pipeline[stage] || []}
              />
            ))}
          </div>
        </div>

        {/* CARD FLUTUANTE (DURANTE O DRAG) */}
        {createPortal(
          <DragOverlay dropAnimation={dropAnimation}>
            {activeLead && activeStage && (
              <div className="rotate-3 cursor-grabbing scale-105 z-[9999]">
                 <LeadCard lead={activeLead} stage={activeStage} overlay />
              </div>
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
}

/* ============================================================
   COLUNA (TRACK)
============================================================ */
function PipelineColumn({ id, stage, leads }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = STAGE_CONFIG[stage];
  const Icon = config.icon;

  return (
    <div 
      ref={setNodeRef} 
      className={`
        flex flex-col shrink-0 
        w-full md:w-[320px] 
        h-[380px] md:h-full max-h-[60vh] md:max-h-full
        rounded-2xl md:rounded-none 
        border md:border-transparent
        p-2 md:p-0
        transition-colors duration-200
        ${isOver 
            ? "bg-primary/5 border-primary/30 shadow-inner" 
            : "bg-panel-card/30 border-border/50 md:bg-transparent" // Destaca a coluna no mobile para o usuário ver onde soltar
        }
      `}
    >
      {/* CABEÇALHO DA COLUNA */}
      <div className={`
        flex items-center justify-between p-3 mb-3 rounded-xl border backdrop-blur-sm transition-all duration-300
        ${isOver 
            ? "bg-background border-primary/20 shadow-sm" 
            : "bg-panel-card/80 border-transparent md:hover:bg-panel-card"
        }
      `}>
        <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-xl ${config.bg} ${config.color} border ${config.border}`}>
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

      {/* ÁREA DOS CARDS (SCROLL VERTICAL INTERNO) */}
      <div className="flex-1 overflow-y-auto px-1 pb-2 space-y-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {leads.length > 0 ? (
            leads.map((lead) => (
            <DraggableLead key={lead.id} lead={lead} stage={stage} />
            ))
        ) : (
            // Placeholder vazio elegante
            <div className="h-24 border-2 border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center text-muted-foreground text-xs gap-1 opacity-60">
                <span className="opacity-50">Sem leads</span>
            </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENTE DRAGGABLE WRAPPER
============================================================ */
function DraggableLead({ lead, stage }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `${stage}:${lead.id}`,
    });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0 : 1, 
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      className="cursor-grab active:cursor-grabbing"
    >
      <LeadCard lead={lead} stage={stage} />
    </div>
  );
}

/* ============================================================
   DESIGN DO CARD (VISUAL)
============================================================ */
function LeadCard({ lead, stage, overlay = false }) {
    const config = STAGE_CONFIG[stage];

    return (
        <div className={`
            group relative p-4 rounded-xl border transition-all duration-200 ease-in-out bg-panel-card border-border
            ${overlay 
                ? "shadow-2xl shadow-black/20 ring-1 ring-primary/20 scale-105" 
                : "shadow-sm hover:shadow-md hover:border-primary/30"
            }
        `}>
            {/* Barra lateral colorida indicando status */}
            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${config.barColor}`} />

            <div className="pl-3 flex flex-col gap-2">
                {/* Cabeçalho do Card */}
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-foreground text-sm leading-tight mb-0.5">
                            {lead.nome}
                        </p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                            {lead.origem || "Sem origem"}
                        </p>
                    </div>
                    {/* Ícone de Grab para indicar que é arrastável */}
                    <div className={`text-muted-foreground/40 ${overlay ? 'opacity-100' : 'opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                        <GripVertical size={16} />
                    </div>
                </div>

                <div className="h-px w-full bg-border" />

                {/* Infos de contato */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone size={12} className="text-muted-foreground/70 shrink-0" />
                        <span className="truncate">{lead.telefone}</span>
                    </div>
                    {lead.imovel_interesse && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin size={12} className="text-muted-foreground/70 shrink-0" />
                            <span className="truncate max-w-[180px] sm:max-w-[200px]">{lead.imovel_interesse}</span>
                        </div>
                    )}
                </div>
                
                {/* Tag de Valor (se houver) */}
                {lead.valor && (
                    <div className="mt-1 self-start px-2 py-1 bg-background text-foreground text-[10px] font-bold rounded-md border border-border">
                        R$ {lead.valor}
                    </div>
                )}
            </div>
        </div>
    )
}