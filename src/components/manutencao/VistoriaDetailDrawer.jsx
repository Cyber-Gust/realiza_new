"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";
import { Loader2, ClipboardList, FileText, X } from "lucide-react";

export default function VistoriaDetailDrawer({ vistoriaId, onClose, onUpdated }) {
  const [vistoria, setVistoria] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadVistoria = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/manutencao/vistorias?id=${vistoriaId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const match = json.data?.find((v) => v.id === vistoriaId);
      setVistoria(match || null);
    } catch (err) {
      Toast.error("Erro ao carregar vistoria: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vistoriaId) loadVistoria();
  }, [vistoriaId]);

  if (loading)
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="p-6 text-center text-muted-foreground">
          <Loader2 className="animate-spin mx-auto mb-3" /> Carregando vistoria...
        </DialogContent>
      </Dialog>
    );

  if (!vistoria) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="p-6 space-y-4">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList size={18} /> Vistoria
          </h3>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {/* INFO PRINCIPAL */}
        <div className="border-t border-border pt-3 space-y-2 text-sm">
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

        {/* FOOTER */}
        <div className="pt-4 border-t border-border">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
