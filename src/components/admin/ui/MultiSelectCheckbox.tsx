"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import clsx from "clsx";
import { createPortal } from "react-dom";

type Option = {
  value: string;
  label: string;
};

type Props = {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
};

type Position = {
  top: number;
  left: number;
  width: number;
};

export function MultiSelectCheckbox({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
}: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // calcula posição somente quando abre
  useEffect(() => {
    if (!open || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();

    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, [open]);

  // fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle(v: string) {
    if (value.includes(v)) {
      onChange(value.filter((i) => i !== v));
    } else {
      onChange([...value, v]);
    }
  }

  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

  const canUsePortal =
    typeof window !== "undefined" && open && position;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={clsx(
          "w-full h-10 px-3 flex items-center justify-between",
          "rounded-md border bg-background text-sm",
          "hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        )}
      >
        <span className="truncate text-left">
          {selectedLabels.length
            ? selectedLabels.join(", ")
            : placeholder}
        </span>
        <ChevronDown size={16} className="opacity-60" />
      </button>

      {canUsePortal &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
            className="
              fixed z-[9999]
              rounded-md border bg-white shadow-xl
              max-h-60 overflow-auto
            "
          >
            {options.map((opt) => {
              const checked = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={clsx(
                    "w-full px-3 py-2 flex items-center gap-2 text-sm text-left",
                    "hover:bg-muted"
                  )}
                >
                  <span
                    className={clsx(
                      "w-4 h-4 rounded border flex items-center justify-center",
                      checked
                        ? "bg-primary border-primary text-white"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {checked && <Check size={12} />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
