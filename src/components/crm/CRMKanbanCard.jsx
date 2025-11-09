"use client";
import { useState } from "react";
import { MoreVertical, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import Toast from "@/components/admin/ui/Toast";

export default function CRMKanbanCard({ lead, onClick, onMove }) {
  const [moving, setMoving] = useState(false);

  const handleMove = async (nextStage) => {
    try {
      setMoving(true);
      const res = await fetch("/api/crm/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: lead.id, next_stage: nextStage }),
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
      className="p-3 border-border bg-background hover:bg-muted/30 transition-all cursor-pointer"
      onClick={() => onClick?.(lead.id)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            {lead.nome || "Sem nome"}
          </h4>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone size={12} /> {lead.telefone || "-"}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Mail size={12} /> {lead.email || "-"}
          </p>
        </div>
        <MoreVertical size={14} className="text-muted-foreground" />
      </div>

      <div className="mt-2 text-xs text-muted-foreground italic">
        Origem: {lead.origem || "Manual"}
      </div>

      {onMove && (
        <div className="flex justify-end mt-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleMove("proposta_feita");
            }}
            disabled={moving}
            className="text-xs"
          >
            {moving ? "Movendo..." : "Mover"}
          </Button>
        </div>
      )}
    </Card>
  );
}
