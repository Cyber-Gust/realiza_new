"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Workflow,
  CalendarDays,
  BarChart3,
} from "lucide-react";

import LeadsPanel from "@/components/crm/panel/LeadsPanel";
import PipelinePanel from "@/components/crm/panel/PipelinePanel";
import AgendaPanel from "@/components/crm/panel/AgendaPanel";
import RelatoriosPanel from "@/components/crm/panel/RelatoriosPanel";
import { motion, AnimatePresence } from "framer-motion";

export default function CRMPage() {
  const [tab, setTab] = useState("leads");

  const tabs = [
    { value: "leads", icon: <Users size={16} />, label: "Leads" },
    { value: "pipeline", icon: <Workflow size={16} />, label: "Pipeline" },
    { value: "agenda", icon: <CalendarDays size={16} />, label: "Agenda" },
    { value: "relatorios", icon: <BarChart3 size={16} />, label: "Relatórios" },
  ];

  return (
    <section className="h-full flex flex-col animate-fadeIn overflow-hidden">
      {/* Cabeçalho fixo */}
      <div className="sticky top-0 z-30 bg-background border-b border-border pb-4">
        <PageHeader
          title="CRM e Relacionamento"
          description="Gerencie leads, pipeline de vendas, agenda e indicadores de performance comercial."
        />

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="px-6">
            <TabsList
              className="
                flex flex-wrap md:flex-nowrap gap-2 p-1
                bg-panel-card border border-border/70
                rounded-xl shadow-sm backdrop-blur-sm
                w-full overflow-x-auto no-scrollbar
                sticky top-[70px] z-30
              "
            >
              {tabs.map(({ value, icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="
                    flex items-center justify-center md:justify-start gap-2 px-4 py-2
                    text-sm font-medium rounded-md transition-all duration-300
                    data-[state=active]:bg-accent data-[state=active]:text-accent-foreground
                    data-[state=inactive]:text-muted-foreground
                    hover:bg-muted hover:text-foreground
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30
                  "
                >
                  {icon}
                  <span>{label}</span>
                  {tab === value && (
                    <motion.span
                      layoutId="active-tab-indicator"
                      className="hidden md:inline-block w-1.5 h-1.5 bg-accent-foreground rounded-full ml-1"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto p-6 mt-4">
        <AnimatePresence mode="wait">
          {tab === "leads" && (
            <motion.div
              key="leads"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 rounded-xl border border-border shadow-md bg-panel-card">
                <LeadsPanel />
              </Card>
            </motion.div>
          )}

          {tab === "pipeline" && (
            <motion.div
              key="pipeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* 🔹 sem padding no card */}
              <Card
                noPadding
                className="relative rounded-xl border border-border shadow-md bg-panel-card overflow-hidden"
              >
                <PipelinePanel />
              </Card>
            </motion.div>
          )}

          {tab === "agenda" && (
            <motion.div
              key="agenda"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 rounded-xl border border-border shadow-md bg-panel-card">
                <AgendaPanel />
              </Card>
            </motion.div>
          )}

          {tab === "relatorios" && (
            <motion.div
              key="relatorios"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 rounded-xl border border-border shadow-md bg-panel-card">
                <RelatoriosPanel />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
