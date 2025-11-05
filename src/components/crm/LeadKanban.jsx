"use client";
import { useLeads } from "@/hooks/useLeads";
import { useEffect, useState } from "react";
import { DndContext, useSensor, PointerSensor, closestCorners } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import Card from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";

const STATUS = ["novo", "qualificado", "visita_agendada", "proposta_feita", "documentacao", "concluido", "perdido"];

export default function LeadKanban() {
  const { leads, updateStatus } = useLeads();
  const [columns, setColumns] = useState({});

  useEffect(() => {
    const grouped = STATUS.reduce((acc, st) => {
      acc[st] = leads.filter((l) => l.status === st);
      return acc;
    }, {});
    setColumns(grouped);
  }, [leads]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-x-auto">
      {STATUS.map((status) => (
        <div key={status} className="bg-panel-card rounded-xl border border-border p-2 shadow-sm">
          <h4 className="text-sm font-semibold uppercase mb-2 text-muted-foreground flex items-center gap-2">
            <Badge variant="outline">{status.replace("_", " ")}</Badge>
            <span className="text-xs">({columns[status]?.length || 0})</span>
          </h4>
          <div className="space-y-2 min-h-[150px]">
            {(columns[status] || []).map((lead) => (
              <div
                key={lead.id}
                draggable
                onDragEnd={() => {}}
                onDragStart={(e) => e.dataTransfer.setData("id", lead.id)}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("id");
                  updateStatus(id, status);
                }}
                className="p-3 bg-muted/40 rounded-lg border border-border cursor-grab"
              >
                <p className="font-medium text-foreground">{lead.nome}</p>
                <p className="text-xs text-muted-foreground">{lead.origem}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
