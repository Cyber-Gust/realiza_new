"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Input from "@/components/admin/forms/Input";
import { toast } from "@/components/ui/use-toast";

export default function ChavesDialog({ imovelId, open, onClose }) {
  const [localizacao, setLocalizacao] = useState("");
  const [novoLocal, setNovoLocal] = useState("");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState([]);

  // 🔹 Buscar localização atual
  const loadChave = async () => {
    if (!imovelId) return;
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/chaves`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao buscar chaves");
      setLocalizacao(json.data?.chaves_localizacao || "Não informado");
    } catch (err) {
      toast({ message: err.message, type: "error" });
    }
  };

  // 🔹 Buscar histórico de movimentações
  const loadHistorico = async () => {
    if (!imovelId) return;
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/chaves/historico`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao buscar histórico");
      setHistorico(json.data || []);
    } catch (err) {
      toast({ message: err.message, type: "error" });
    }
  };

  useEffect(() => {
    if (open) {
      loadChave();
      loadHistorico();
    }
  }, [open, imovelId]);

  // 🔹 Atualizar status + salvar histórico
  const atualizarLocal = async () => {
    if (!novoLocal)
      return toast({ message: "Informe o novo local!", type: "error" });
    if (!imovelId)
      return toast({ message: "ID do imóvel não encontrado!", type: "error" });

    setLoading(true);
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/chaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localizacao: novoLocal,
          observacao,
          acao: "transferencia",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar localização");
      toast({ message: "Localização atualizada com sucesso!", type: "success" });
      setNovoLocal("");
      setObservacao("");
      loadChave();
      loadHistorico();
    } catch (err) {
      toast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle>Controle de Chaves</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <strong>Localização atual:</strong>{" "}
            <span className="font-medium text-foreground">{localizacao}</span>
          </p>

          <Input
            placeholder="Nova localização (ex: com corretor João / em visita)"
            value={novoLocal}
            onChange={(e) => setNovoLocal(e.target.value)}
          />

          <textarea
            placeholder="Observação opcional (ex: entrega para visita agendada)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
            rows={2}
          />

          <Button
            onClick={atualizarLocal}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Salvando..." : "Atualizar localização"}
          </Button>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2">Histórico recente</h4>
          <ul className="text-sm text-muted-foreground space-y-2 max-h-48 overflow-y-auto border-t pt-2">
            {historico.length > 0 ? (
              historico.map((h) => (
                <li key={h.id} className="border-b pb-1 border-border">
                  <div className="flex flex-col">
                    <span>
                      <strong>{h.profiles?.nome_completo || "Usuário"}</strong> —{" "}
                      {h.acao}
                    </span>
                    <span className="text-xs text-foreground">{h.localizacao}</span>
                    {h.observacao && (
                      <span className="text-xs italic text-muted-foreground">
                        {h.observacao}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {new Date(h.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-xs italic text-muted-foreground">
                Nenhum registro de movimentação.
              </p>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
