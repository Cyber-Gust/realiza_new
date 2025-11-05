import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(req, { params }) {
  const supabase = createServiceClient();
  try {
    const { status } = await req.json();
    const { data, error } = await supabase
      .from("leads")
      .update({ status, updated_at: new Date() })
      .eq("id", params.id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
