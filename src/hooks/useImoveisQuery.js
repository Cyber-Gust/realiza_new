"use client";
import { useState, useEffect, useMemo } from "react";

/**
 * Hook especializado para carregar imóveis via API (Service Role)
 * - Usa /api/imoveis/list para bypassar RLS
 * - Suporta filtros dinâmicos (tipo, status, cidade, preço)
 */
export function useImoveisQuery(initialFilters = {}) {
  const [filters, setFilters] = useState({
    tipo: "all",
    status: "all",
    cidade: "",
    preco_min: "",
    preco_max: "",
    ...initialFilters,
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔹 Monta query string dos filtros
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.tipo && filters.tipo !== "all") params.append("tipo", filters.tipo);
    if (filters.status && filters.status !== "all") params.append("status", filters.status);
    if (filters.cidade) params.append("cidade", filters.cidade.trim());
    if (filters.preco_min) params.append("preco_min", filters.preco_min);
    if (filters.preco_max) params.append("preco_max", filters.preco_max);
    return params.toString();
  }, [filters]);

  // 🔸 Faz fetch via API (usa ServiceRole no servidor)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/imoveis/list?${queryString}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro ao carregar imóveis");

        setData(json.data || []);
      } catch (err) {
        console.error("❌ Erro ao carregar imóveis:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [queryString]);

  const applyFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return {
    imoveis: data,
    total: data.length,
    loading,
    error,
    applyFilters,
    filters,
  };
}
