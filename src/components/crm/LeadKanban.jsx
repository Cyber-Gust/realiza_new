"use client";

import { useEffect, useState } from "react";
import { DndContext, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { useLeads } from "@/hooks/useLeads";
import Card from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Phone, Mail, User } from "lucide-react";

// 🎨 Paleta de cores por status
const STATUS = [
  { key: "novo", label: "Novo", color: "bg-sky-500/15 text-sky-600 border-sky-400/30" },
  { key: "qualificado", label: "Qualificado", color: "bg-indigo-500/15 text-indigo-600 border-indigo-400/30" },
  { key: "visita_agendada", label: "Visita", color: "bg-amber-500/15 text-amber-600 border-amber-400/30" },
  { key: "proposta_feita", label: "Proposta", color: "bg-emerald-500/15 text-emerald-600 border-emerald-400/30" },
  { key: "documentacao", label: "Docs", color: "bg-purple-500/15 text-purple-600 border-purple-400/30" },
  { key: "concluido", label: "Concluído", color: "bg-emerald-600/15 text-emerald-500 border-emerald-400/30" },
  { key: "perdido", label: "Perdido", color: "bg-red-500/15 text-red-600 border-red-400/30" },
];

// 🔹 Card do lead individual
function LeadCard({ lead }) {
  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
      className="
        bg-panel-card border border-border rounded-lg p-3 shadow-sm
        hover:shadow-md hover:border-accent/40
        cursor-grab active:cursor-grabbing transition-all
      "
    >
      <div className="flex items-center gap-2 mb-1">
        <User size={14} className="text-accent" />
        <p className="font-medium text-sm text-foreground truncate">{lead.nome}</p>
      </div>

      <div className="flex flex-col text-xs text-muted-foreground space-y-0.5 pl-5">
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

export default function LeadKanban() {
  const { leads, updateStatus } = useLeads();
  const [columns, setColumns] = useState({});

  // Agrupar leads por status
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

  // 🔹 Drag handlers
  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    const from = findColumn(active.id);
    const to = over.id;
    if (from !== to) {
      setColumns((prev) => {
        const activeLead = prev[from].find((l) => l.id === active.id);
        if (!activeLead) return prev;
        return {
          ...prev,
          [from]: prev[from].filter((l) => l.id !== active.id),
          [to]: [activeLead, ...prev[to]],
        };
      });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    const from = findColumn(active.id);
    const to = over.id;
    if (from !== to) await updateStatus(active.id, to);
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className="
          grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7
          gap-4 overflow-x-auto pb-4
        "
      >
        {STATUS.map(({ key, label, color }) => (
          <SortableContext
            key={key}
            id={key}
            items={columns[key] || []}
            strategy={rectSortingStrategy}
          >
            <Card
              className={`
                flex flex-col max-h-[85vh] p-3 rounded-xl shadow-sm border border-border
                bg-panel-card relative
              `}
            >
              {/* Cabeçalho da coluna */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs font-semibold px-2 py-1 border ${color}`}
                  >
                    {label}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {columns[key]?.length || 0}
                </span>
              </div>

              {/* Conteúdo */}
              <AnimatePresence>
                <motion.div
                  layout
                  className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-muted/50 scrollbar-thumb-rounded"
                >
                  {(columns[key] || []).map((lead) => (
                    <motion.div
                      key={lead.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15 }}
                      id={lead.id}
                      data-column={key}
                    >
                      <LeadCard lead={lead} />
                    </motion.div>
                  ))}

                  {(!columns[key] || columns[key].length === 0) && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.8 }}
                      className="
                        text-xs text-muted-foreground text-center py-6
                        border border-dashed border-border rounded-md
                        bg-muted/20
                      "
                    >
                      Nenhum lead
                    </motion.p>
                  )}
                </motion.div>
              </AnimatePresence>
            </Card>
          </SortableContext>
        ))}
      </div>
    </DndContext>
  );
}
