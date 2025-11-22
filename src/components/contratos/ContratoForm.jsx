"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";

import {
  Label,
  Input,
  Textarea,
  Select,
  FormError,
} from "@/components/admin/ui/Form";

import { Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export default function CRMContratoForm({ contrato, onClose, onSaved }) {
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [imoveis, setImoveis] = useState([]);
  const [pessoas, setPessoas] = useState([]);

  const [form, setForm] = useState({
    tipo: "locacao",
    imovel_id: "",
    proprietario_id: "",
    inquilino_id: "",
    valor_acordado: "",
    taxa_administracao_percent: "",
    dia_vencimento_aluguel: 5,
    indice_reajuste: "IGPM",
    data_inicio: "",
    data_fim: "",
    status: "pendente_assinatura",
  });

  const loadOptions = useCallback(async () => {
    try {
      const [imv, ppl] = await Promise.all([
        fetch("/api/imoveis/list").then((r) => r.json()),
        fetch("/api/perfis/list?type=personas").then((r) => r.json()),
      ]);

      setImoveis(imv.data || []);
      setPessoas(ppl.data || []);
    } catch (e) {
      toast.error("Erro ao carregar opções", e.message);
    }
  }, [toast]);

  useEffect(() => {
    if (contrato) {
      setForm({
        ...contrato,
        valor_acordado: contrato.valor_acordado || "",
        taxa_administracao_percent: contrato.taxa_administracao_percent || "",
      });
    }
    loadOptions();
  }, [contrato, loadOptions]);

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      const method = contrato ? "PATCH" : "POST";

      const res = await fetch("/api/contratos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Contrato salvo com sucesso!");
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error("Erro ao salvar contrato", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tipo */}
        <Field label="Tipo">
          <Select
            value={form.tipo}
            onChange={(e) => updateField("tipo", e.target.value)}
          >
            <option value="locacao">Locação</option>
            <option value="venda">Venda</option>
            <option value="administracao">Administração</option>
          </Select>
        </Field>

        {/* Imóvel */}
        <Field label="Imóvel">
          <Select
            value={form.imovel_id}
            onChange={(e) => updateField("imovel_id", e.target.value)}
          >
            <option value="">Selecione</option>
            {imoveis.map((i) => (
              <option key={i.id} value={i.id}>
                {i.titulo}
              </option>
            ))}
          </Select>
        </Field>

        {/* Proprietário */}
        <Field label="Proprietário">
          <Select
            value={form.proprietario_id}
            onChange={(e) => updateField("proprietario_id", e.target.value)}
          >
            <option value="">Selecione</option>
            {pessoas
              .filter((p) => p.tipo === "proprietario")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
          </Select>
        </Field>

        {/* Inquilino */}
        <Field label="Inquilino">
          <Select
            value={form.inquilino_id}
            onChange={(e) => updateField("inquilino_id", e.target.value)}
          >
            <option value="">Selecione</option>
            {pessoas
              .filter((p) => p.tipo === "inquilino")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
          </Select>
        </Field>

        {/* Valor Acordado */}
        <Field label="Valor Acordado (R$)">
          <Input
            type="number"
            value={form.valor_acordado}
            onChange={(e) => updateField("valor_acordado", e.target.value)}
          />
        </Field>

        {/* Taxa Administração */}
        <Field label="% Taxa Administração">
          <Input
            type="number"
            value={form.taxa_administracao_percent}
            onChange={(e) =>
              updateField("taxa_administracao_percent", e.target.value)
            }
          />
        </Field>

        {/* Dia Vencimento */}
        <Field label="Dia Vencimento">
          <Input
            type="number"
            value={form.dia_vencimento_aluguel}
            onChange={(e) =>
              updateField("dia_vencimento_aluguel", Number(e.target.value))
            }
          />
        </Field>

        {/* Índice Reajuste */}
        <Field label="Índice Reajuste">
          <Select
            value={form.indice_reajuste}
            onChange={(e) =>
              updateField("indice_reajuste", e.target.value)
            }
          >
            <option value="IGPM">IGP-M</option>
            <option value="IPCA">IPCA</option>
          </Select>
        </Field>

        {/* Datas */}
        <Field label="Data Início">
          <Input
            type="date"
            value={form.data_inicio}
            onChange={(e) => updateField("data_inicio", e.target.value)}
          />
        </Field>

        <Field label="Data Fim">
          <Input
            type="date"
            value={form.data_fim}
            onChange={(e) => updateField("data_fim", e.target.value)}
          />
        </Field>
      </Card>

      {/* Botões */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving && <Loader2 className="animate-spin" size={16} />}
          Salvar
        </Button>
      </div>
    </div>
  );
}

/* FIELD PADRÃO DO DS */
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs tracking-wide">{label}</Label>
      {children}
    </div>
  );
}
