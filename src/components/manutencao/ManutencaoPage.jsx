"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";

// UI Imports Atualizados
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/admin/ui/Tabs";
import {
  Card,
} from "@/components/admin/ui/Card";

import { Wrench, ClipboardList } from "lucide-react";

import OrdensServicoPanel from "./OrdensServicoPanel";
import VistoriasPanel from "./VistoriasPanel";

export default function ManutencaoPage() {
  const [tab, setTab] = useState("os");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manutenção & Operações"
        description="Gerencie chamados técnicos, ordens de serviço e vistorias dos imóveis."
      />

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted rounded-lg p-1 flex flex-wrap md:flex-nowrap gap-2">
          <TabsTrigger
            value="os"
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

        {/* Conteúdos */}
        <div className="mt-6 space-y-4">
          {/* Ordens de Serviço */}
          <TabsContent value="os" currentValue={tab}>
            <Card className="p-6 space-y-4">
              <OrdensServicoPanel />
            </Card>
          </TabsContent>

          {/* Vistorias */}
          <TabsContent value="vistorias" currentValue={tab}>
            <Card className="p-6 space-y-4">
              <VistoriasPanel />
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
