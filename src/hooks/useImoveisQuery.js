"use client";
import { useState, useEffect, useMemo } from "react";

export function useImoveisQuery(initialFilters = {}) {
  const [filters, setFilters] = useState({
    tipo: "all",
    status: "all",
    cidade: "",
    preco_min: "",
    preco_max: "",
    disponibilidade: "all",
    ...initialFilters,
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.tipo !== "all") params.append("tipo", filters.tipo);
    if (filters.status !== "all") params.append("status", filters.status);
    if (filters.disponibilidade !== "all")
      params.append("disponibilidade", filters.disponibilidade);
    if (filters.cidade) params.append("cidade", filters.cidade.trim());
    if (filters.preco_min) params.append("preco_min", filters.preco_min);
    if (filters.preco_max) params.append("preco_max", filters.preco_max);

    return params.toString();
  }, [filters]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // ROTA CORRETA DO BACKEND
        const res = await fetch(`/api/imoveis?${queryString}`);

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro ao carregar imóveis");

        setData(json.data || []);
        return json;
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
    loading,
    error,
    applyFilters,
    filters,
    // COUNT REAL DO BANCO:
    total: data.length,
  };
}
