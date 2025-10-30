/**
 * @type {import('next').NextConfig}
 */

// Usamos a 'URL' para extrair o hostname do seu .env.local
import { URL } from 'url';

// 1. Tenta ler a URL do Supabase do seu arquivo .env
const supabaseURL = process.env.NEXT_PUBLIC_SUPABASE_URL;

let supabaseHostname = '';

// 2. Se a URL existir, extrai o hostname dela.
if (supabaseURL) {
  try {
    supabaseHostname = new URL(supabaseURL).hostname;
  } catch (e) {
    console.error(`URL do Supabase inválida no .env.local: ${supabaseURL}`);
  }
} else {
  console.warn(`AVISO: NEXT_PUBLIC_SUPABASE_URL não está definida.`);
  console.warn(`As imagens do Supabase Storage não funcionarão.`);
  // Você pode colocar um fallback aqui se quiser
  // supabaseHostname = 'id-do-seu-projeto.supabase.co';
}


// 3. Define a configuração do Next.js
const nextConfig = {
  reactStrictMode: true,
  
  // 4. Configuração de Imagens
  // Isso é ESSENCIAL para seu Módulo A1 (Vitrine)
  // Permite que o <Image> do Next.js acesse seu Supabase Storage.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        // Permite qualquer imagem de qualquer bucket público
        pathname: '/storage/v1/object/public/**', 
      },
    ],
  },
};

// 5. Exporta a configuração (sintaxe .mjs / ESM)
export default nextConfig;
