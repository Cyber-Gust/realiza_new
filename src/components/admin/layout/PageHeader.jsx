"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PageHeader({ title, onAdd }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      {onAdd && (
        <Button onClick={onAdd} className="bg-accent text-accent-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-1" /> Novo
        </Button>
      )}
    </div>
  );
}
