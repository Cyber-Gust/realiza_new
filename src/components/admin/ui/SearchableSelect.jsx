"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "./Form";

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Selecione...",
  className,
  error,
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();

      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    const handleScroll = () => setOpen(false);

    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <>
      <div ref={triggerRef} className="relative">
        <div
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border bg-background/80 backdrop-blur-sm px-3 py-2 text-sm cursor-pointer",
            "transition-all duration-300 hover:border-primary/40 active:scale-[0.99]",
            error ? "border-red-500" : "border-input focus:border-primary",
            className
          )}
          onClick={() => setOpen(!open)}
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {options.find((o) => o.value === value)?.label || placeholder}
          </span>

          <ChevronDown
            className={cn(
              "h-4 w-4 opacity-60 transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </div>

      {open && coords &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 9999,
            }}
            className="rounded-xl border bg-background/95 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-top-2"
          >
            <div className="p-2 border-b">
              <div className="relative">
                <Input
                  placeholder="Buscar..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pr-9"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
              </div>
            </div>

            <div className="max-h-52 overflow-auto">
              {filtered.length === 0 && (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  Nenhum resultado encontrado
                </div>
              )}

              {filtered.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setFilter("");
                  }}
                  className="px-4 py-2 text-sm cursor-pointer hover:bg-primary/10 active:bg-primary/20"
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
