import { createClient } from "@/lib/supabase/server";

export const ComplianceService = {
  async salvarDocumento(imovel_id, tipo, payload) {
    const supabase = createClient();

    // Busca JSON atual
    const { data: imovel, error: fetchError } = await supabase
      .from("imoveis")
      .select("documentos_compliance_json")
      .eq("id", imovel_id)
      .single();

    if (fetchError) throw fetchError;

    const json = imovel?.documentos_compliance_json || {};
    json[tipo] = payload;

    const { error: updateError } = await supabase
      .from("imoveis")
      .update({ documentos_compliance_json: json })
      .eq("id", imovel_id);

    if (updateError) throw updateError;

    return json;
  },

  calcularStatus(validade) {
    if (!validade) return { label: "Sem validade", color: "gray" };
    const diff = Math.ceil((new Date(validade) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: "Vencido", color: "red" };
    if (diff <= 15) return { label: "A vencer", color: "yellow" };
    return { label: "Válido", color: "green" };
  },
};
