"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Toast from "@/components/admin/ui/Toast"; // Importe o componente visual que criamos antes!

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Função para remover toast pelo ID
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Função para adicionar toast
  const toast = useCallback(({ type = "success", title, message, duration = 5000 }) => {
    const id = Date.now().toString();
    
    const newToast = { id, type, title, message };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove após X segundos
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  // Helpers práticos (syntactic sugar)
  const helpers = {
    success: (title, message) => toast({ type: "success", title, message }),
    error: (title, message) => toast({ type: "error", title, message }),
    info: (title, message) => toast({ type: "info", title, message }), // Se tiver esse tipo no seu componente
    custom: toast,
  };

  return (
    <ToastContext.Provider value={helpers}>
      {children}

      {/* Container fixo para renderizar os Toasts na tela */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
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
      </div>
    </ToastContext.Provider>
  );
}

// Hook para usar em qualquer lugar
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider");
  }
  return context;
}