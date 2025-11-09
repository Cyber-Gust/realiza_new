"use client";

import { Banknote, Clock, ListChecks } from "lucide-react";
import KPIWidget from "@/components/admin/layout/KPIWidget";
import { formatCurrency } from "@/utils/formatters";

export default function FinanceiroResumo({ meta }) {
  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
      <KPIWidget
        icon={Banknote}
        label="Total Pago"
        value={formatCurrency(meta?.total_pago || 0)}
      />
      <KPIWidget
        icon={Clock}
        label="Total Pendente"
        value={formatCurrency(meta?.total_pendente || 0)}
      />
      <KPIWidget
        icon={ListChecks}
        label="Lançamentos"
        value={meta?.total_registros || 0}
      />
    </div>
  );
}
