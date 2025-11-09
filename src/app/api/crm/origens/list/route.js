import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * 🔹 GET /api/crm/origens/list
 * Retorna todas as origens únicas cadastradas em "leads"
 */
export async function GET() {
  const supabase = createServiceClient();

  try {
    const { data, error } = await supabase
      .from("leads")
      .select("origem")
      .not("origem", "is", null);

    if (error) throw error;

    // 🔹 Filtra valores únicos e limpos
    const origensUnicas = [
      ...new Set(
        data
          .map((l) => l.origem?.trim())
          .filter(Boolean)
          .map((o) => o.charAt(0).toUpperCase() + o.slice(1).toLowerCase())
      ),
    ].map((nome) => ({ nome }));

    return NextResponse.json({ data: origensUnicas });
  } catch (err) {
    console.error("❌ GET /crm/origens/list:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
