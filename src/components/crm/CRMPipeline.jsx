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
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import Toast from "@/components/admin/ui/Toast";

// Etapas definidas pelo enum lead_status
const STAGES = [
  "novo",
  "qualificado",
  "visita_agendada",
  "proposta_feita",
  "documentacao",
  "concluido",
  "perdido",
];

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

  const handleMoveLead = async (leadId, fromStage, toStage) => {
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

  useEffect(() => {
    loadPipeline();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Carregando pipeline...
      </div>
    );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={(event) => {
        const [fromStage, leadId] = event.active.id.split(":");
        const lead = pipeline[fromStage]?.find((l) => l.id === leadId);
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
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {STAGES.map((stage) => (
          <DroppableColumn
            key={stage}
            id={stage}
            stage={stage}
            leads={pipeline[stage] || []}
          />
        ))}
      </div>

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

import { useDroppable, useDraggable } from "@dnd-kit/core";

function DroppableColumn({ id, stage, leads }) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="bg-panel-card rounded-lg border border-border p-3 flex flex-col max-h-[80vh] min-w-[250px]"
    >
      <h4 className="text-sm font-semibold capitalize mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-foreground">
          {stage.replace("_", " ")}
          <span
            className={`px-2 py-0.5 text-xs rounded-full border ${STAGE_COLORS[stage]}`}
          >
            {leads.length}
          </span>
        </span>
      </h4>

      <div className="space-y-2 overflow-y-auto pr-1 flex-1">
        {leads.length > 0 ? (
          leads.map((lead) => (
            <DraggableLead key={lead.id} lead={lead} stage={stage} />
          ))
        ) : (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            Sem leads
          </p>
        )}
      </div>
    </div>
  );
}

function DraggableLead({ lead, stage }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `${stage}:${lead.id}`,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0 : 1,
    transition: isDragging ? "none" : "transform 0.2s ease",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 rounded-lg shadow-sm bg-background border border-border cursor-grab hover:bg-muted/20 select-none"
    >
      <p className="font-medium text-sm text-foreground">{lead.nome}</p>
      <p className="text-xs text-muted-foreground">{lead.telefone}</p>
      <p className="text-xs text-muted-foreground italic">{lead.origem}</p>
    </div>
  );
}
