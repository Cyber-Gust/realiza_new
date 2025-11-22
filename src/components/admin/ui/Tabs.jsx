"use client";

import React, { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

// ------------------------------------------------------
// CONTEXTO
// ------------------------------------------------------
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
  if (!ctx) {
    throw new Error("Tabs components must be used inside <Tabs>");
  }
  return ctx;
}

// ------------------------------------------------------
// LISTA
// ------------------------------------------------------
export function TabsList({ children, className }) {
  return (
    <div
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

// ------------------------------------------------------
// TRIGGER
// ------------------------------------------------------
export function TabsTrigger({ value, children, className }) {
  const { value: active, onValueChange } = useTabs();

  const isActive = active === value;

  return (
    <button
      onClick={() => onValueChange(value)}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",

        isActive
          ? "bg-foreground text-background shadow-sm"
          : "text-muted-foreground",

        className
      )}
    >
      {children}
    </button>
  );
}

// ------------------------------------------------------
// CONTENT
// ------------------------------------------------------
export function TabsContent({ value, children, className }) {
  const { value: active } = useTabs();

  if (active !== value) return null;

  return (
    <div
      className={cn(
        "mt-4 animate-in fade-in duration-200",
        className
      )}
    >
      {children}
    </div>
  );
}
