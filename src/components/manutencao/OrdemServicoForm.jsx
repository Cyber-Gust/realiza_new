"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, X } from "lucide-react";

// UI
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/admin/ui/Form";
import SearchableSelect from "../admin/ui/SearchableSelect";


// Toast
import { useToast } from "@/contexts/ToastContext";

export default function OrdemServicoForm({
  open,
  onClose,
  reload,
  editingOS = null,
}) {
  const toast = useToast();

  const isEditing = !!editingOS?.id;

  const [loading, setLoading] = useState(false);
  const [loadingImoveis, setLoadingImoveis] = useState(true);

  const [descricao, setDescricao] = useState("");
  const [imovelId, setImovelId] = useState("");
  const [nome, setNome] = useState("");
  const [contratoId, setContratoId] = useState("");

  const [imoveis, setImoveis] = useState([]);

  /* ===============================
      LOAD IMÓVEIS
  =============================== */

  const loadImoveis = useCallback(async () => {
    setLoadingImoveis(true);
    try {
      const res = await fetch("/api/imoveis?ativo=true", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setImoveis(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar imóveis", err.message);
    } finally {
      setLoadingImoveis(false);
    }
  }, [toast]);

  /* ===============================
      INIT
  =============================== */

  useEffect(() => {
    if (open) loadImoveis();
  }, [open, loadImoveis]);

  useEffect(() => {
    if (editingOS) {
      setNome(editingOS.nome || "");
      setDescricao(editingOS.descricao_problema || "");
      setImovelId(editingOS.imovel_id || "");
      setContratoId(editingOS.contrato_id || "");
    } else {
      setNome("");
      setDescricao("");
      setImovelId("");
      setContratoId("");
    }
  }, [editingOS, open]);

  /* ===============================
      SUBMIT
  =============================== */

  async function handleSubmit(e) {
    e.preventDefault();

    if (!nome || !descricao || !imovelId) {
      toast.error("Nome, descrição e imóvel são obrigatórios");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nome,
        descricao_problema: descricao,
        imovel_id: imovelId,
        contrato_id: contratoId || null,
      };

      const res = await fetch("/api/manutencao/ordens-servico", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing
            ? { id: editingOS.id, ...payload }
            : payload
        ),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(
        isEditing
          ? "Ordem de serviço atualizada"
          : "Ordem de serviço criada"
      );

      reload?.();
      onClose?.();
    } catch (err) {
      toast.error("Erro ao salvar OS", err.message);
    } finally {
      setLoading(false);
    }
  }

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
      <Card className="w-full max-w-2xl p-6 bg-panel-card border-border rounded-xl animate-in fade-in zoom-in-95">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isEditing ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
          </h3>

          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* NOME DA OS */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Nome da OS *</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Vazamento no banheiro social"
            />
          </div>

          {/* DESCRIÇÃO */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Descrição do problema *</Label>
            <Textarea
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o problema encontrado no imóvel..."
            />
          </div>

          {/* IMÓVEL */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Imóvel *</Label>
            <SearchableSelect
              value={imovelId}
              onChange={(value) => setImovelId(value)}
              options={imovelOptions}
              placeholder={
                loadingImoveis
                  ? "Carregando imóveis..."
                  : "Selecione um imóvel"
              }
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
