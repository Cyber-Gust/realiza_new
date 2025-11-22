"use client";

import React, { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

// ======================================================
// CONTEXT
// ======================================================
const TabsContext = createContext(null);

export function Tabs({ children, className, value, onValueChange }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used inside <Tabs>");
  return ctx;
}

// ======================================================
// LIST
// ======================================================
export function TabsList({ children, className }) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center",
        "rounded-xl bg-muted/60 p-1 border border-border shadow-sm backdrop-blur-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

// ======================================================
// TRIGGER — Agora com borda arredondada + borda verde no ativo 💚
// ======================================================
export function TabsTrigger({ value, children, className }) {
  const { value: active, onValueChange } = useTabs();
  const isActive = active === value;

  return (
    <button
      onClick={() => onValueChange(value)}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap",
        "px-4 py-1.5 text-sm font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "rounded-lg",

        // ⭐ Botão ATIVO — com borda verde + fundo verde + sombra + radius maior
        isActive
          ? "bg-accent text-accent-foreground shadow-md scale-[1.02] border border-accent rounded-xl"
          : "text-muted-foreground hover:bg-muted/50 border border-transparent",

        className
      )}
    >
      {children}
    </button>
  );
}

// ======================================================
// CONTENT
// ======================================================
export function TabsContent({ value, children, className }) {
  const { value: active } = useTabs();
  if (active !== value) return null;

  return (
    <div
      className={cn(
        "mt-4 animate-in fade-in zoom-in-95 duration-200",
        "rounded-xl p-1",
        className
      )}
    >
      {children}
    </div>
  );
}
