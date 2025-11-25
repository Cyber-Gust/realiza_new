"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Modal({
  isOpen = false,
  onClose,
  onOpenChange,
  title,
  children,
  footer,
  className,
  closeOnOverlay = true,
}) {
  const [visible, setVisible] = useState(false);
  const modalRef = useRef(null);

  const close = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  /* ===================== ANIMAÇÃO ===================== */
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => setVisible(true));
    } else {
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /* ===================== ESC ===================== */
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  /* ===================== FOCUS TRAP ===================== */
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const node = modalRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    node?.focus();
  }, [isOpen]);

  /* ===================== SCROLL LOCK ===================== */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isOpen]);

  /* ===================== ROOT ===================== */
  const root = typeof window !== "undefined" ? document.getElementById("modal-root") : null;
  if (!root) return null;

  if (!isOpen && !visible) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={closeOnOverlay ? close : undefined}
      />

      <div
        ref={modalRef}
        className={cn(
          "relative z-[1000] w-full max-w-3xl rounded-2xl border border-border bg-panel-card shadow-2xl",
          "max-h-[85vh] flex flex-col",
          "transition-all duration-200",
          visible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-6 scale-95",
          className
        )}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/40">
          <h3 className="font-semibold text-xl text-foreground">{title}</h3>
          <button
            onClick={close}
            className="rounded-full p-2 opacity-70 hover:opacity-100 hover:bg-muted transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto text-sm text-foreground flex-1">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end p-6 pt-3 border-t border-border/40 gap-2 bg-panel-card/60">
            {footer}
          </div>
        )}
      </div>
    </div>,
    root
  );
}
