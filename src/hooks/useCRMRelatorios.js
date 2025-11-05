"use client";
import { useState, useEffect, useCallback } from "react";

/**
 * Hook para os KPIs do topo do CRM (header)
 * Consome /api/relatorios/crm
 */
export function useCRMRelatorios(periodo = {}) {
  const [data, setData] = useState({ leads_ativos: 0, taxa_conversao: 0, visitas_agendadas: 0, propostas_enviadas: 0 });
  const [loading, setLoading] = useState(true);

  const loadRelatorios = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(periodo);
      const res = await fetch(`/api/relatorios/crm?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setData(json.data);
    } catch (err) {
      console.error("Erro ao carregar relatórios CRM:", err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(periodo)]);

  useEffect(() => {
    loadRelatorios();
  }, [loadRelatorios]);

  return { data, loading, loadRelatorios };
}
