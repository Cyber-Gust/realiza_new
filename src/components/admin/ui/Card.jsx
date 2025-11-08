"use client";
import { cn } from "@/lib/utils";

export default function Card({
  title,
  icon: Icon,
  children,
  className,
  variant = "solid",
  noPadding = false, // 👈 novo prop
}) {
  const variants = {
    solid: "bg-panel-card border border-border shadow-sm",
    muted: "bg-muted/40 border border-border/60 shadow-sm",
    glass: "bg-white/5 backdrop-blur-md border border-white/10 shadow-lg",
  };

  return (
    <div
      className={cn(
        "rounded-2xl text-panel-foreground transition-all duration-300 hover:shadow-lg hover:-translate-y-[1px]",
        variants[variant],
        className
      )}
    >
      {title && (
        <div className="flex items-center gap-2 px-5 pt-4 pb-2 border-b border-border/40">
          {Icon && <Icon size={18} className="text-accent" />}
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
      )}

      {/* 🔹 Padding controlado */}
      <div className={noPadding ? "p-0" : "p-5"}>{children}</div>
    </div>
  );
}
