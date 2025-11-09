import { toast as globalToast } from "@/components/ui/use-toast";

/**
 * 🔹 Utilitário global imperativo de Toast
 * Pode ser usado fora do React: Toast.success(), Toast.error(), etc.
 */
const Toast = {
  success: (message, duration = 3000) =>
    globalToast({ message, type: "success", duration }),

  error: (message, duration = 4000) =>
    globalToast({ message, type: "error", duration }),

  info: (message, duration = 3000) =>
    globalToast({ message, type: "info", duration }),

  warning: (message, duration = 3500) =>
    globalToast({ message, type: "warning", duration }),
};

export default Toast;