"use client";
import PageHeader from "@/components/admin/layout/PageHeader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LeadStats from "@/components/crm/LeadStats";

export default function CRMPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Define aba ativa com base no pathname
  const [tab, setTab] = useState("leads");

  useEffect(() => {
    if (pathname.endsWith("/pipeline")) setTab("pipeline");
    else if (pathname.endsWith("/agenda")) setTab("agenda");
    else if (pathname.endsWith("/relatorios")) setTab("relatorios");
    else setTab("leads");
  }, [pathname]);

  const handleChange = (value) => {
    setTab(value);
    router.push(`/admin/crm/${value === "leads" ? "" : value}`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="CRM e Relacionamento"
        description="Gerencie leads, propostas, pipeline de vendas e agenda comercial."
      />

      {/* KPIs no topo */}
      <LeadStats />

      {/* Tabs de navegação internas */}
      <Tabs value={tab} onValueChange={handleChange} className="w-full">
        <TabsList className="mb-4 flex flex-wrap justify-start gap-2 bg-panel-card border border-border rounded-xl p-2">
          <TabsTrigger value="leads" className="px-4 py-2">Leads</TabsTrigger>
          <TabsTrigger value="pipeline" className="px-4 py-2">Pipeline</TabsTrigger>
          <TabsTrigger value="agenda" className="px-4 py-2">Agenda</TabsTrigger>
          <TabsTrigger value="relatorios" className="px-4 py-2">Relatórios</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Placeholder de conteúdo (as rotas filhas entram aqui via nested routes) */}
      <div className="border-t border-border pt-6 text-muted-foreground text-sm">
        <p>Selecione uma aba acima para gerenciar o módulo correspondente.</p>
      </div>
    </div>
  );
}
