// src/app/api/perfis/list/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 🔹 Lista perfis, personas e leads
 * Suporta query params: ?type=equipe|personas|leads&id=<uuid>
 */
export async function GET(req) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  try {
    let data = [];

    switch (type) {
      // ==================================================
      // 👥 EQUIPE (admins + corretores)
      // ==================================================
      case "equipe": {
        let query = supabase
          .from("profiles")
          .select(
            `
            id,
            nome_completo,
            email,
            telefone,
            cpf_cnpj,
            role,
            creci,
            dados_bancarios_json,
            avatar_url,
            updated_at
          `
          )
          .order("updated_at", { ascending: false });

        if (id) query = query.eq("id", id);

        const { data: profiles, error: profilesError } = await query;
        if (profilesError) throw profilesError;

        // 🔹 Carrega metadados do Auth (para sincronizar nomes/telefones)
        let authUserMap = {};
        if (id) {
          const { data: singleAuth } = await supabase.auth.admin.getUserById(id);
          if (singleAuth?.user) authUserMap[id] = singleAuth.user;
        } else {
          const { data: authData } = await supabase.auth.admin.listUsers();
          authUserMap = Object.fromEntries(
            authData?.users?.map((u) => [u.id, u]) || []
          );
        }

        data = profiles.map((p) => {
          const authUser = authUserMap[p.id];
          return {
            id: p.id,
            type: "equipe",
            nome_completo:
              p.nome_completo || authUser?.user_metadata?.nome_completo || "-",
            email: p.email || authUser?.email || "-",
            telefone: p.telefone || authUser?.user_metadata?.telefone || "-",
            cpf_cnpj: p.cpf_cnpj || authUser?.user_metadata?.cpf_cnpj || "-",
            creci: p.creci || authUser?.user_metadata?.creci || "-",
            role: p.role || authUser?.user_metadata?.role || "corretor",
            dados_bancarios_json: p.dados_bancarios_json || {},
            avatar_url: p.avatar_url || "/placeholder-avatar.png",
            updated_at: p.updated_at,
          };
        });
        break;
      }

      // ==================================================
      // 🏡 PERSONAS (proprietário, inquilino, cliente)
      // ==================================================
      case "personas": {
        let query = supabase
          .from("personas")
          .select(
            `
            id,
            nome,
            email,
            telefone,
            cpf_cnpj,
            tipo,
            endereco_json,
            observacoes,
            updated_at
          `
          )
          .order("updated_at", { ascending: false });

        if (id) query = query.eq("id", id);

        const { data: personas, error: personasError } = await query;
        if (personasError) throw personasError;

        data = personas.map((p) => ({
          id: p.id,
          type: "personas",
          nome: p.nome,
          email: p.email,
          telefone: p.telefone,
          cpf_cnpj: p.cpf_cnpj,
          tipo: p.tipo,
          endereco_json: p.endereco_json || {},
          observacoes: p.observacoes || "",
          updated_at: p.updated_at,
        }));
        break;
      }

      // ==================================================
      // 💬 LEADS
      // ==================================================
      case "leads": {
        let query = supabase
          .from("leads")
          .select(
            `
            id,
            nome,
            email,
            telefone,
            status,
            origem,
            corretor_id,
            perfil_busca_json,
            updated_at
          `
          )
          .order("updated_at", { ascending: false });

        if (id) query = query.eq("id", id);

        const { data: leads, error: leadsError } = await query;
        if (leadsError) throw leadsError;

        data = leads.map((l) => ({
          id: l.id,
          type: "leads",
          nome: l.nome,
          email: l.email,
          telefone: l.telefone,
          status: l.status,
          origem: l.origem,
          corretor_id: l.corretor_id,
          perfil_busca_json: l.perfil_busca_json || {},
          updated_at: l.updated_at,
        }));
        break;
      }

      default:
        return NextResponse.json(
          { error: "Tipo inválido de listagem. Use equipe, personas ou leads." },
          { status: 400 }
        );
    }

    // ✅ Se veio `id`, retorna objeto único
    if (id) {
      const single = Array.isArray(data) ? data[0] : data;
      return NextResponse.json({ data: single || null });
    }

    // ✅ Se não veio `id`, retorna lista
    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Erro list:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
