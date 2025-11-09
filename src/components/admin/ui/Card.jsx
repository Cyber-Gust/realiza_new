"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Card = forwardRef(function Card(
  {
    title,
    icon: Icon,
    children,
    className,
    variant = "solid",
    noPadding = false,
    ...props
  },
  ref
) {
  const variants = {
    solid: "bg-card text-card-foreground border shadow-sm",
    muted: "bg-muted/40 border border-border/60 shadow-sm",
    glass: "bg-white/5 backdrop-blur-md border border-white/10 shadow-lg",
  };

  return (
    <div
      ref={ref}
      {...props}
      className={cn("rounded-lg", variants[variant], className)}
    >
      {title && (
        <div className="flex items-center gap-2 p-6 border-b">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <h3 className="text-lg font-semibold leading-none tracking-tight text-foreground">
            {title}
          </h3>
        </div>
      )}

      <div className={cn(noPadding ? "p-0" : "p-6")}>{children}</div>
    </div>
  );
});

export default Card;