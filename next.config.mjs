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
      // Configuração existente do Supabase
      ...(supabaseHostname
        ? [
            {
              protocol: "https",
              hostname: supabaseHostname,
            },
          ]
        : []),
      
      // Configuração existente do LoremFlickr
      {
        protocol: "https",
        hostname: "loremflickr.com",
      },

      // 👇 NOVOS DOMÍNIOS DE AVATAR ADICIONADOS
      {
        protocol: "https",
        hostname: "avatar.iran.liara.run",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
    ],
  },
};

export default nextConfig;