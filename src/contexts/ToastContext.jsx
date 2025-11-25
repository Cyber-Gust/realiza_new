"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom"; // <--- IMPORTANTE
import Toast from "@/components/admin/ui/Toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const mounted = typeof window !== "undefined"; // <--- Para evitar erro no Server Side

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(({ type = "success", title, message, duration = 5000 }) => {
    const id = Date.now().toString();
    const newToast = { id, type, title, message };
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const helpers = {
    success: (title, message) => toast({ type: "success", title, message }),
    error: (title, message) => toast({ type: "error", title, message }),
    info: (title, message) => toast({ type: "info", title, message }),
    custom: toast,
  };

  return (
    <ToastContext.Provider value={helpers}>
      {children}

      {/* O Portal joga esse código direto no <body> do HTML, 
         ignorando se ele está dentro de sidebars ou containers restritos.
      */}
      {mounted && createPortal(
        <div 
          className="fixed bottom-4 right-4 z-[99999] flex flex-col gap-3 w-full max-w-sm pointer-events-none"
          // Adicionei estilo inline para garantir prioridade máxima caso o Tailwind falhe
          style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 99999 }}
        >
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto transition-all duration-300 animate-in slide-in-from-right-full">
              <Toast
                type={t.type}
                title={t.title}
                message={t.message}
                onClose={() => removeToast(t.id)}
              />
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return context;
}