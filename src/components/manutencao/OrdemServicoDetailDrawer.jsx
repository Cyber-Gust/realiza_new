"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";
import { Loader2, Wrench, FileText, X } from "lucide-react";

export default function OrdemServicoDetailDrawer({ ordemId, onClose, onUpdated }) {
  const [ordem, setOrdem] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrdem = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/manutencao/ordens-servico?id=${ordemId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setOrdem(json.data?.find((o) => o.id === ordemId));
    } catch (err) {
      Toast.error("Erro ao carregar OS: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ordemId) loadOrdem();
  }, [ordemId]);

  if (loading)
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="p-6 text-center text-muted-foreground">
          <Loader2 className="animate-spin mx-auto mb-3" /> Carregando detalhes...
        </DialogContent>
      </Dialog>
    );

  if (!ordem) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wrench size={18} /> Ordem de Serviço
          </h3>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        <div className="border-t border-border pt-3 space-y-2 text-sm">
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

        <div className="pt-4 border-t border-border">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
