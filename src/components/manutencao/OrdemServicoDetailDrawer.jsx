"use client";

import { useEffect, useState } from "react";

// UI
import Modal from "@/components/admin/ui/Modal";
import { Button } from "@/components/admin/ui/Button";

// Toast correto
import { useToast } from "@/contexts/ToastContext";

import { Loader2, Wrench, FileText, X } from "lucide-react";

export default function OrdemServicoDetailDrawer({ ordemId, onClose, onUpdated }) {
  const [ordem, setOrdem] = useState(null);
  const [loading, setLoading] = useState(true);

  const toast = useToast(); // ✔ agora realmente mostra os toasts

  const loadOrdem = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/manutencao/ordens-servico?id=${ordemId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setOrdem(json.data?.find((o) => o.id === ordemId));
    } catch (err) {
      toast.error("Erro ao carregar OS", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ordemId) loadOrdem();
  }, [ordemId]);

  // -------------------------
  // LOADING STATE
  // -------------------------
  if (loading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Carregando...">
        <div className="flex flex-col items-center text-muted-foreground py-6">
          <Loader2 className="animate-spin mb-3 h-6 w-6" />
          Carregando detalhes...
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </Modal>
    );
  }

  if (!ordem) return null;

  // -------------------------
  // MODAL COM OS DETALHES
  // -------------------------

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Wrench size={18} /> Ordem de Serviço
        </span>
      }
      footer={
        <Button variant="secondary" className="w-full" onClick={onClose}>
          Fechar
        </Button>
      }
    >
      {/* Conteúdo principal */}
      <div className="space-y-3 text-sm">
        <p>
          <strong>Imóvel:</strong> {ordem.imovel?.titulo || "Não informado"}
        </p>
        <p>
          <strong>Status:</strong> {ordem.status}
        </p>
        <p>
          <strong>Descrição:</strong> {ordem.descricao_problema}
        </p>
        <p>
          <strong>Prestador:</strong> {ordem.prestador_aprovado || "—"}
        </p>

        {ordem.custo_final && (
          <p>
            <strong>Custo Final:</strong> R$ {Number(ordem.custo_final).toFixed(2)}
          </p>
        )}
      </div>

      {/* Orçamentos */}
      {ordem.orcamentos_json?.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
            <FileText size={14} /> Orçamentos
          </h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {ordem.orcamentos_json.map((o, idx) => (
              <li key={idx}>
                • {o.prestador} — R$ {Number(o.valor).toFixed(2)} ({o.status})
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
