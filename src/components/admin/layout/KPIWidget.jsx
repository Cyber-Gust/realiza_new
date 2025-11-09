"use client";
import { cn } from "@/lib/utils";

export default function KPIWidget({ icon: Icon, label, value, className }) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-2 rounded-lg border bg-card p-5",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-2xl font-semibold text-card-foreground">
          {value}
        </h3>
      </div>
    </div>
  );
}