"use client";
import { cn } from "@/lib/utils";

/**
 * 🔹 Componente de Input unificado
 * Suporte a input, textarea e mensagens de erro
 */
export default function Input({
  label,
  textarea = false,
  error,
  className,
  ...props
}) {
  const Component = textarea ? "textarea" : "input";

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}

      <Component
        {...props}
        className={cn(
          "w-full px-3 py-2 rounded-md border border-input bg-background text-foreground outline-none transition",
          "focus:ring-2 focus:ring-accent focus:border-accent placeholder:text-muted-foreground",
          textarea && "min-h-[100px] resize-y",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
      />

      {error && (
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      )}
    </div>
  );
}
