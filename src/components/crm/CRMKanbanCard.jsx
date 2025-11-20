"use client";
import { useState } from "react";
import {
  MoreVertical,
  Phone,
  Mail,
  MoveRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import Toast from "@/components/admin/ui/Toast";

export default function CRMKanbanCard({ lead, onClick, onMove }) {
  const [moving, setMoving] = useState(false);

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

      Toast.success("Lead movido com sucesso!");
      onMove?.();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setMoving(false);
    }
  };

  return (
    <Card
      className="
        p-4 border border-border bg-background/95 
        hover:bg-muted/40
        transition-all cursor-pointer rounded-lg shadow-sm
        flex flex-col gap-3
      "
      onClick={() => onClick?.(lead.id)}
    >
      {/* ========================= HEADER ========================= */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold text-foreground leading-tight">
            {lead.nome || "Sem nome"}
          </h4>

          <div className="mt-1 space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone size={12} /> {lead.telefone || "-"}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail size={12} /> {lead.email || "-"}
            </p>
          </div>
        </div>

        <MoreVertical
          size={16}
          className="text-muted-foreground opacity-60 hover:opacity-100"
        />
      </div>

      {/* ========================= ORIGEM ========================= */}
      <div className="text-[11px] text-muted-foreground italic border-l pl-2 border-border/60">
        Origem: {lead.origem || "Manual"}
      </div>

      {/* ========================= AÇÕES ========================= */}
      {onMove && (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={moving}
            onClick={(e) => {
              e.stopPropagation();
              handleMove("proposta_feita");
            }}
            className="
              text-xs flex items-center gap-1
              hover:bg-primary hover:text-primary-foreground
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
