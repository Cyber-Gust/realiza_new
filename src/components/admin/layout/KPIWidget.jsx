"use client";
import { cn } from "@/lib/utils";

export default function KPIWidget({ icon: Icon, label, value, className }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between bg-panel-card rounded-2xl p-4 shadow-md border border-border",
        className
      )}
    >
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <h3 className="text-xl font-bold text-foreground mt-1">{value}</h3>
      </div>
      {Icon && <Icon className="h-6 w-6 text-accent" />}
    </div>
  );
}
