"use client";

import { useState } from "react";

// UI
import { Card } from "@/components/admin/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/Tabs";

// Painéis
import PerfisEquipePanel from "@/components/perfis/PerfisEquipePanel";
import PerfisPersonasPanel from "@/components/perfis/PerfisPersonasPanel";
import PerfisClientesPanel from "@/components/perfis/PerfisClientesPanel";

export default function PerfisPage() {
  const [tab, setTab] = useState("equipe");

  return (
    <div className="space-y-6">

      {/* ⭐ HEADER NATIVO */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Perfis do Sistema
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie membros da equipe, proprietários, inquilinos e clientes.
          </p>
        </div>
      </div>

      {/* 🔹 Abas */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted p-1 flex gap-2">

          <TabsTrigger value="equipe">
            Equipe
          </TabsTrigger>

          <TabsTrigger value="personas">
            Proprietários & Inquilinos
          </TabsTrigger>

          <TabsTrigger value="clientes">
            Clientes
          </TabsTrigger>

        </TabsList>

        {/* 🔹 Conteúdo */}
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

          <TabsContent value="clientes">
            <Card className="p-6 space-y-4">
              <PerfisClientesPanel />
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
