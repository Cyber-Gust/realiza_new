"use client";

import { Card } from "@/components/admin/ui/Card";
import CRMContratosPanel from "@/components/contratos/ContratosPanel";

export default function ContratosPage() {
  return (
    <div className="space-y-6">
      {/* Painel principal */}
      <Card className="p-6 space-y-4">
        <CRMContratosPanel />
      </Card>
    </div>
  );
}
