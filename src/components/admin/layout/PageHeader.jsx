"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PageHeader({ title, description, rightSection, onAdd }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Mostra o que vier no rightSection (botão personalizado, filtros, etc.) */}
      {rightSection ? (
        <div className="flex-shrink-0">{rightSection}</div>
      ) : (
        // fallback pro onAdd, se existir
        onAdd && (
          <Button
            onClick={onAdd}
            className="bg-accent text-accent-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        )
      )}
    </div>
  );
}
