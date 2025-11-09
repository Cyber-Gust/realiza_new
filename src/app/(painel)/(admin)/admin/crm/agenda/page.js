"use client";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import CRMAgendaPanel from "@/components/crm/CRMAgendaPanel";

export default function CRMAgendaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda de Visitas"
        description="Visualize e gerencie os agendamentos de visitas e reuniões comerciais."
      />
      <Card className="p-6 space-y-4">
        <CRMAgendaPanel />
      </Card>
    </div>
  );
}
