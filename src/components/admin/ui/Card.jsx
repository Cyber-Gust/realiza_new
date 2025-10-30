"use client";
import { cn } from "@/lib/utils";

export default function Card({ title, children, className }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-panel-card text-panel-foreground shadow-xl border border-border p-5 transition hover:shadow-2xl",
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-3 text-foreground">{title}</h3>
      )}
      {children}
    </div>
  );
}
