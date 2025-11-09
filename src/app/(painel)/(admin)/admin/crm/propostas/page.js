"use client";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import CRMPropostasPanel from "@/components/crm/CRMPropostasPanel";

export default function CRMPropostasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Propostas Comerciais"
        description="Gerencie propostas enviadas, contrapropostas e status de negociação."
      />
      <Card className="p-6 space-y-4">
        <CRMPropostasPanel />
      </Card>
    </div>
  );
}
