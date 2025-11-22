"use client";

import { useEffect, useState } from "react";

// UI
import Modal from "@/components/admin/ui/Modal";
import { Button } from "@/components/admin/ui/Button";

// Toast
import { useToast } from "@/contexts/ToastContext";

import {
  Loader2,
  ClipboardList,
  FileText,
  X,
} from "lucide-react";

export default function VistoriaDetailDrawer({ vistoriaId, onClose, onUpdated }) {
  const [vistoria, setVistoria] = useState(null);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const loadVistoria = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/manutencao/vistorias?id=${vistoriaId}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      const match = json.data?.find((v) => v.id === vistoriaId);
      setVistoria(match || null);
    } catch (err) {
      toast.error("Erro ao carregar vistoria", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vistoriaId) loadVistoria();
  }, [vistoriaId]);

  // --------------------------
  // STATE: LOADING
  // --------------------------
  if (loading) {
    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title="Carregando..."
      >
        <div className="flex flex-col items-center text-muted-foreground py-6">
          <Loader2 className="animate-spin mb-3 h-6 w-6" />
          Carregando vistoria...
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </Modal>
    );
  }

  if (!vistoria) return null;

  // --------------------------
  // STATE: DETALHES
  // --------------------------
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <ClipboardList size={18} /> Vistoria
        </span>
      }
      footer={
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {/* INFO PRINCIPAL */}
      <div className="space-y-3 text-sm text-foreground">
        <p>
          <strong>Imóvel:</strong> {vistoria.imovel?.titulo || "Não informado"}
        </p>

        <p>
          <strong>Tipo:</strong> {vistoria.tipo}
        </p>

        <p>
          <strong>Data:</strong>{" "}
          {vistoria.data_vistoria
            ? new Date(vistoria.data_vistoria).toLocaleDateString("pt-BR")
            : "Não informada"}
        </p>

        <p>
          <strong>Descrição:</strong> {vistoria.laudo_descricao || "—"}
        </p>
      </div>

      {/* DOCUMENTO */}
      {vistoria.documento_laudo_url && (
        <div className="mt-4 space-y-1">
          <h4 className="text-sm font-semibold flex items-center gap-1">
            <FileText size={14} /> Documento de Laudo
          </h4>

          <a
            href={vistoria.documento_laudo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm hover:underline"
          >
            Abrir documento
          </a>
        </div>
      )}
    </Modal>
  );
}
