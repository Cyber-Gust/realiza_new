"use client";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import CRMRelatoriosPanel from "@/components/crm/CRMRelatoriosPanel";

export default function CRMRelatoriosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios de Desempenho"
        description="Acompanhe KPIs de conversão, leads, propostas e performance da equipe."
      />
      <Card className="p-6 space-y-4">
        <CRMRelatoriosPanel />
      </Card>
    </div>
  );
}
