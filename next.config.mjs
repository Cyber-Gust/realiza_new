/**
 * @type {import('next').NextConfig}
 */

import { URL } from "url";

const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseHostname = "";

if (supabaseURL) {
  try {
    supabaseHostname = new URL(supabaseURL).hostname;
  } catch {
    console.error(`URL do Supabase inválida: ${supabaseURL}`);
  }
} else {
  console.warn(
    "⚠️ NEXT_PUBLIC_SUPABASE_URL não definida — imagens do Supabase não funcionarão."
  );
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Seu padrão existente do Supabase
      {
        protocol: "https",
        hostname: supabaseHostname,
      },
      // 👇 Adicione este objeto para o loremflickr
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },
    ],
  },
};

export default nextConfig;