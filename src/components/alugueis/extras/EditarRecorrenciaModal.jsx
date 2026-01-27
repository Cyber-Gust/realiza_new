"use client";

import { useState } from "react";
import Modal from "@/components/admin/ui/Modal";
import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import { Input, Label } from "@/components/admin/ui/Form";

export default function EditarRecorrenciaModal({
  row,
  isOpen,
  onClose,
  onSaved,
}) {
  const toast = useToast();

  const [descricao, setDescricao] = useState(row.descricao);
  const [valor, setValor] = useState(row.valor);
  const [dataVencimento, setDataVencimento] = useState(
    row.data_vencimento?.slice(0, 10)
  );
  const [loading, setLoading] = useState(false);

  const salvar = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/alugueis/acrescimos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: row.id,
          descricao,
          valor,
          data_vencimento: dataVencimento,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Lançamento atualizado com sucesso");
      onSaved?.({ ...row, descricao, valor, data_vencimento: dataVencimento });
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar lançamento recorrente"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <Label className="label">Descrição</Label>
          <Input
            className="input"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
        </div>

        <div>
          <Label className="label">Valor</Label>
          <Input
            type="number"
            className="input"
            value={valor}
            onChange={(e) => setValor(Number(e.target.value))}
          />
        </div>

        <div>
          <Label className="label">Data de vencimento</Label>
          <Input
            type="date"
            className="input"
            value={dataVencimento}
            onChange={(e) => setDataVencimento(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button onClick={salvar} disabled={loading}>
            Salvar alterações
          </Button>
        </div>
      </div>
    </Modal>
  );
}
