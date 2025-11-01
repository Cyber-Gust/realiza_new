"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, ChevronUp, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef(
  (
    {
      label,
      value,
      onChange,
      options = [],
      fetchOptions,
      placeholder = "Selecione...",
      className,
      // 🚫 NÃO repassaremos props cegamente para o Trigger
      ..._props
    },
    ref
  ) => {
    const [remoteOptions, setRemoteOptions] = React.useState([]);

    // Carrega opções remotas (se houver)
    React.useEffect(() => {
      if (!fetchOptions) return;
      let isMounted = true;

      (async () => {
        try {
          const res = await fetch(fetchOptions);
          const data = await res.json();
          if (!isMounted) return;

          if (Array.isArray(data)) {
            const mapped = data.map((d) => ({
              label: d.nome || d.label || d.email || "Sem nome",
              value: d.id ?? d.value ?? "",
            }));
            // Evita setState desnecessário
            setRemoteOptions((prev) => {
              const sameLen = prev.length === mapped.length;
              const sameAll =
                sameLen &&
                prev.every((p, i) => p.label === mapped[i].label && String(p.value) === String(mapped[i].value));
              return sameAll ? prev : mapped;
            });
          }
        } catch (e) {
          if (isMounted) console.error("Erro ao carregar opções:", e);
        }
      })();

      return () => {
        isMounted = false;
      };
    }, [fetchOptions]);

    const allOptions = React.useMemo(
      () => [...options, ...remoteOptions],
      [options, remoteOptions]
    );

    // 🔒 Valor estabilizado e sem string vazia controlada
    const rawValue = value ?? null;
    const safeValue = React.useMemo(() => {
      if (rawValue === null || rawValue === undefined || rawValue === "") return undefined; // 🔑 aqui é o pulo do gato
      return String(rawValue);
    }, [rawValue]);

    // 🔒 onChange só dispara se houver mudança real
    const handleValueChange = React.useCallback(
      (val) => {
        const next = val == null ? "" : String(val);
        const curr = rawValue == null ? "" : String(rawValue);
        if (next === curr) return; // evita re-entrância
        onChange?.({ target: { value: next } });
      },
      [onChange, rawValue]
    );

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-sm font-medium text-muted-foreground">{label}</label>
        )}

        {/* Quando safeValue é undefined, o Radix mantém como "uncontrolled" e não puxa default sozinho */}
        <SelectPrimitive.Root value={safeValue} onValueChange={handleValueChange}>
          <SelectPrimitive.Trigger
            ref={ref}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-border bg-panel-card px-3 py-2 text-sm text-foreground shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className={cn(
                "relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-panel-card text-foreground shadow-md animate-in fade-in-80",
                className
              )}
            >
              <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1">
                <ChevronUp className="h-4 w-4" />
              </SelectPrimitive.ScrollUpButton>

              <SelectPrimitive.Viewport className="p-1">
                {allOptions.map((opt) => (
                  <SelectPrimitive.Item
                    key={String(opt.value)}
                    value={String(opt.value)}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm text-foreground outline-none focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>

              <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1">
                <ChevronDown className="h-4 w-4" />
              </SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
      </div>
    );
  }
);

Select.displayName = "Select";
