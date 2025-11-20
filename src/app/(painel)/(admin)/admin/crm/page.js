"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  UsersRound,
  Workflow,
  CalendarDays,
  FileText,
  BarChart3,
} from "lucide-react";

// Painéis principais (versões atualizadas que construímos)
import CRMLeadsPanel from "@/components/crm/CRMLeadsPanel";
import CRMPipeline from "@/components/crm/CRMPipeline";
import CRMAgendaPanel from "@/components/crm/CRMAgendaPanel";
import CRMPropostasPanel from "@/components/crm/CRMPropostasPanel";
import CRMRelatoriosPanel from "@/components/crm/CRMRelatoriosPanel";

export default function CRMPage() {
  const [tab, setTab] = useState("leads");

  return (
    <div className="space-y-8">
      {/* ============================================================
         🔹 Header Institucional
      ============================================================ */}
      <PageHeader
        title="CRM Imobiliário"
        description="Gestão completa de leads, pipeline, agenda, propostas e relatórios comerciais."
      />

      {/* ============================================================
         🔹 Navegação entre módulos (Tabs)
      ============================================================ */}
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="w-full"
      >
        <TabsList
          className="
            bg-muted/40 backdrop-blur-sm border border-border 
            rounded-xl p-1 flex flex-wrap md:flex-nowrap gap-2
          "
        >
          <TabsTrigger
            value="leads"
            className="
              flex items-center gap-2 
              px-4 py-2 rounded-md
              data-[state=active]:bg-foreground 
              data-[state=active]:text-background
              transition-all text-sm font-medium
            "
          >
            <UsersRound size={16} /> Leads
          </TabsTrigger>

          <TabsTrigger
            value="pipeline"
            className="
              flex items-center gap-2 
              px-4 py-2 rounded-md
              data-[state=active]:bg-foreground 
              data-[state=active]:text-background
              transition-all text-sm font-medium
            "
          >
            <Workflow size={16} /> Pipeline
          </TabsTrigger>

          <TabsTrigger
            value="agenda"
            className="
              flex items-center gap-2 
              px-4 py-2 rounded-md
              data-[state=active]:bg-foreground 
              data-[state=active]:text-background
              transition-all text-sm font-medium
            "
          >
            <CalendarDays size={16} /> Agenda
          </TabsTrigger>

          <TabsTrigger
            value="propostas"
            className="
              flex items-center gap-2 
              px-4 py-2 rounded-md
              data-[state=active]:bg-foreground 
              data-[state=active]:text-background
              transition-all text-sm font-medium
            "
          >
            <FileText size={16} /> Propostas
          </TabsTrigger>

          <TabsTrigger
            value="relatorios"
            className="
              flex items-center gap-2 
              px-4 py-2 rounded-md
              data-[state=active]:bg-foreground 
              data-[state=active]:text-background
              transition-all text-sm font-medium
            "
          >
            <BarChart3 size={16} /> Relatórios
          </TabsTrigger>
        </TabsList>

        {/* ============================================================
           🔹 Conteúdo das Abas
        ============================================================ */}
        <div className="mt-6">
          {/* Leads */}
          <TabsContent value="leads">
            <Card className="p-6">
              <CRMLeadsPanel />
            </Card>
          </TabsContent>

          {/* Pipeline */}
          <TabsContent value="pipeline">
            <Card className="p-6">
              <CRMPipeline />
            </Card>
          </TabsContent>

          {/* Agenda */}
          <TabsContent value="agenda">
            <Card className="p-6">
              <CRMAgendaPanel />
            </Card>
          </TabsContent>

          {/* Propostas */}
          <TabsContent value="propostas">
            <Card className="p-6">
              <CRMPropostasPanel />
            </Card>
          </TabsContent>

          {/* Relatórios */}
          <TabsContent value="relatorios">
            <Card className="p-6">
              <CRMRelatoriosPanel />
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
