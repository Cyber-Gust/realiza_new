"use client";

import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import CRMContratosPanel from "@/components/contratos/ContratosPanel";

export default function ContratosPage() {
  return (
    <div className="space-y-6">
      {/* 🔹 Cabeçalho */}
      <PageHeader
        title="Gestão de Contratos"
        description="Gerencie contratos de locação, venda e administração — com status, assinaturas e prazos."
      />

      {/* 🔹 Painel principal */}
      <Card className="p-6 space-y-4">
        <CRMContratosPanel />
      </Card>
    </div>
  );
}
