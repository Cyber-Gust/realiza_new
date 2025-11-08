"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCorners,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import Badge from "@/components/admin/ui/Badge";
import { Phone, Mail, User } from "lucide-react";

const STATUS = [
  { key: "novo", label: "Novo", tone: "sky" },
  { key: "qualificado", label: "Qualificado", tone: "indigo" },
  { key: "visita_agendada", label: "Visita", tone: "amber" },
  { key: "proposta_feita", label: "Proposta", tone: "emerald" },
  { key: "documentacao", label: "Docs", tone: "purple" },
  { key: "concluido", label: "Concluído", tone: "emerald" },
  { key: "perdido", label: "Perdido", tone: "red" },
];

const toneMap = {
  sky: "bg-sky-500/15 text-sky-700 border-sky-400/30",
  indigo: "bg-indigo-500/15 text-indigo-700 border-indigo-400/30",
  amber: "bg-amber-500/15 text-amber-800 border-amber-400/30",
  emerald: "bg-emerald-500/15 text-emerald-700 border-emerald-400/30",
  purple: "bg-purple-500/15 text-purple-700 border-purple-400/30",
  red: "bg-red-500/15 text-red-700 border-red-400/30",
};

function DraggableCard({ lead }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: lead.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="bg-background border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-accent/40 cursor-grab active:cursor-grabbing transition-all"
    >
      <div className="flex items-center gap-2 mb-1">
        <User size={14} className="text-accent" />
        <p className="font-medium text-sm text-foreground truncate">
          {lead.nome}
        </p>
      </div>
      <div className="flex flex-col text-xs text-muted-foreground space-y-1 pl-5">
        {lead.telefone && (
          <p className="flex items-center gap-1 truncate">
            <Phone size={11} className="opacity-70" /> {lead.telefone}
          </p>
        )}
        {lead.email && (
          <p className="flex items-center gap-1 truncate">
            <Mail size={11} className="opacity-70" /> {lead.email}
          </p>
        )}
        {lead.origem && (
          <p className="italic opacity-70 truncate">via {lead.origem}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function LeadKanban({ leads, onStatusChange }) {
  const [columns, setColumns] = useState({});
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    const grouped = STATUS.reduce((acc, { key }) => {
      acc[key] = leads.filter((l) => l.status === key);
      return acc;
    }, {});
    setColumns(grouped);
  }, [leads]);

  const findColumn = (leadId) =>
    Object.keys(columns).find((key) =>
      columns[key].some((l) => l.id === leadId)
    );

  const handleDragEnd = async ({ active, over }) => {
    if (!over) return;
    const from = findColumn(active.id);
    const to = over.id;
    if (from && to && from !== to) {
      const lead = columns[from].find((l) => l.id === active.id);
      setColumns((prev) => {
        const fromList = prev[from].filter((l) => l.id !== active.id);
        const toList = [lead, ...(prev[to] || [])];
        return { ...prev, [from]: fromList, [to]: toList };
      });
      await onStatusChange(active.id, to);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-nowrap gap-6">
        {STATUS.map(({ key, label, tone }) => (
          <SortableContext
            key={key}
            id={key}
            items={(columns[key] || []).map((l) => l.id)}
            strategy={rectSortingStrategy}
          >
            <div className="flex flex-col w-72 min-w-[18rem] max-h-[calc(100vh-18rem)] rounded-xl border border-border bg-panel-card/60 shadow-sm overflow-hidden">
              <div
                className={`sticky top-0 z-10 flex items-center justify-between px-3 py-2 bg-${tone}-500/10 border-b border-border/70`}
              >
                <Badge
                  className={`text-xs font-semibold px-2 py-1 border ${toneMap[tone]}`}
                >
                  {label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {columns[key]?.length || 0}
                </span>
              </div>
              <div className="flex-1 space-y-3 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-muted/40">
                <AnimatePresence>
                  {(columns[key] || []).length > 0 ? (
                    columns[key].map((lead) => (
                      <motion.div
                        key={lead.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                      >
                        <DraggableCard lead={lead} />
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      layout
                      className="flex items-center justify-center h-32 border border-dashed border-border rounded-lg text-xs text-muted-foreground"
                    >
                      Nenhum lead
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </SortableContext>
        ))}
      </div>
    </DndContext>
  );
}
