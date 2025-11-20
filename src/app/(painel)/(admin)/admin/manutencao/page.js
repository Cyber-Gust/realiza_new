"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, ClipboardList } from "lucide-react";
import OrdensServicoPanel from "@/components/manutencao/OrdensServicoPanel";
import VistoriasPanel from "@/components/manutencao/VistoriasPanel";

/**
 * 🧱 Página principal do Módulo de Manutenção
 * Controla as abas de Ordens de Serviço e Vistorias
 * e integra com as rotas /api/manutencao/*
 */
export default function ManutencaoPage() {
  const [tab, setTab] = useState("ordens");

  return (
    <div className="space-y-6">
      {/* 🔹 Cabeçalho da página */}
      <PageHeader
        title="Módulo de Manutenção"
        description="Gerencie ordens de serviço, orçamentos, vistorias e histórico técnico dos imóveis."
      />

      {/* 🔹 Abas principais */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted rounded-lg p-1 flex flex-wrap md:flex-nowrap gap-2">
          <TabsTrigger
            value="ordens"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2 rounded-md text-sm font-medium transition-all"
          >
            <Wrench size={16} /> Ordens de Serviço
          </TabsTrigger>

          <TabsTrigger
            value="vistorias"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2 rounded-md text-sm font-medium transition-all"
          >
            <ClipboardList size={16} /> Vistorias
          </TabsTrigger>
        </TabsList>

        {/* 🔹 Conteúdo das abas */}
        <div className="mt-6 space-y-4">
          <TabsContent value="ordens">
            <Card className="p-6 space-y-4">
              <OrdensServicoPanel />
            </Card>
          </TabsContent>

          <TabsContent value="vistorias">
            <Card className="p-6 space-y-4">
              <VistoriasPanel />
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
