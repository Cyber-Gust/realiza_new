"use client";

import { Button } from "@/components/admin/ui/Button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import ImoveisPanel from "@/components/corretor/imoveis/ImoveisPanel"; 

export default function ImoveisPage() {
  const router = useRouter();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Gestão de Imóveis
          </h1>

          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Gerencie seu portfólio de imóveis com eficiência operacional e visão estratégica.
          </p>
        </div>

        <Button
          onClick={() => router.push("/corretor/imoveis/new")}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Novo Imóvel
        </Button>
      </div>

      {/* PAINEL COMPLETO */}
      <ImoveisPanel />
    </div>
  );
}
