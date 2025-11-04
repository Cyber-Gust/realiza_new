// src/app/api/auth/recover/route.js
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req) {
  const supabase = createServiceClient();

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
    }

    // 🔹 Envia e-mail de redefinição
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/nova-senha`,
    });

    if (error) throw error;

    return NextResponse.json({
      message: "E-mail de recuperação enviado! Verifique sua caixa de entrada.",
    });
  } catch (err) {
    console.error("Erro recuperação de senha:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
