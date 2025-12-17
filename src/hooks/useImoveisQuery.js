"use client";
import { useState, useEffect, useMemo } from "react";

export function useImoveisQuery(initialFilters = {}) {
  const [filters, setFilters] = useState({
    tipo: "all",
    status: "all",
    disponibilidade: "all",

    cidade: "",
    bairro: "",
    rua: "",
    cep: "",

    corretor_id: "",
    proprietario_id: "",

    preco_min: "",
    preco_max: "",

    ...initialFilters,
  });

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ============================================================
     🔍 QUERY STRING DINÂMICA
  ============================================================ */
  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.tipo && filters.tipo !== "all") {
      params.append("tipo", filters.tipo);
    }

    if (filters.status && filters.status !== "all") {
      params.append("status", filters.status);
    }

    if (filters.disponibilidade && filters.disponibilidade !== "all") {
      params.append("disponibilidade", filters.disponibilidade);
    }

    if (filters.cidade) params.append("cidade", filters.cidade.trim());
    if (filters.bairro) params.append("bairro", filters.bairro.trim());
    if (filters.rua) params.append("rua", filters.rua.trim());
    if (filters.cep) params.append("cep", filters.cep.trim());

    if (filters.corretor_id) {
      params.append("corretor_id", String(filters.corretor_id));
    }

    if (filters.proprietario_id) {
      params.append("proprietario_id", String(filters.proprietario_id));
    }

    if (filters.preco_min) {
      params.append("preco_min", String(filters.preco_min));
    }

    if (filters.preco_max) {
      params.append("preco_max", String(filters.preco_max));
    }

    return params.toString();
  }, [filters]);

  /* ============================================================
     📡 LOADING AUTOMÁTICO
  ============================================================ */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = queryString
          ? `/api/imoveis?${queryString}`
          : "/api/imoveis";

        const res = await fetch(url);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Erro ao carregar imóveis");
        }

        setData(Array.isArray(json.data) ? json.data : []);
      } catch (err) {
        console.error("❌ Erro ao carregar imóveis:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [queryString]);

  /* ============================================================
     🎚 MÉTODO PARA APLICAR FILTROS
  ============================================================ */
  const applyFilters = (newFilters = {}) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  return {
    imoveis: data,
    loading,
    error,
    applyFilters,
    filters,
    total: data.length,
  };
}
