import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function Toast({ type = "success", title, message, onClose }) {
  const isSuccess = type === "success";

  return (
    <div className={cn(
      "pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-lg border border-border bg-panel-card shadow-lg ring-1 ring-black/5",
      "animate-in slide-in-from-right-full fade-in duration-300"
    )}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {isSuccess ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
          <div className="ml-4 flex flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex rounded-md bg-transparent text-muted-foreground hover:text-foreground focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Barra de progresso sutil (Opcional) */}
      <div className={cn("h-1 w-full", isSuccess ? "bg-emerald-500" : "bg-red-500")} />
    </div>
  );
}