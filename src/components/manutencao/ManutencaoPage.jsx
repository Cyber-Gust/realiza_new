"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted rounded-lg p-1 flex flex-wrap md:flex-nowrap gap-2">
          <TabsTrigger
            value="os"
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

        <div className="mt-6 space-y-4">
          <TabsContent value="os">
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
