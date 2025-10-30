"use client";
import { useToast } from "@/components/ui/use-toast";

export default function Toast({ message, type = "default" }) {
  const { toast } = useToast();
  return toast({
    title: type === "error" ? "Erro" : type === "success" ? "Sucesso" : "Info",
    description: message,
    variant: type
  });
}
