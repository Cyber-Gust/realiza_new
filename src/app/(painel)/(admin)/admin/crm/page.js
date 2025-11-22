"use client";

import { useState } from "react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/admin/ui/Card";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/admin/ui/Tabs";

import {
  UsersRound,
  Workflow,
  CalendarDays,
  FileText,
  BarChart3,
} from "lucide-react";

// Painéis
import CRMLeadsPanel from "@/components/crm/CRMLeadsPanel";
import CRMPipeline from "@/components/crm/CRMPipeline";
import CRMAgendaPanel from "@/components/crm/CRMAgendaPanel";
import CRMPropostasPanel from "@/components/crm/CRMPropostasPanel";
import CRMRelatoriosPanel from "@/components/crm/CRMRelatoriosPanel";

/* ============================================================
   🔥 Página principal do CRM — versão enterprise refinada
============================================================ */
export default function CRMPage() {
  const [tab, setTab] = useState("leads");

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* HEADER */}
      <Card className="p-6">
        <CardHeader className="p-0 mb-2">
          <CardTitle className="text-2xl text-center font-bold tracking-tight">
            CRM
          </CardTitle>
        </CardHeader>
      </Card>

      {/* TABS */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">

        {/* TAB NAVIGATION */}
        <TabsList
          className="
            bg-muted/40 border border-border backdrop-blur-sm
            rounded-xl p-1 flex flex-wrap md:flex-nowrap gap-2
            shadow-sm
          "
        >
          {[
            { id: "leads", icon: UsersRound, label: "Leads" },
            { id: "pipeline", icon: Workflow, label: "Pipeline" },
            { id: "agenda", icon: CalendarDays, label: "Agenda" },
            { id: "propostas", icon: FileText, label: "Propostas" },
            { id: "relatorios", icon: BarChart3, label: "Relatórios" },
          ].map(({ id, icon: Icon, label }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="
                flex items-center gap-2 px-4 py-2 rounded-md
                text-sm font-medium transition-all
                data-[state=active]:bg-foreground 
                data-[state=active]:text-background
                hover:bg-foreground/10
              "
            >
              <Icon size={15} /> {label}
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

          <TabsContent value="agenda" className="animate-in fade-in duration-200">
            <Card className="p-6 shadow-sm border-border bg-panel-card rounded-xl">
              <CRMAgendaPanel />
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
