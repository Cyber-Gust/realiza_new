"use client";
import Toast from "@/components/admin/ui/Toast";

/**
 * Hook para upload seguro e gerenciamento de arquivos do Supabase Storage
 * Compatível com:
 *  - POST /api/imoveis/storage/sign   → gera Signed URL
 *  - GET  /api/imoveis/storage?prefix → lista arquivos
 *  - DELETE /api/imoveis/storage      → remove arquivo
 */
export default function useStorageUpload(bucket = "imoveis_media") {

  /**
   * Faz upload via Signed URL gerada pela rota /storage/sign
   */
  const uploadFile = async (file, path) => {
    try {
      // 1️⃣ Pede ao servidor a signed URL
      const res = await fetch("/api/imoveis/storage/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });

      const { data, error } = await res.json();
      if (error) throw new Error(error);
      if (!data?.signedUrl) throw new Error("URL de upload inválida");

      // 2️⃣ Faz o upload direto pro Supabase Storage
      const put = await fetch(data.signedUrl, { method: "PUT", body: file });
      if (!put.ok) throw new Error("Falha no upload do arquivo");

      // 3️⃣ Gera a URL pública
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;

      Toast.success("Arquivo enviado com sucesso!");
      return { name: file.name, url };
    } catch (err) {
      console.error("Erro no upload:", err.message);
      Toast.error(err.message || "Erro ao enviar arquivo.");
      throw err;
    }
  };

  /**
   * Lista os arquivos existentes no prefix (ex: imovel_123/)
   */
  const listFiles = async (prefix) => {
    try {
      const res = await fetch(`/api/imoveis/storage?prefix=${prefix}`);
      const { data, error } = await res.json();
      if (error) throw new Error(error);

      return data || [];
    } catch (err) {
      console.error("Erro ao listar arquivos:", err.message);
      Toast.error("Erro ao listar arquivos.");
      return [];
    }
  };

  /**
   * Remove um arquivo do bucket
   */
  const removeFile = async (fullPath) => {
    try {
      const name = fullPath.split("/").pop(); // extrai o nome do arquivo
      const prefix = fullPath.replace(name, "");

      const res = await fetch("/api/imoveis/storage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prefix }),
      });

      const { error } = await res.json();
      if (error) throw new Error(error);

      Toast.success("Arquivo removido com sucesso!");
    } catch (err) {
      console.error("Erro ao remover arquivo:", err.message);
      Toast.error(err.message || "Erro ao remover arquivo.");
      throw err;
    }
  };

  return { uploadFile, listFiles, removeFile };
}
