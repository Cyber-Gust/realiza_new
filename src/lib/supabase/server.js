// src/lib/supabase/server.js
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * 🔹 Client padrão (SSR + cookies)
 * Compatível com Next.js 15 (cookies() é assíncrono)
 */
export async function createClient() {
  const cookieStore = await cookies(); // ✅ RESOLVE a Promise

  const cookieAdapter = {
    get: (name) => {
      try {
        const all = cookieStore.getAll?.() || [];
        return all.find((c) => c.name === name)?.value || undefined;
      } catch {
        return undefined;
      }
    },
    set: (name, value, options) => {
      try {
        if (typeof cookieStore.set === "function") {
          cookieStore.set({ name, value, ...options });
        }
      } catch (err) {
        console.warn("Falha ao definir cookie:", err);
      }
    },
    remove: (name, options) => {
      try {
        if (typeof cookieStore.delete === "function") {
          cookieStore.delete(name, options);
        }
      } catch (err) {
        console.warn("Falha ao remover cookie:", err);
      }
    },
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: cookieAdapter }
  );
}

/**
 * 🔹 Client administrativo (bypass RLS)
 * Para rotas de API internas (como /api/profiles, /api/imoveis)
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
    }
  );
}
