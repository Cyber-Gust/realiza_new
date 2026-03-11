"use client";

import { useState } from "react";

import { Card } from "@/components/admin/ui/Card";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/admin/ui/Tabs";

// Painéis
import CRMLeadsPanel from "@/components/corretor/crm/CRMLeadsPanel";
import CRMPipeline from "@/components/corretor/crm/CRMPipeline";
import CRMPropostasPanel from "@/components/corretor/crm/CRMPropostasPanel";
import CRMRelatoriosPanel from "@/components/corretor/crm/CRMRelatoriosPanel";

/* ============================================================
   🔥 Página principal do CRM — versão enterprise refinada
============================================================ */
export default function CRMPage() {
  const [tab, setTab] = useState("leads");

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* =======================================
            🔥 PAGE HEADER ENTERPRISE 
      ======================================= */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          CRM • Gestão Comercial
        </h1>

        <p className="text-muted-foreground max-w-1xl">
          Controle absoluto do funil de vendas: Leads, Pipeline, Agenda, Propostas e Relatórios.
          Tudo em um único cockpit estratégico.
        </p>
      </div>

      {/* TABS */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">

        {/* TAB NAVIGATION */}
        <TabsList className="bg-muted p-1 flex gap-2 rounded-xl border border-border">
          {[
            { id: "leads", label: "Leads" },
            { id: "pipeline", label: "Pipeline" },
            { id: "propostas", label: "Propostas" },
            { id: "relatorios", label: "Relatórios" },
          ].map(({ id, label }) => (
            <TabsTrigger key={id} value={id}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* PANELS */}
        <div className="mt-6">

          <TabsContent value="leads" className="animate-in fade-in duration-200">
            <Card className="p-6 shadow-sm border-border bg-panel-card rounded-xl">
              <CRMLeadsPanel />
            </Card>
          </TabsContent>

          <TabsContent value="pipeline" className="animate-in fade-in duration-200">
            <Card className="p-6 shadow-sm border-border bg-panel-card rounded-xl">
              <CRMPipeline />
            </Card>
          </TabsContent>

          <TabsContent value="propostas" className="animate-in fade-in duration-200">
            <Card className="p-6 shadow-sm border-border bg-panel-card rounded-xl">
              <CRMPropostasPanel />
            </Card>
          </TabsContent>

          <TabsContent value="relatorios" className="animate-in fade-in duration-200">
            <Card className="p-6 shadow-sm border-border bg-panel-card rounded-xl">
              <CRMRelatoriosPanel />
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
