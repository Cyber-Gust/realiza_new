"use client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";


/**
 * Hook especializado para gestão de leads
 * Integra rotas /api/leads e /api/leads/[id]/status
 */
export function useLeads(filters = {}) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // 🔹 Função principal de carregamento
  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/leads?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      
      // ✅ evita duplicações e garante unicidade por id
      setLeads(() => {
        const unique = new Map();
        for (const lead of json.data) unique.set(lead.id, lead);
        return Array.from(unique.values());
      });
    } catch (err) {
      console.error("Erro ao carregar leads:", err);
      toast({
        title: "Erro ao carregar leads",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  // ✅ Corrigido: encapsula o async dentro de função síncrona
  useEffect(() => {
    loadLeads(); // ✅ executa uma vez na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ⚠️ sem dependências

  // 🔹 CRUD operations
  const createLead = async (lead) => {
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast({ title: "Lead criado com sucesso!" });
      await loadLeads();
      return json.data;
    } catch (err) {
      toast({
        title: "Erro ao criar lead",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const updateLead = async (id, data) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast({ title: "Lead atualizado" });
      await loadLeads();
    } catch (err) {
      toast({
        title: "Erro ao atualizar lead",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/leads/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast({ title: `Status atualizado para ${status}` });
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      );
    } catch (err) {
      toast({
        title: "Erro ao atualizar status",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const deleteLead = async (id) => {
    if (!id) {
      console.error("❌ Nenhum ID recebido para exclusão");
      toast({
        title: "Erro ao excluir lead",
        description: "ID do lead não foi informado.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("🧾 Excluindo lead ID:", id);
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro HTTP ${res.status}: ${text}`);
      }

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erro desconhecido ao excluir lead.");

      // ✅ Atualiza estado local
      setLeads((prev) => prev.filter((l) => l.id !== id));

      toast({
        title: "Lead removido",
        description: "O lead foi excluído com sucesso.",
      });
    } catch (err) {
      console.error("Erro ao excluir lead:", err);
      toast({
        title: "Erro ao excluir lead",
        description: err.message || "Não foi possível excluir o lead.",
        variant: "destructive",
      });
    }
  };

  return {
    leads,
    loading,
    loadLeads,
    createLead,
    updateLead,
    updateStatus,
    deleteLead,
  };
}
