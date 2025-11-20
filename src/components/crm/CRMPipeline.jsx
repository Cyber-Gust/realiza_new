"use client";
import { useState, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  rectIntersection,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import Toast from "@/components/admin/ui/Toast";

/* ================================================
   🔹 Definição oficial das etapas do funil
   ================================================ */
const STAGES = [
  "novo",
  "qualificado",
  "visita_agendada",
  "proposta_feita",
  "documentacao",
  "concluido",
  "perdido",
];

/* Badge color consistente com tua UI */
const STAGE_COLORS = {
  novo: "bg-blue-100 text-blue-800 border-blue-300",
  qualificado: "bg-green-100 text-green-800 border-green-300",
  visita_agendada: "bg-yellow-100 text-yellow-800 border-yellow-300",
  proposta_feita: "bg-purple-100 text-purple-800 border-purple-300",
  documentacao: "bg-orange-100 text-orange-800 border-orange-300",
  concluido: "bg-emerald-100 text-emerald-800 border-emerald-300",
  perdido: "bg-red-100 text-red-800 border-red-300",
};

export default function CRMPipeline() {
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);

  const [activeLead, setActiveLead] = useState(null);
  const [mounted, setMounted] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => setMounted(true), []);

  /* ================================================
     🔹 Carrega pipeline do backend
     ================================================ */
  const loadPipeline = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/crm/pipeline", { cache: "no-store" });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setPipeline(json.data || {});
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  /* ================================================
     🔹 Move lead
     ================================================ */
  const handleMoveLead = async (leadId, fromStage, toStage) => {
    leadId = String(leadId);

    if (fromStage === toStage) return;

    try {
      const res = await fetch("/api/crm/pipeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leadId, new_status: toStage }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      Toast.success("Lead movido com sucesso!");
      await loadPipeline();
    } catch (err) {
      Toast.error(err.message);
    }
  };

  /* ================================================
     🔹 Loading
     ================================================ */
  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" />
        Carregando pipeline...
      </div>
    );

  /* ================================================
     🔹 UI do Pipeline
     ================================================ */
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={(event) => {
        const [fromStage, leadId] = event.active.id.split(":");
        const lead = pipeline[fromStage]?.find((l) => String(l.id) === String(leadId));
        setActiveLead(lead || null);
      }}
      onDragEnd={(event) => {
        const { active, over } = event;
        setActiveLead(null);
        if (!over) return;

        const [fromStage, leadId] = active.id.split(":");
        const toStage = over.id;

        handleMoveLead(leadId, fromStage, toStage);
      }}
    >
      <div
        className="grid auto-cols-[280px] grid-flow-col gap-4 overflow-x-auto pb-6
                   snap-x snap-mandatory scrollbar-thin scrollbar-thumb-muted/40 scrollbar-track-transparent"
      >
        {STAGES.map((stage) => (
          <DroppableColumn
            key={stage}
            id={stage}
            stage={stage}
            leads={pipeline[stage] || []}
          />
        ))}
      </div>

      {/* DRAG OVERLAY */}
      {mounted &&
        createPortal(
          <DragOverlay>
            {activeLead ? (
              <div className="p-3 rounded-lg shadow-xl bg-background border border-border w-[240px]">
                <p className="font-medium text-sm text-foreground">{activeLead.nome}</p>
                <p className="text-xs text-muted-foreground">{activeLead.telefone}</p>
                <p className="text-xs text-muted-foreground italic">{activeLead.origem}</p>
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}

/* ============================================================
   🔹 COLUMN
   ============================================================ */
function DroppableColumn({ id, stage, leads }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border border-border bg-panel-card p-4 flex flex-col h-[80vh]
                  snap-start transition-all duration-150
                  ${isOver ? "ring-2 ring-primary/60" : ""}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-3">
        <span className="capitalize font-semibold text-foreground text-sm">
          {stage.replaceAll("_", " ")}
        </span>

        <span
          className={`px-2 py-0.5 text-xs rounded-full border ${STAGE_COLORS[stage]}`}
        >
          {leads.length}
        </span>
      </div>

      {/* LIST */}
      <div className="space-y-2 overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-muted/30 scrollbar-track-transparent">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <DraggableLead key={lead.id} lead={lead} stage={stage} />
          ))
        ) : (
          <p className="text-xs text-muted-foreground italic text-center py-6">
            Sem leads
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   🔹 DRAGGABLE CARD
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
    transition: isDragging ? "none" : "transform 0.15s ease",
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="p-3 rounded-lg shadow-sm bg-background border border-border cursor-grab 
                 hover:bg-muted/40 active:cursor-grabbing select-none transition"
    >
      <p className="font-medium text-sm text-foreground">{lead.nome}</p>
      <p className="text-xs text-muted-foreground">{lead.telefone}</p>
      <p className="text-xs text-muted-foreground italic">{lead.origem}</p>
    </div>
  );
}
