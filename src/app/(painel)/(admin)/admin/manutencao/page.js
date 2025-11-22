"use client";

import { useState } from "react";

// UI Components corretos
import { Card } from "@/components/admin/ui/Card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/admin/ui/Tabs";

import { Wrench, ClipboardList } from "lucide-react";

// Painéis
import OrdensServicoPanel from "@/components/manutencao/OrdensServicoPanel";
import VistoriasPanel from "@/components/manutencao/VistoriasPanel";

export default function ManutencaoPage() {
  const [tab, setTab] = useState("ordens");

  return (
    <div className="space-y-6">

      {/* 🔹 Header substituindo o PageHeader inexistente */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Módulo de Manutenção</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie ordens de serviço, orçamentos, vistorias e histórico técnico dos imóveis.
        </p>
      </div>

      {/* 🔹 Abas principais */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted rounded-lg p-1 flex flex-wrap md:flex-nowrap gap-2">

          <TabsTrigger
            value="ordens"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground px-4 py-2 rounded-md text-sm font-medium transition-all"
          >
            <Wrench size={16} /> Ordens de Serviço
          </TabsTrigger>

          <TabsTrigger
            value="vistorias"
            className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground px-4 py-2 rounded-md text-sm font-medium transition-all"
          >
            <ClipboardList size={16} /> Vistorias
          </TabsTrigger>

        </TabsList>

        <div className="mt-6 space-y-4">
          <TabsContent value="ordens" currentValue={tab}>
            <Card className="p-6 space-y-4">
              <OrdensServicoPanel />
            </Card>
          </TabsContent>

          <TabsContent value="vistorias" currentValue={tab} >
            <Card className="p-6 space-y-4">
              <VistoriasPanel />
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
