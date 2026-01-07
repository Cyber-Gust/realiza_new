"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, X } from "lucide-react";

// UI
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import SearchableSelect from "@/components/admin/ui/SearchableSelect";
import {
  Input,
  Select,
  Label,
} from "@/components/admin/ui/Form";

// Toast
import { useToast } from "@/contexts/ToastContext";

export default function VistoriaForm({
  open,
  editingVistoria = null,
  onClose,
  reload,
}) {
  const toast = useToast();
  const isEditing = !!editingVistoria?.id;

  const [loading, setLoading] = useState(false);
  const [imoveis, setImoveis] = useState([]);

  const [form, setForm] = useState({
    imovel_id: "",
    contrato_id: "",
    tipo: "",
    data_vistoria: "",
  });

  /* ===============================
      LOAD IMÓVEIS
  =============================== */
  const loadImoveis = useCallback(async () => {
    try {
      const res = await fetch("/api/imoveis?ativo=true", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setImoveis(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar imóveis", err.message);
    }
  }, [toast]);

  /* ===============================
      INIT
  =============================== */
  useEffect(() => {
    if (!open) return;

    loadImoveis();

    if (editingVistoria) {
      setForm({
        imovel_id: editingVistoria.imovel_id || "",
        contrato_id: editingVistoria.contrato_id || "",
        tipo: editingVistoria.tipo || "",
        data_vistoria: editingVistoria.data_vistoria || "",
      });
    } else {
      setForm({
        imovel_id: "",
        contrato_id: "",
        tipo: "",
        data_vistoria: "",
      });
    }
  }, [open, editingVistoria, loadImoveis]);

  /* ===============================
      HELPERS
  =============================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  /* ===============================
      SUBMIT
  =============================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.imovel_id || !form.tipo || !form.data_vistoria) {
      toast.error("Imóvel, tipo e data são obrigatórios");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/manutencao/vistorias", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing && { id: editingVistoria.id }),
          ...form,
          contrato_id: form.contrato_id || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(
        isEditing
          ? "Vistoria atualizada com sucesso"
          : "Vistoria criada com sucesso"
      );

      reload?.();
      onClose?.();
    } catch (err) {
      toast.error("Erro ao salvar vistoria", err.message);
    } finally {
      setLoading(false);
    }
  };

  const imovelOptions = imoveis.map((i) => ({
    value: i.id,
    label: `${i.titulo} — ${i.codigo_ref}`,
  }));

  /* ===============================
      UI
  =============================== */
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <Card className="w-full max-w-xl p-6 bg-panel-card border-border rounded-xl">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isEditing ? "Editar Vistoria" : "Nova Vistoria"}
          </h3>

          <Button size="icon" variant="ghost" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* IMÓVEL */}
          <div className="space-y-1">
            <Label>Imóvel *</Label>
            <SearchableSelect
              value={form.imovel_id}
              onChange={(value) =>
                setForm((p) => ({ ...p, imovel_id: value }))
              }
              options={imovelOptions}
              placeholder="Selecione um imóvel"
            />
          </div>

          {/* TIPO */}
          <div className="space-y-1">
            <Label>Tipo *</Label>
            <Select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
            >
              <option value="">Selecione</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
              <option value="preventiva">Preventiva</option>
              <option value="outra">Outra</option>
            </Select>
          </div>

          {/* DATA */}
          <div className="space-y-1">
            <Label>Data da Vistoria *</Label>
          <Input
            label="Data da Vistoria *"
            type="date"
            name="data_vistoria"
            value={form.data_vistoria}
            onChange={handleChange}
          />
          </div>

          {/* AÇÕES */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="w-1/2"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              className="w-1/2 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? "Atualizar" : "Criar"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
