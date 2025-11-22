"use client";

import { useEffect, useState } from "react";

// UI
import { Button } from "@/components/admin/ui/Button";
import {
  Input,
  Textarea,
  Select,
  Label,
  FormError,
} from "@/components/admin/ui/Form";

// Toast correto
import { useToast } from "@/contexts/ToastContext";

import { Loader2 } from "lucide-react";

export default function OrdemServicoForm({ ordem, onClose, onSaved }) {
  const [form, setForm] = useState({
    imovel_id: "",
    contrato_id: "",
    descricao_problema: "",
    status: "aberta",
  });

  const [saving, setSaving] = useState(false);
  const [imoveis, setImoveis] = useState([]);

  const toast = useToast();

  useEffect(() => {
    if (ordem) setForm(ordem);
    loadImoveis();
  }, [ordem]);

  const loadImoveis = async () => {
    try {
      const res = await fetch("/api/imoveis/list", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao buscar imóveis");

      setImoveis(
        (json.data || []).map((i) => ({
          label: i.titulo_curto || i.titulo || i.endereco_cidade || "Sem nome",
          value: i.id,
        }))
      );
    } catch (err) {
      toast.error("Erro ao carregar imóveis", err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = ordem ? "PUT" : "POST";
      const res = await fetch("/api/manutencao/ordens-servico", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          contrato_id: form.contrato_id || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(
        ordem ? "Ordem de serviço atualizada!" : "Ordem de serviço criada!",
        ""
      );

      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error("Erro ao salvar", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Imóvel */}
      <div className="space-y-1">
        <Label>Imóvel</Label>
        <Select
          name="imovel_id"
          value={form.imovel_id}
          onChange={handleChange}
          required
        >
          <option value="">Selecione o imóvel...</option>
          {imoveis.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Descrição */}
      <div className="space-y-1">
        <Label>Descrição do problema</Label>
        <Textarea
          name="descricao_problema"
          value={form.descricao_problema}
          onChange={handleChange}
          required
        />
      </div>

      {/* Status */}
      <div className="space-y-1">
        <Label>Status</Label>
        <Select
          name="status"
          value={form.status}
          onChange={handleChange}
        >
          <option value="aberta">Aberta</option>
          <option value="orcamento">Orçamento</option>
          <option value="aprovada_pelo_inquilino">Aprovada pelo Inquilino</option>
          <option value="aprovada_pelo_proprietario">
            Aprovada pelo Proprietário
          </option>
          <option value="em_execucao">Em Execução</option>
          <option value="concluida">Concluída</option>
          <option value="cancelada">Cancelada</option>
        </Select>
      </div>

      {/* Botão */}
      <Button type="submit" disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="animate-spin mr-2" />
            Salvando...
          </>
        ) : ordem ? (
          "Atualizar Ordem de Serviço"
        ) : (
          "Criar Ordem de Serviço"
        )}
      </Button>
    </form>
  );
}
