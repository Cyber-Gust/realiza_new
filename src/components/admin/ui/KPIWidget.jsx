import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function KPI({ title, value, trend, trendValue, icon: Icon }) {
  const isPositive = trend === "up";
  
  return (
    <div className="rounded-xl border border-border bg-panel-card p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase text-[11px]">
          {title}
        </p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground opacity-70" />}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        
        {trendValue && (
          <div
            className={cn(
              "flex items-center text-xs font-medium px-1.5 py-0.5 rounded-md",
              isPositive 
                ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400" 
                : "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400"
            )}
          >
            {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}