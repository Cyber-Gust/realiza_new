import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* =====================================================
   HELPERS
===================================================== */
function calcularStatus(v) {
  if (v.status === "cancelada") return "cancelada";

  const temDescricao = !!v.laudo_descricao;
  const temDocumento = !!v.documento_laudo_url;
  const temFotos = Array.isArray(v.fotos_json) && v.fotos_json.length > 0;

  if (temDocumento && temDescricao) return "realizada";
  if (temFotos || temDescricao) return "incompleta";

  return "pendente";
}

/* =====================================================
   GET — LISTAGEM / DETALHE
===================================================== */
export async function GET(req) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);

  const id = searchParams.get("id");

  try {
    let query = supabase
      .from("vistorias")
      .select(
        `
        id,
        imovel_id,
        contrato_id,
        tipo,
        status,
        data_vistoria,
        laudo_descricao,
        documento_laudo_url,
        fotos_json,
        created_at,

        imovel:imoveis (
          id,
          titulo
        )
        `
      )
      .order("data_vistoria", { ascending: false });

    if (id) query = query.eq("id", id);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error("❌ GET vistorias:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =====================================================
   POST — CRIAÇÃO
===================================================== */
export async function POST(req) {
  const supabase = await createClient();

  try {
    const { imovel_id, contrato_id, tipo, data_vistoria } =
      await req.json();

    if (!imovel_id || !tipo || !data_vistoria) {
      return NextResponse.json(
        { error: "Imóvel, tipo e data são obrigatórios." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("vistorias")
      .insert([
        {
          imovel_id,
          contrato_id: contrato_id || null,
          tipo,
          data_vistoria,
          status: "pendente",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "Vistoria criada com sucesso.",
      data,
    });
  } catch (err) {
    console.error("❌ POST vistorias:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =====================================================
   PUT — UPDATE + UPLOAD (JSON ou FormData)
===================================================== */
export async function PUT(req) {
  const supabase = await createClient();

  try {
    const contentType = req.headers.get("content-type") || "";

    /* ===============================
       UPLOAD (FormData)
    =============================== */
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();

      const id = form.get("id");
      const tipo = form.get("tipo"); // "laudo" | "foto"
      const file = form.get("file");

      if (!id || !file || !tipo) {
        return NextResponse.json(
          { error: "Dados de upload incompletos." },
          { status: 400 }
        );
      }

      const { data: vistoria } = await supabase
        .from("vistorias")
        .select("*")
        .eq("id", id)
        .single();

      if (!vistoria) {
        return NextResponse.json(
          { error: "Vistoria não encontrada." },
          { status: 404 }
        );
      }

      if (vistoria.status === "cancelada") {
        return NextResponse.json(
          { error: "Vistoria cancelada não pode receber uploads." },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop();
      const filename = `${vistoria.imovel_id}/${tipo}_${Date.now()}.${ext}`;

      const bucket =
        tipo === "laudo" ? "documentos_vistorias" : "vistorias_fotos";

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename);

      let updates = {};

      if (tipo === "laudo") {
        updates.documento_laudo_url = urlData.publicUrl;
      }

      if (tipo === "foto") {
        const fotos = vistoria.fotos_json || [];
        fotos.push({
          id: crypto.randomUUID(),
          url: urlData.publicUrl,
          created_at: new Date().toISOString(),
        });
        updates.fotos_json = fotos;
      }

      const merged = { ...vistoria, ...updates };
      const novoStatus = calcularStatus(merged);

      await supabase
        .from("vistorias")
        .update({
          ...updates,
          status: novoStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json({
        message: "Upload realizado com sucesso.",
        url: urlData.publicUrl,
      });
    }

    /* ===============================
       UPDATE NORMAL (JSON)
    =============================== */
    const body = await req.json();
    const { id, status, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID obrigatório." },
        { status: 400 }
      );
    }

    const { data: current } = await supabase
      .from("vistorias")
      .select("*")
      .eq("id", id)
      .single();

    if (!current) {
      return NextResponse.json(
        { error: "Vistoria não encontrada." },
        { status: 404 }
      );
    }

    // cancelamento explícito
    if (status === "cancelada") {
      await supabase
        .from("vistorias")
        .update({
          status: "cancelada",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json({
        message: "Vistoria cancelada com sucesso.",
      });
    }

    const merged = { ...current, ...updates };
    const novoStatus = calcularStatus(merged);

    if (
      novoStatus === "realizada" &&
      (!merged.laudo_descricao || !merged.documento_laudo_url)
    ) {
      return NextResponse.json(
        {
          error:
            "Vistoria só pode ser realizada com laudo e descrição.",
        },
        { status: 400 }
      );
    }

    await supabase
      .from("vistorias")
      .update({
        ...updates,
        status: novoStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      message: "Vistoria atualizada com sucesso.",
    });
  } catch (err) {
    console.error("❌ PUT vistorias:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/* =====================================================
   DELETE — REMOÇÃO
===================================================== */
export async function DELETE(req) {
  const supabase = await createClient();

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID obrigatório." },
        { status: 400 }
      );
    }

    const { data: current } = await supabase
      .from("vistorias")
      .select("status")
      .eq("id", id)
      .single();

    if (current?.status === "realizada") {
      return NextResponse.json(
        {
          error:
            "Vistorias realizadas não podem ser excluídas. Use cancelamento.",
        },
        { status: 400 }
      );
    }

    await supabase.from("vistorias").delete().eq("id", id);

    return NextResponse.json({
      message: "Vistoria removida com sucesso.",
    });
  } catch (err) {
    console.error("❌ DELETE vistorias:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
