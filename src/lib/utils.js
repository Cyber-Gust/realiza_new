import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 🔹 Combina classes de forma segura e limpa.
 * Exemplo:
 * cn("px-4", condition && "bg-green-500")
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
