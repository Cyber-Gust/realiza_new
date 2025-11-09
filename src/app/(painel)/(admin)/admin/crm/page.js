"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UsersRound,
  Workflow,
  CalendarDays,
  FileText,
  BarChart3,
} from "lucide-react";

// Painéis principais
import CRMLeadsPanel from "@/components/crm/CRMLeadsPanel";
import CRMPipeline from "@/components/crm/CRMPipeline";
import CRMAgendaPanel from "@/components/crm/CRMAgendaPanel";
import CRMPropostasPanel from "@/components/crm/CRMPropostasPanel";
import CRMRelatoriosPanel from "@/components/crm/CRMRelatoriosPanel";

export default function CRMPage() {
  const [tab, setTab] = useState("leads");

  return (
    <div className="space-y-6">
      {/* 🔹 Cabeçalho */}
      <PageHeader
        title="CRM Imobiliário"
        description="Gerencie leads, pipeline, agenda, propostas e relatórios de performance comercial."
      />

      {/* 🔹 Abas do módulo CRM */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted rounded-lg p-1 flex flex-wrap md:flex-nowrap gap-2">
          <TabsTrigger
            value="leads"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            <UsersRound size={16} /> Leads
          </TabsTrigger>

          <TabsTrigger
            value="pipeline"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            <Workflow size={16} /> Pipeline
          </TabsTrigger>

          <TabsTrigger
            value="agenda"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            <CalendarDays size={16} /> Agenda
          </TabsTrigger>

          <TabsTrigger
            value="propostas"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            <FileText size={16} /> Propostas
          </TabsTrigger>

          <TabsTrigger
            value="relatorios"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background rounded-md px-4 py-2 text-sm font-medium transition-all"
          >
            <BarChart3 size={16} /> Relatórios
          </TabsTrigger>
        </TabsList>

        {/* 🔹 Conteúdo de cada aba */}
        <div className="mt-6 space-y-4">
          <TabsContent value="leads">
            <Card className="p-6 space-y-4">
              <CRMLeadsPanel />
            </Card>
          </TabsContent>

          <TabsContent value="pipeline">
            <Card className="p-6 space-y-4">
              <CRMPipeline />
            </Card>
          </TabsContent>

          <TabsContent value="agenda">
            <Card className="p-6 space-y-4">
              <CRMAgendaPanel />
            </Card>
          </TabsContent>

          <TabsContent value="propostas">
            <Card className="p-6 space-y-4">
              <CRMPropostasPanel />
            </Card>
          </TabsContent>

          <TabsContent value="relatorios">
            <Card className="p-6 space-y-4">
              <CRMRelatoriosPanel />
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
