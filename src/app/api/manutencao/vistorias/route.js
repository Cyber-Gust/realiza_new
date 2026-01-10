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

      if (!id || !tipo) {
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

      /* ===============================
        LAUDO (1 arquivo)
      =============================== */
      if (tipo === "laudo") {
        const file = form.get("file");

        if (!file) {
          return NextResponse.json(
            { error: "Arquivo do laudo não enviado." },
            { status: 400 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split(".").pop();
        const filename = `${vistoria.imovel_id}/laudo_${Date.now()}.${ext}`;

        const { error } = await supabase.storage
          .from("documentos_vistorias")
          .upload(filename, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("documentos_vistorias")
          .getPublicUrl(filename);

        await supabase
          .from("vistorias")
          .update({
            documento_laudo_url: urlData.publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        return NextResponse.json({
          message: "Laudo enviado com sucesso.",
          url: urlData.publicUrl,
        });
      }

      /* ===============================
        FOTOS (MÚLTIPLAS)
      =============================== */
      if (tipo === "foto") {
        const files = form.getAll("files");

        if (!files.length) {
          return NextResponse.json(
            { error: "Nenhuma foto enviada." },
            { status: 400 }
          );
        }

        const novasFotos = [];

        for (const file of files) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const ext = file.name.split(".").pop();
          const filename = `${vistoria.imovel_id}/foto_${Date.now()}_${crypto.randomUUID()}.${ext}`;

          const { error } = await supabase.storage
            .from("vistorias_fotos")
            .upload(filename, buffer, {
              contentType: file.type,
              upsert: false,
            });

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from("vistorias_fotos")
            .getPublicUrl(filename);

          novasFotos.push({
            id: crypto.randomUUID(),
            url: urlData.publicUrl,
            created_at: new Date().toISOString(),
          });
        }

        const fotosAtualizadas = [
          ...(vistoria.fotos_json || []),
          ...novasFotos,
        ];

        const novoStatus = calcularStatus({
          ...vistoria,
          fotos_json: fotosAtualizadas,
        });

        await supabase
          .from("vistorias")
          .update({
            fotos_json: fotosAtualizadas,
            status: novoStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);

        return NextResponse.json({
          message: "Fotos adicionadas com sucesso.",
          total: novasFotos.length,
        });
      }

      return NextResponse.json(
        { error: "Tipo de upload inválido." },
        { status: 400 }
      );
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
