"use client";

import { Banknote, Clock, ListChecks } from "lucide-react";
import KPIWidget from "@/components/admin/ui/KPIWidget";
import { formatCurrency } from "@/utils/formatters";

export default function FinanceiroResumo({ meta }) {
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
      <KPIWidget
        icon={Banknote}
        title="Total Pago"
        value={formatCurrency(meta?.total_pago || 0)}
      />

      <KPIWidget
        icon={Clock}
        title="Total Pendente"
        value={formatCurrency(meta?.total_pendente || 0)}
      />

      <KPIWidget
        icon={ListChecks}
        title="Lançamentos"
        value={meta?.total_registros || 0}
      />
    </div>
  );
}
