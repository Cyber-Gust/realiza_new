"use client";

import { useState } from "react";

// Layout
import PageHeader from "@/components/admin/layout/PageHeader";

// UI (corrigidos)
import { Card } from "@/components/admin/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/Tabs";

// Ícones
import { UsersRound, ShieldCheck, Sparkles } from "lucide-react";

// Painéis
import PerfisEquipePanel from "@/components/perfis/PerfisEquipePanel";
import PerfisPersonasPanel from "@/components/perfis/PerfisPersonasPanel";
import PerfisLeadsPanel from "@/components/perfis/PerfisLeadsPanel";

export default function PerfisPage() {
  const [tab, setTab] = useState("equipe");

  return (
    <div className="space-y-6">
      {/* 🔹 Cabeçalho */}
      <PageHeader
        title="Perfis do Sistema"
        description="Gerencie usuários da equipe, proprietários, inquilinos e leads."
      />

      {/* 🔹 Abas */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted rounded-lg p-1 flex flex-wrap md:flex-nowrap gap-2">
          
          <TabsTrigger
            value="equipe"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            <ShieldCheck size={16} /> Equipe
          </TabsTrigger>

          <TabsTrigger
            value="personas"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            <UsersRound size={16} /> Proprietários & Inquilinos
          </TabsTrigger>

          <TabsTrigger
            value="leads"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            <Sparkles size={16} /> Leads & Clientes
          </TabsTrigger>

        </TabsList>

        {/* 🔹 Conteúdo em Cards */}
        <div className="mt-6 space-y-4">

          <TabsContent value="equipe">
            <Card className="p-6 space-y-4">
              <PerfisEquipePanel />
            </Card>
          </TabsContent>

          <TabsContent value="personas">
            <Card className="p-6 space-y-4">
              <PerfisPersonasPanel />
            </Card>
          </TabsContent>

          <TabsContent value="leads">
            <Card className="p-6 space-y-4">
              <PerfisLeadsPanel />
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
