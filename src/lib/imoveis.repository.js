import { createClient } from "@/lib/supabase/server";

/**
 * Repository de Imóveis
 */
export const ImoveisRepository = {
  async list(params = {}) {
    const supabase = createClient();
    let query = supabase.from("imoveis").select("*");

    if (params.tipo) query = query.eq("tipo", params.tipo);
    if (params.status) query = query.eq("status", params.status);
    if (params.cidade) query = query.ilike("cidade", `%${params.cidade}%`);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  async findById(id) {
    const supabase = createClient();
    const { data, error } = await supabase.from("imoveis").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const supabase = createClient();
    const { data, error } = await supabase.from("imoveis").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },

  async insert(payload) {
    const supabase = createClient();
    const { data, error } = await supabase.from("imoveis").insert([payload]).select().single();
    if (error) throw error;
    return data;
  },
};
