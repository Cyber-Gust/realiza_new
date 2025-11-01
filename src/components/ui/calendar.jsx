"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "p-3 text-sm rounded-xl border border-border bg-panel-card shadow-sm",
        className
      )}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-foreground",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "flex items-center justify-center h-8 w-8 rounded-md transition hover:bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.75rem]",
        row: "flex w-full mt-2",
        cell:
          "h-8 w-8 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
        day: cn(
          "h-8 w-8 rounded-md flex items-center justify-center transition hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_today:
          "text-primary font-semibold border border-primary/30",
        day_outside: "text-muted-foreground/50 opacity-50",
        day_disabled: "text-muted-foreground/50 opacity-40 cursor-not-allowed",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4 opacity-60" />,
        IconRight: () => <ChevronRight className="h-4 w-4 opacity-60" />,
      }}
      {...props}
    />
  );
}
