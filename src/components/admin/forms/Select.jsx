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
      mapLabel = "titulo",
      mapValue = "id",
      disabled,
      ..._props
    },
    ref
  ) => {
    const [remoteOptions, setRemoteOptions] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    // Fetch dinâmico
    React.useEffect(() => {
      if (!fetchOptions) return;
      let mounted = true;
      (async () => {
        try {
          setLoading(true);
          const res = await fetch(fetchOptions, { cache: "no-store" });
          const json = await res.json();
          if (!mounted) return;

          const raw = Array.isArray(json) ? json : json.data ?? [];
          const mapped = raw.map((item) => ({
            label:
              item[mapLabel] ||
              item.titulo ||
              item.nome ||
              item.titulo_curto ||
              item.endereco_cidade ||
              "Sem nome",
            value: String(item[mapValue] ?? item.id ?? item.value ?? ""),
          }));

          setRemoteOptions(mapped);
        } catch (err) {
          console.error("Erro ao buscar opções:", err);
        } finally {
          setLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [fetchOptions, mapLabel, mapValue]);

    const allOptions = React.useMemo(() => {
      const base = Array.isArray(options) ? options : [];
      return [...base, ...remoteOptions];
    }, [options, remoteOptions]);

    const rawValue = value ?? "";
    const safeValue = rawValue ? String(rawValue) : undefined;

    const handleChange = (val) => {
      onChange?.({ target: { name: _props.name, value: val } });
    };

    return (
      <div className="flex flex-col w-full gap-1.5">
        {label && (
          <label className="text-sm font-medium text-foreground">{label}</label>
        )}
        <SelectPrimitive.Root
          value={safeValue}
          onValueChange={handleChange}
          disabled={disabled || loading}
        >
          <SelectPrimitive.Trigger
            ref={ref}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            <SelectPrimitive.Value placeholder={loading ? "Carregando..." : placeholder} />
            <SelectPrimitive.Icon>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          {/* 🔹 Content com posicionamento fixo e confiável */}
          <SelectPrimitive.Content
            position="popper"
            side="bottom"
            align="start"
            sideOffset={4}
            avoidCollisions={true}
            className={cn(
              "z-[50] min-w-[var(--radix-select-trigger-width)] rounded-md border border-border bg-panel-card shadow-lg",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
              "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
            )}
          >
            <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1">
              <ChevronUp className="h-4 w-4" />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport className="p-1">
              {allOptions.length === 0 && !loading && (
                <div className="px-2 py-1 text-sm text-muted-foreground">
                  Nenhuma opção disponível
                </div>
              )}
              {allOptions.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-muted data-[disabled]:opacity-50"
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
        </SelectPrimitive.Root>
      </div>
    );
  }
);

Select.displayName = "Select";
