"use client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

/**
 * Hook para gerenciamento de propostas de leads
 * Conecta com /api/propostas
 */
export function usePropostas(filters = {}) {
  const [propostas, setPropostas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadPropostas = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/propostas?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setPropostas(json.data);
    } catch (err) {
      toast({ title: "Erro ao carregar propostas", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    loadPropostas();
  }, [loadPropostas]);

  const createProposta = async (proposta) => {
    try {
      const res = await fetch("/api/propostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposta),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast({ title: "Proposta enviada com sucesso!" });
      await loadPropostas();
      return json.data;
    } catch (err) {
      toast({ title: "Erro ao enviar proposta", description: err.message, variant: "destructive" });
    }
  };

  const updateProposta = async (id, data) => {
    try {
      const res = await fetch(`/api/propostas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast({ title: "Proposta atualizada" });
      await loadPropostas();
    } catch (err) {
      toast({ title: "Erro ao atualizar proposta", description: err.message, variant: "destructive" });
    }
  };

  const deleteProposta = async (id) => {
    try {
      const res = await fetch(`/api/propostas/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast({ title: "Proposta removida" });
      setPropostas((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      toast({ title: "Erro ao excluir proposta", description: err.message, variant: "destructive" });
    }
  };

  return { propostas, loading, loadPropostas, createProposta, updateProposta, deleteProposta };
}
