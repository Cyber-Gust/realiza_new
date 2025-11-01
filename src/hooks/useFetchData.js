"use client";
import { useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Hook genérico para buscar dados de qualquer tabela do Supabase
 * ✅ Agora com suporte a Realtime (insert/update/delete)
 * @param {string} table - nome da tabela
 * @param {object} filter - filtros opcionais
 * @param {object} options - { orderBy, ascending }
 */
export function useFetchData(table, filter = {}, options = {}) {
  const supabase = createClientComponentClient();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔹 Função central de carregamento (usada também pelo realtime)
  const load = useCallback(async () => {
    if (!table) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(table).select("*", { count: "exact" });

      // 🔹 Aplica filtros dinâmicos
      Object.entries(filter).forEach(([key, val]) => {
        if (val === undefined || val === "" || val === "all" || val === null) return;
        if (typeof val === "object" && val.op && val.value) {
          query = query.filter(key, val.op, val.value);
        } else {
          query = query.eq(key, val);
        }
      });

      // 🔹 Ordenação
      if (options.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.ascending ?? false,
        });
      }

      const { data, error } = await query;
      if (error) throw error;

      setData(data || []);
    } catch (err) {
      console.error("Erro no useFetchData:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [table, JSON.stringify(filter), JSON.stringify(options)]);

  // 🔸 Carrega inicialmente
  useEffect(() => {
    load();
  }, [load]);

  // 🔸 Realtime: recarrega a cada mudança na tabela
  useEffect(() => {
    if (!table) return;

    const channel = supabase
      .channel(`${table}-realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          console.log(`[Realtime ${table}] ${payload.eventType}`, payload.new?.id || "");
          load(); // recarrega os dados
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, load]);

  return { data, loading, error };
}
