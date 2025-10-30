"use client";
import { cn } from "@/lib/utils";

export default function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-muted-foreground">{label}</label>}
      <input
        {...props}
        className={cn(
          "w-full px-3 py-2 rounded-md border border-input bg-background text-foreground outline-none focus:ring-2 focus:ring-accent transition"
        )}
      />
    </div>
  );
}
