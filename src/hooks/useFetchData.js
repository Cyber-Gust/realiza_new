"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function useFetchData(table, filter = {}) {
  const supabase = createClientComponentClient();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase.from(table).select("*");
      Object.entries(filter).forEach(([key, val]) => {
        query = query.eq(key, val);
      });
      const { data, error } = await query;
      if (!error) setData(data);
      setLoading(false);
    };
    load();
  }, [table, JSON.stringify(filter)]);

  return { data, loading };
}
