"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";

import {
  Label,
  Input,
  Textarea,
  Select,
} from "@/components/admin/ui/Form";

import { Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";

export default function ContratoForm({ contrato, onClose, onSaved }) {
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

  /* ============================================================
     LOAD OPTIONS
  ============================================================ */
  const loadOptions = useCallback(async () => {
    try {
      const [imv, ppl] = await Promise.all([
        fetch("/api/imoveis").then((r) => r.json()),
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

  /* ============================================================
     HELPERS
  ============================================================ */
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

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div className="space-y-8">

      {/* ========================================================
          SEÇÃO: Dados gerais
      ======================================================== */}
      <Card className="p-5 border-border rounded-xl shadow-sm bg-panel-card">
        <h4 className="font-semibold text-sm mb-4 tracking-wide">Dados Gerais</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Field label="Tipo de Contrato">
            <Select
              value={form.tipo}
              onChange={(e) => updateField("tipo", e.target.value)}
            >
              <option value="locacao">Locação</option>
              <option value="venda">Venda</option>
              <option value="administracao">Administração</option>
            </Select>
          </Field>

          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => updateField("status", e.target.value)}
            >
              <option value="pendente_assinatura">Pendente de Assinatura</option>
              <option value="ativo">Ativo</option>
              <option value="encerrado">Encerrado</option>
            </Select>
          </Field>

        </div>
      </Card>

      {/* ========================================================
          SEÇÃO: Participantes
      ======================================================== */}
      <Card className="p-5 border-border rounded-xl shadow-sm bg-panel-card">
        <h4 className="font-semibold text-sm mb-4 tracking-wide">Participantes</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Field label="Proprietário">
            <Select
              value={form.proprietario_id}
              onChange={(e) => updateField("proprietario_id", e.target.value)}
            >
              <option value="">Selecione</option>
              {pessoas
                .filter((p) => p.tipo === "proprietario")
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
            </Select>
          </Field>

          <Field label="Inquilino">
            <Select
              value={form.inquilino_id}
              onChange={(e) => updateField("inquilino_id", e.target.value)}
            >
              <option value="">Selecione</option>
              {pessoas
                .filter((p) => p.tipo === "inquilino")
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
            </Select>
          </Field>

        </div>
      </Card>

      {/* ========================================================
          SEÇÃO: Imóvel
      ======================================================== */}
      <Card className="p-5 border-border rounded-xl shadow-sm bg-panel-card">
        <h4 className="font-semibold text-sm mb-4 tracking-wide">Imóvel</h4>

        <Field label="Selecione o imóvel">
          <Select
            value={form.imovel_id}
            onChange={(e) => updateField("imovel_id", e.target.value)}
          >
            <option value="">Selecione</option>
            {imoveis.map((i) => (
              <option key={i.id} value={i.id}>{i.titulo}</option>
            ))}
          </Select>
        </Field>
      </Card>

      {/* ========================================================
          SEÇÃO: Financeiro
      ======================================================== */}
      <Card className="p-5 border-border rounded-xl shadow-sm bg-panel-card">
        <h4 className="font-semibold text-sm mb-4 tracking-wide">Financeiro</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Field label="Valor do Contrato (R$)">
            <Input
              type="number"
              value={form.valor_acordado}
              onChange={(e) => updateField("valor_acordado", e.target.value)}
            />
          </Field>

          <Field label="% Taxa de Administração">
            <Input
              type="number"
              value={form.taxa_administracao_percent}
              onChange={(e) =>
                updateField("taxa_administracao_percent", e.target.value)
              }
            />
          </Field>

          <Field label="Dia de Vencimento">
            <Input
              type="number"
              value={form.dia_vencimento_aluguel}
              onChange={(e) =>
                updateField("dia_vencimento_aluguel", Number(e.target.value))
              }
            />
          </Field>

          <Field label="Índice de Reajuste">
            <Select
              value={form.indice_reajuste}
              onChange={(e) => updateField("indice_reajuste", e.target.value)}
            >
              <option value="IGPM">IGP-M</option>
              <option value="IPCA">IPCA</option>
            </Select>
          </Field>

        </div>
      </Card>

      {/* ========================================================
          SEÇÃO: Vigência
      ======================================================== */}
      <Card className="p-5 border-border rounded-xl shadow-sm bg-panel-card">
        <h4 className="font-semibold text-sm mb-4 tracking-wide">Vigência</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Field label="Data de Início">
            <Input
              type="date"
              value={form.data_inicio}
              onChange={(e) => updateField("data_inicio", e.target.value)}
            />
          </Field>

          <Field label="Data de Término">
            <Input
              type="date"
              value={form.data_fim}
              onChange={(e) => updateField("data_fim", e.target.value)}
            />
          </Field>

        </div>
      </Card>

      {/* BOTÕES */}
      <div className="flex justify-end gap-2">
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

/* FIELD PADRÃO */
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs tracking-wide">{label}</Label>
      {children}
    </div>
  );
}
