"use client";

import { useState } from "react";
import {
  MoreVertical,
  Phone,
  Mail,
  MoveRight,
  Loader2,
} from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/contexts/ToastContext";

/* ============================================================
   🔥 CRMKanbanCard – versão Enterprise
   • 100% aderente ao seu design system
   • Microinterações suaves
   • Layout premium estilo Linear
   ============================================================ */
export default function CRMKanbanCard({ lead, onClick, onMove }) {
  const [moving, setMoving] = useState(false);
  const toast = useToast();

  const handleMove = async (nextStage) => {
    try {
      setMoving(true);

      const res = await fetch("/api/crm/pipeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, new_status: nextStage }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Lead movido com sucesso!");
      onMove?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMoving(false);
    }
  };

  return (
    <Card
      className="
        p-4 bg-panel-card border border-border/70 rounded-lg
        hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)]
        hover:border-border transition-all cursor-pointer
        flex flex-col gap-4
      "
      onClick={() => onClick?.(lead.id)}
    >
      {/* ============================================================
         HEADER
      ============================================================ */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold text-foreground leading-tight tracking-tight">
            {lead.nome || "Sem nome"}
          </h4>

          <div className="mt-2 space-y-[2px]">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone size={12} /> {lead.telefone || "-"}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail size={12} /> {lead.email || "-"}
            </p>
          </div>
        </div>

        <MoreVertical
          size={18}
          className="text-muted-foreground/70 hover:text-foreground transition"
        />
      </div>

      {/* ============================================================
         ORIGEM
      ============================================================ */}
      <div className="text-[11px] text-muted-foreground border-l pl-2 border-border/70 italic">
        Origem: {lead.origem || "Manual"}
      </div>

      {/* ============================================================
         AÇÕES
      ============================================================ */}
      {onMove && (
        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            variant="secondary"
            disabled={moving}
            onClick={(e) => {
              e.stopPropagation(); // evita abrir modal ao mover
              handleMove("proposta_feita");
            }}
            className="
              text-xs h-7 flex items-center gap-1
              hover:bg-primary hover:text-primary-foreground
              border-border/70
              transition-colors
            "
          >
            {moving ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Movendo...
              </>
            ) : (
              <>
                Mover <MoveRight size={14} />
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
