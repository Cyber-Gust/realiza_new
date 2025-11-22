"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/admin/ui/Modal";
import { Button } from "@/components/admin/ui/Button";
import { Input, Textarea } from "@/components/admin/ui/Form";
import { useToast } from "@/contexts/ToastContext";

export default function ChavesDialog({ imovelId, open, onClose }) {
  const { success, error } = useToast();

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
      error("Erro", err.message);
    }
  };

  // 🔹 Buscar histórico
  const loadHistorico = async () => {
    if (!imovelId) return;
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/chaves/historico`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao buscar histórico");
      setHistorico(json.data || []);
    } catch (err) {
      error("Erro", err.message);
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
    if (!novoLocal) return error("Atenção", "Informe o novo local!");
    if (!imovelId) return error("Atenção", "ID do imóvel não encontrado!");

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

      success("Sucesso", "Localização atualizada com sucesso!");

      setNovoLocal("");
      setObservacao("");
      loadChave();
      loadHistorico();
    } catch (err) {
      error("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Controle de Chaves"
      footer={
        <Button onClick={atualizarLocal} disabled={loading}>
          {loading ? "Salvando..." : "Atualizar localização"}
        </Button>
      }
    >
      <div className="space-y-4">

        <p className="text-sm text-muted-foreground">
          <strong>Localização atual:</strong>{" "}
          <span className="font-medium text-foreground">{localizacao}</span>
        </p>

        <Input
          placeholder="Nova localização (ex: com corretor João / em visita)"
          value={novoLocal}
          onChange={(e) => setNovoLocal(e.target.value)}
        />

        <Textarea
          placeholder="Observação opcional (ex: entrega para visita agendada)"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          rows={2}
        />

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
      </div>
    </Modal>
  );
}
