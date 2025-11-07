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
    console.warn("⚠️ NEXT_PUBLIC_SUPABASE_URL não definida — imagens do Supabase não funcionarão.");
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
