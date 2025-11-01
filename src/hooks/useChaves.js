"use client";
import { useState } from "react";
import QRCode from "qrcode";

export function useChaves(imovelId) {
  const [qr, setQr] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateQr = async () => {
    const value = `imovel:${imovelId}:chaves`;
    const qrData = await QRCode.toDataURL(value);
    setQr(qrData);
    return qrData;
  };

  const registrarAcao = async (acao, usuario_id, observacao = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/chaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao, usuario_id, observacao }),
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.error("Erro ao registrar ação de chave:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { qr, generateQr, registrarAcao, loading };
}
