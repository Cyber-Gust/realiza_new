"use client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

/**
 * Hook para integração com /api/agenda
 * Ideal para telas de calendário e modais de visita
 */
export function useAgenda(filters = {}) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadEventos = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/agenda?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setEventos(json.data);
    } catch (err) {
      toast({ title: "Erro ao carregar agenda", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  const createEvento = async (evento) => {
    try {
      const res = await fetch("/api/agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evento),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast({ title: "Evento adicionado à agenda!" });
      await loadEventos();
      return json.data;
    } catch (err) {
      toast({ title: "Erro ao criar evento", description: err.message, variant: "destructive" });
    }
  };

  const deleteEvento = async (id) => {
    try {
      const res = await fetch(`/api/agenda?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast({ title: "Evento removido" });
      setEventos((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      toast({ title: "Erro ao excluir evento", description: err.message, variant: "destructive" });
    }
  };

  return { eventos, loading, loadEventos, createEvento, deleteEvento };
}
