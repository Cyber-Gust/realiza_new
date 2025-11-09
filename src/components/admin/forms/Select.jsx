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
      ..._props
    },
    ref
  ) => {
    const [remoteOptions, setRemoteOptions] = React.useState([]);

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
            setRemoteOptions((prev) => {
              const sameLen = prev.length === mapped.length;
              const sameAll =
                sameLen &&
                prev.every(
                  (p, i) =>
                    p.label === mapped[i].label &&
                    String(p.value) === String(mapped[i].value)
                );
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

    const rawValue = value ?? null;
    const safeValue = React.useMemo(() => {
      if (rawValue === null || rawValue === undefined || rawValue === "")
        return undefined;
      return String(rawValue);
    }, [rawValue]);

    const handleValueChange = React.useCallback(
      (val) => {
        const next = val == null ? "" : String(val);
        const curr = rawValue == null ? "" : String(rawValue);
        if (next === curr) return;
        onChange?.({ target: { value: next } });
      },
      [onChange, rawValue]
    );

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-muted-foreground">
            {label}
          </label>
        )}

        <SelectPrimitive.Root value={safeValue} onValueChange={handleValueChange}>
          <SelectPrimitive.Trigger
            ref={ref}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
                "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                className
              )}
              position="popper"
              sideOffset={4}
            >
              <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1">
                <ChevronUp className="h-4 w-4" />
              </SelectPrimitive.ScrollUpButton>

              <SelectPrimitive.Viewport className="p-1">
                {allOptions.map((opt) => (
                  <SelectPrimitive.Item
                    key={String(opt.value)}
                    value={String(opt.value)}
                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>
                      {opt.label}
                    </SelectPrimitive.ItemText>
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