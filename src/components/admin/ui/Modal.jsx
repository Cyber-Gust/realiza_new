import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Modal({
  isOpen = false,
  onClose,
  onOpenChange,   // 🔥 agora existe oficialmente
  title,
  children,
  footer,
  className,
}) {
  const [visible, setVisible] = useState(false);

  // Proxy centralizado: quem chamar "fechar" cai aqui
  const close = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  useEffect(() => {
    let timer;

    if (isOpen) {
      document.body.style.overflow = "hidden";
      timer = setTimeout(() => setVisible(true), 10);
    } else {
      document.body.style.overflow = "unset";
      timer = setTimeout(() => setVisible(false), 200);
    }

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen && !visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div
        className={cn(
          "fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={close}
      />

      {/* CONTENT */}
      <div
        className={cn(
          "relative z-50 w-full max-w-lg rounded-2xl border border-border bg-panel-card shadow-2xl",
          "transform transition-all duration-200 sm:scale-95",
          visible ? "opacity-100 translate-y-0 sm:scale-100" : "opacity-0 translate-y-4 sm:scale-95",
          className
        )}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border/40">
          <h3 className="font-semibold text-lg text-foreground">{title}</h3>

          <button
            onClick={close}
            className="rounded-full p-1 opacity-70 hover:opacity-100 hover:bg-muted transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 text-sm text-muted-foreground">{children}</div>

        {/* FOOTER */}
        {footer && <div className="flex items-center justify-end p-6 pt-0 gap-2">{footer}</div>}
      </div>
    </div>
  );
}
