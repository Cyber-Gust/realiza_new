"use client";

import { BarChart3 } from "lucide-react";
import KPI from "@/components/admin/ui/KPIWidget";

/**
 * CRMKPIWidget – Wrapper premium
 * Conversão simples para o KPI oficial do design system
 *
 * props:
 * - label  → title
 * - value  → value
 * - icon   → icon
 * - color  → ignorado (o KPI real não usa)
 *
 * Se precisar de cor customizada, posso criar uma extensão oficial no design system.
 */
export default function CRMKPIWidget({
  label,
  value,
  icon: Icon = BarChart3,
}) {
  return (
    <KPI
      title={label}
      value={value}
      icon={Icon}
      trend={null}        // você não passa trend aqui, então omitimos
      trendValue={null}   // idem
    />
  );
}
