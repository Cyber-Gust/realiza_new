"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Workflow, CalendarDays, BarChart3 } from "lucide-react";

import LeadsPage from "@/components/crm/panel/LeadsPanel";
import PipelinePage from "@/components/crm/panel/PipelinePanel";
import AgendaPage from "@/components/crm/panel/AgendaPanel";
import RelatoriosPage from "@/components/crm/panel/RelatoriosPanel";

export default function CRMPage() {
  const [tab, setTab] = useState("leads");

  return (
    <section className="space-y-8 animate-fadeIn">
      {/* Cabeçalho */}
      <PageHeader
        title="CRM e Relacionamento"
        description="Acompanhe todo o ciclo de relacionamento: leads, pipeline, agenda e performance comercial."
      />

      {/* Abas principais */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList
          className="
            flex flex-wrap md:flex-nowrap justify-start gap-2 p-1
            bg-panel-card border border-border rounded-xl shadow-sm
            backdrop-blur-sm
          "
        >
          {[
            { value: "leads", icon: <Users size={16} />, label: "Leads" },
            { value: "pipeline", icon: <Workflow size={16} />, label: "Pipeline" },
            { value: "agenda", icon: <CalendarDays size={16} />, label: "Agenda" },
            { value: "relatorios", icon: <BarChart3 size={16} />, label: "Relatórios" },
          ].map(({ value, icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="
                flex items-center gap-2 px-4 py-2 text-sm font-medium
                rounded-md transition-all duration-300
                data-[state=active]:bg-accent data-[state=active]:text-accent-foreground
                data-[state=inactive]:text-muted-foreground
                hover:bg-muted hover:text-foreground
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30
              "
            >
              {icon}
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Conteúdo */}
        <div className="mt-6">
          <TabsContent value="leads" className="animate-fadeIn">
            <Card className="p-6 rounded-xl shadow-md border border-border bg-panel-card">
              <LeadsPage />
            </Card>
          </TabsContent>

          <TabsContent value="pipeline" className="animate-fadeIn">
            <Card className="p-6 rounded-xl shadow-md border border-border bg-panel-card">
              <PipelinePage />
            </Card>
          </TabsContent>

          <TabsContent value="agenda" className="animate-fadeIn">
            <Card className="p-6 rounded-xl shadow-md border border-border bg-panel-card">
              <AgendaPage />
            </Card>
          </TabsContent>

          <TabsContent value="relatorios" className="animate-fadeIn">
            <Card className="p-6 rounded-xl shadow-md border border-border bg-panel-card">
              <RelatoriosPage />
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
