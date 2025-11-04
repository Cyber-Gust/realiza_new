"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import "@/styles/daypicker.css";


/**
 * Calendar Realiza Imóveis
 * - Paleta suave (panel-card)
 * - Layout fixo, sem overflow
 * - Bordas arredondadas e sombras elegantes
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-3 text-sm rounded-xl border border-border bg-panel-card shadow-md",
        "w-[280px] sm:w-[320px]",
        className
      )}
      classNames={{
        months:
          "flex flex-col sm:flex-row gap-4 justify-center items-center text-foreground",
        month: "w-full space-y-3",
        caption:
          "flex justify-between items-center font-medium text-sm text-foreground mb-1",
        caption_label: "capitalize text-[0.9rem]",
        nav: "flex items-center gap-2",
        nav_button: cn(
          "flex items-center justify-center h-8 w-8 rounded-md border border-border text-muted-foreground transition-all",
          "hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2"
        ),
        nav_button_previous: "order-first",
        nav_button_next: "order-last",
        table: "w-full border-collapse",
        head_row: "flex justify-between text-xs text-muted-foreground",
        head_cell:
          "w-8 h-8 flex items-center justify-center font-normal text-[0.7rem]",
        row: "flex justify-between mt-1",
        cell: "h-8 w-8 text-center p-0 relative",
        day: cn(
          "h-8 w-8 flex items-center justify-center rounded-md cursor-pointer transition-all",
          "hover:bg-accent hover:text-accent-foreground"
        ),
        day_selected:
          "bg-panel-active text-panel-active-foreground hover:brightness-110 font-semibold",
        day_today: "border border-accent font-semibold text-accent",
        day_outside: "opacity-40 text-muted-foreground",
        day_disabled:
          "opacity-30 text-muted-foreground line-through cursor-not-allowed",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4 opacity-70" />,
        IconRight: () => <ChevronRight className="h-4 w-4 opacity-70" />,
      }}
      {...props}
    />
  );
}
