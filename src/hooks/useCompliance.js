"use client";
import { useState } from "react";

/**
 * Helper para compliance (Laudos, ART, AVCB, Habite-se)
 */
export function useCompliance(imovel) {
  const [loading, setLoading] = useState(false);

  const getDocuments = () => imovel?.documentos_compliance_json || {};

  const getAlert = (validade) => {
    if (!validade) return { status: "sem_data", color: "gray" };
    const diffDays = Math.ceil(
      (new Date(validade) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < 0) return { status: "vencido", color: "red" };
    if (diffDays <= 15) return { status: "a_vencer", color: "yellow" };
    return { status: "válido", color: "green" };
  };

  const uploadDocument = async (imovelId, payload) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.error("Erro no upload de compliance:", e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { getDocuments, getAlert, uploadDocument, loading };
}
