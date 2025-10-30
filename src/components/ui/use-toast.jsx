//src/components/ui/use-toast.jsx

"use client";

import * as React from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------
// 🔹 CONTEXTO
// ----------------------------------------------------------
const ToastContext = React.createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  // 🔸 Adiciona toast via hook
  const addToast = React.useCallback((toast) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, toast.duration || 3000);
  }, []);

  // 🔸 Remove toast manualmente
  const removeToast = React.useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // 🔸 Permite disparar toasts via eventos do navegador
  React.useEffect(() => {
    const handleEvent = (e) => addToast(e.detail);
    window.addEventListener("toast", handleEvent);
    return () => window.removeEventListener("toast", handleEvent);
  }, [addToast]);

  return (
    <ToastContext.Provider value={addToast}>
      {children}

      {/* 🔹 Container dos toasts */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center justify-between w-80 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2",
              t.type === "success" && "bg-green-50 border-green-400 text-green-800",
              t.type === "error" && "bg-red-50 border-red-400 text-red-800",
              t.type === "info" && "bg-blue-50 border-blue-400 text-blue-800",
              t.type === "warning" && "bg-yellow-50 border-yellow-400 text-yellow-800"
            )}
          >
            <div className="flex items-center gap-3">
              {t.type === "success" && <CheckCircle2 className="h-5 w-5" />}
              {t.type === "error" && <XCircle className="h-5 w-5" />}
              {t.type === "info" && <Info className="h-5 w-5" />}
              {t.type === "warning" && <AlertTriangle className="h-5 w-5" />}
              <span className="text-sm font-medium">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="ml-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ----------------------------------------------------------
// 🔹 HOOK DE USO LOCAL
// ----------------------------------------------------------
export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx)
    throw new Error(
      "❌ useToast() deve ser usado dentro de <ToastProvider>. Envolva seu app com ele."
    );
  return ctx;
}

// ----------------------------------------------------------
// 🔹 FUNÇÃO GLOBAL (para usar fora do React)
// ----------------------------------------------------------
export function toast({ message, type = "info", duration = 3000 }) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent("toast", { detail: { message, type, duration } });
  window.dispatchEvent(event);
}
