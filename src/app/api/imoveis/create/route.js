import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const supabase = createServiceClient();
    const body = await req.json();

    const required = ["endereco_cidade", "endereco_estado", "tipo", "proprietario_id"];
    for (const f of required) {
      if (!body[f])
        return NextResponse.json({ error: `Campo obrigatório: ${f}` }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("imoveis")
      .insert([
        {
          titulo: body.titulo || null,
          codigo_ref: body.codigo_ref || null,
          descricao: body.descricao || null,
          tipo: body.tipo,
          status: body.status || "disponivel",
          proprietario_id: body.proprietario_id,
          endereco_cep: body.endereco_cep || null,
          endereco_logradouro: body.endereco_logradouro || null,
          endereco_numero: body.endereco_numero || null,
          endereco_bairro: body.endereco_bairro || null,
          endereco_cidade: body.endereco_cidade,
          endereco_estado: body.endereco_estado,
          preco_venda: body.preco_venda || null,
          preco_locacao: body.preco_locacao || null,
          area_total: body.area_total || null,
          quartos: body.quartos || null,
          banheiros: body.banheiros || null,
          vagas_garagem: body.vagas_garagem || null,
          mobiliado: !!body.mobiliado,
          pet_friendly: !!body.pet_friendly,
        },
      ])
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("Erro ao criar imóvel:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
