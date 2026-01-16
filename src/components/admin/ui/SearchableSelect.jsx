"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "./Form";

export default function SearchableSelect({
  value,
  onChange,
  disabled = false,
  options = [],
  placeholder = "Selecione...",
  className,
  error,
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [coords, setCoords] = useState(null);

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // 🔥 Normalizar tudo para string
  const normalizedValue = value != null ? String(value) : "";

  const normalizedOptions = options.map((o) => ({
    ...o,
    value: String(o.value),
  }));

  const filtered = normalizedOptions.filter((o) =>
    o.label.toLowerCase().includes(filter.toLowerCase())
  );

  // Calcula posição do dropdown
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


  /* ============================================================
     🔒 HANDLERS COM PERMISSÃO
  ============================================================ */
  const toggleOpen = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const handleSelect = (val) => {
    if (disabled) return;
    onChange(String(val));
    setOpen(false);
    setFilter("");
  };

  return (
    <>
      <div ref={triggerRef} className="relative">
        <div
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border bg-background/80 backdrop-blur-sm px-3 py-2 text-sm",
            "transition-all duration-300 active:scale-[0.99]",
            error ? "border-red-500" : "border-input focus:border-primary",
            disabled
              ? "opacity-60 cursor-not-allowed"
              : "cursor-pointer hover:border-primary/40",
            className
          )}
          onClick={toggleOpen}
        >
          <span className={cn(!normalizedValue && "text-muted-foreground")}>
            {
              normalizedOptions.find((o) => o.value === normalizedValue)
                ?.label || placeholder
            }
          </span>

          <ChevronDown
            className={cn(
              "h-4 w-4 opacity-60 transition-transform",
              open && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* 🔒 Dropdown só abre se NÃO estiver disabled */}
      {open && !disabled && coords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 9999,
            }}
            className="rounded-xl border bg-background/95 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-top-2"
          >
            {/* Campo de busca */}
            <div className="p-2 border-b">
              <div className="relative">
                <Input
                  placeholder="Buscar..."
                  value={filter}
                  onChange={(e) => {
                    if (disabled) return;
                    setFilter(e.target.value);
                  }}
                  disabled={disabled}
                  readOnly={disabled}
                  className="pr-9"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
              </div>
            </div>

            {/* Lista de opções */}
            <div className="max-h-52 overflow-auto">
              {filtered.length === 0 && (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  Nenhum resultado encontrado
                </div>
              )}

              {filtered.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "px-4 py-2 text-sm",
                    disabled
                      ? "cursor-not-allowed"
                      : "cursor-pointer hover:bg-primary/10 active:bg-primary/20",
                    opt.value === normalizedValue && "bg-primary/20"
                  )}
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
