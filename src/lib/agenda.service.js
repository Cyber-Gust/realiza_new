import { createClient } from "@/lib/supabase/server";

export const AgendaService = {
  async registrarEvento({ tipo, descricao, imovel_id, usuario_id }) {
    const supabase = createClient();
    const { error } = await supabase.from("agenda_eventos").insert([
      {
        tipo,
        descricao,
        imovel_id,
        usuario_id,
      },
    ]);
    if (error) throw error;
  },

  async registrarAjustePreco({ imovel_id, campo, de, para, usuario_id }) {
    return this.registrarEvento({
      tipo: "ajuste_preco",
      descricao: `Alteração ${campo}: ${de} → ${para}`,
      imovel_id,
      usuario_id,
    });
  },

  async registrarChave({ imovel_id, acao, usuario_id }) {
    return this.registrarEvento({
      tipo: `chave_${acao}`,
      descricao: `Chave ${acao} por ${usuario_id}`,
      imovel_id,
      usuario_id,
    });
  },
};
