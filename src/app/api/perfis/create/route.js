import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const body = await req.json();
    const { type, ...rest } = body;
    let data, error;

    // ======================================================
    // 👥 EQUIPE (admins + corretores)
    // ======================================================
    if (type === "equipe") {
      const { nome_completo, email, cpf_cnpj, role, telefone, creci, dados_bancarios_json } = rest;
      const senhaInicial = (cpf_cnpj || "").replace(/\D/g, "") || "123456";

      // 🔍 Verifica se já existe usuário no Auth
      const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const existing = userList?.users?.find(
        (u) => u.email?.toLowerCase() === email?.toLowerCase()
      );
      let userId;

      if (existing) {
        userId = existing.id;
        console.log("⚠️ Usuário já existia, reaproveitando ID:", userId);
      } else {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: senhaInicial,
          email_confirm: true,
          user_metadata: { nome_completo, cpf_cnpj, role },
        });
        if (authError) throw new Error(authError.message);
        userId = authData?.user?.id;
      }

      // 🧱 Upsert no perfil (garante sincronização)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .upsert(
          [
            {
              id: userId,
              nome_completo,
              email,
              cpf_cnpj,
              telefone,
              creci,
              role: role || "corretor",
              dados_bancarios_json:
                typeof dados_bancarios_json === "string"
                  ? JSON.parse(dados_bancarios_json || "{}")
                  : dados_bancarios_json || {},
              avatar_url: "/placeholder-avatar.png",
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "id" }
        )
        .select()
        .single();

      if (profileError) throw profileError;
      data = profileData;
    }

    // ======================================================
    // 🏡 PERSONAS (proprietário, inquilino, cliente)
    // ======================================================
    else if (type === "personas") {
      const { nome, email, telefone, cpf_cnpj, tipo, endereco_json, observacoes } = rest;

      const { data: personaData, error: personaError } = await supabase
        .from("personas")
        .insert([
          {
            nome,
            email,
            telefone,
            cpf_cnpj,
            tipo: tipo || "proprietario",
            endereco_json:
              typeof endereco_json === "string"
                ? JSON.parse(endereco_json || "{}")
                : endereco_json || {},
            observacoes: observacoes || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (personaError) throw personaError;
      data = personaData;
    }

    // ======================================================
    // 💬 LEADS
    // ======================================================
    else if (type === "leads") {
      const { nome, email, telefone, status, origem, perfil_busca_json } = rest;

      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert([
          {
            nome,
            email,
            telefone,
            status: status || "novo",
            origem: origem || "não especificada",
            perfil_busca_json:
              typeof perfil_busca_json === "string"
                ? JSON.parse(perfil_busca_json || "{}")
                : perfil_busca_json || {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (leadError) throw leadError;
      data = leadData;
    }

    // ======================================================
    // ❌ Tipo inválido
    // ======================================================
    else {
      return NextResponse.json({ error: "Tipo de cadastro inválido" }, { status: 400 });
    }

    return NextResponse.json({
      message: "Cadastro criado com sucesso!",
      data,
    });
  } catch (err) {
    console.error("❌ Erro create:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
