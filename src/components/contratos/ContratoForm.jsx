"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Label, Input, Select, Textarea } from "@/components/admin/ui/Form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import SearchableSelect from "../admin/ui/SearchableSelect";

export default function ContratoForm({ contrato, onClose, onSaved }) {
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [imoveis, setImoveis] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [imovelSelecionado, setImovelSelecionado] = useState(null);

  /* =============================
     CAMPOS DO FORM
  ============================== */
  const [form, setForm] = useState({
    tipo: "locacao",
    imovel_id: "",
    proprietario_id: "",
    inquilino_id: "",
    corretor_venda_id: "",
    valor_acordado: "",
    taxa_administracao_percent: "",
    dia_vencimento_aluguel: 5,
    indice_reajuste: "IGPM",
    data_inicio: "",
    data_fim: "",
    template_id: "",
    corpo_contrato: "",
  });

  /* =============================
     LOAD OPTIONS
  ============================== */
  const loadOptions = useCallback(async () => {
    try {
      const [imv, ppl, corr, tmpl] = await Promise.all([
        fetch("/api/imoveis").then((r) => r.json()),
        fetch("/api/perfis/list?type=personas").then((r) => r.json()),
        fetch("/api/perfis/list?type=equipe").then((r) => r.json()),
        fetch("/api/contratos/templates")
          .then((r) => r.json())
          .catch(() => ({ data: [] })),
      ]);

      setImoveis(imv.data || []);
      setPessoas(ppl.data || []);
      setCorretores(corr.data || []);
      setTemplates(tmpl.data || []);
    } catch {
      toast.error("Erro ao carregar opções");
    }
  }, [toast]);

  /* =============================
     LOAD CONTRATO (EDIÇÃO)
  ============================== */
  useEffect(() => {
    loadOptions();

    if (contrato) {
      setForm({
        tipo: contrato.tipo || "locacao",
        imovel_id: contrato.imovel_id || "",
        proprietario_id: contrato.proprietario_id || "",
        inquilino_id: contrato.inquilino_id || "",
        corretor_venda_id: contrato.corretor_venda_id || "",
        valor_acordado: contrato.valor_acordado || "",
        taxa_administracao_percent:
          contrato.taxa_administracao_percent || "",
        dia_vencimento_aluguel: contrato.dia_vencimento_aluguel || 5,
        indice_reajuste: contrato.indice_reajuste || "IGPM",
        data_inicio: contrato.data_inicio || "",
        data_fim: contrato.data_fim || "",
        template_id: contrato.template_id || "",
        corpo_contrato: contrato.corpo_contrato || "",
      });
    }
  }, [contrato, loadOptions]);

  /* =============================
     AUTO-PREENCHIMENTO FINANCEIRO
     (IMÓVEL → FORM)
  ============================== */
  useEffect(() => {
    if (!imovelSelecionado) return;

    // LOCAÇÃO → taxa de administração
    if (form.tipo === "locacao") {
      if (imovelSelecionado.comissao_locacao_percent != null) {
        setForm((prev) => ({
          ...prev,
          taxa_administracao_percent:
            imovelSelecionado.comissao_locacao_percent,
        }));
      }
    }

    // VENDA → comissão
    if (form.tipo === "venda") {
      if (imovelSelecionado.comissao_venda_percent != null) {
        setForm((prev) => ({
          ...prev,
          taxa_administracao_percent:
            imovelSelecionado.comissao_venda_percent,
        }));
      }
    }
  }, [form.tipo, imovelSelecionado]);

  /* =============================
     HANDLERS
  ============================== */
  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSelectTemplate = (templateId) => {
    updateField("template_id", templateId);

    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      updateField("corpo_contrato", tpl.conteudo);
    }
  };

  /* =============================
     SAVE
  ============================== */
  const handleSave = async () => {
    try {
      setSaving(true);

      if (!form.imovel_id) return toast.error("Selecione o imóvel");
      if (!form.proprietario_id)
        return toast.error("Selecione o proprietário");

      if (form.tipo === "locacao" && !form.inquilino_id) {
        return toast.error(
          "Selecione o inquilino (somente contratos de locação)"
        );
      }

      if (!form.data_inicio || !form.data_fim)
        return toast.error("Preencha as datas de vigência");

      if (new Date(form.data_inicio) > new Date(form.data_fim))
        return toast.error(
          "A data de início não pode ser maior que a de término"
        );

      const payload = {
        ...form,
        valor_acordado: Number(form.valor_acordado),
        taxa_administracao_percent: form.taxa_administracao_percent
          ? Number(form.taxa_administracao_percent)
          : null,
      };

      if (form.tipo !== "locacao") payload.inquilino_id = null;
      if (form.tipo !== "venda") payload.corretor_venda_id = null;

      delete payload.status;
      delete payload.assinatura_status;

      const method = contrato ? "PATCH" : "POST";

      const res = await fetch("/api/contratos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Contrato salvo com sucesso!");
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err.message || "Erro ao salvar contrato");
    } finally {
      setSaving(false);
    }
  };

  /* =============================
     UI
  ============================== */
  return (
    <div className="space-y-8">
      {/* DADOS GERAIS */}

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

      {/* PARTICIPANTES */}
        <h4 className="font-semibold text-sm mb-4 tracking-wide">
          Participantes
        </h4>

        {form.tipo === "venda" && (
          <Field label="Corretor da Venda">
            <SearchableSelect
              value={form.corretor_venda_id}
              onChange={(v) => updateField("corretor_venda_id", v)}
              options={corretores.map((c) => ({
                value: c.id,
                label: c.nome_completo,
              }))}
            />
          </Field>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Proprietário">
            <SearchableSelect
              value={form.proprietario_id}
              onChange={(v) => updateField("proprietario_id", v)}
              options={pessoas.map((p) => ({
                value: p.id,
                label: p.nome,
              }))}
            />
          </Field>

          {form.tipo === "locacao" && (
            <Field label="Inquilino">
              <SearchableSelect
                value={form.inquilino_id}
                onChange={(v) => updateField("inquilino_id", v)}
                options={pessoas.map((p) => ({
                  value: p.id,
                  label: p.nome,
                }))}
              />
            </Field>
          )}
        </div>

      {/* IMÓVEL */}
        <Field label="Selecione o imóvel">
          <SearchableSelect
            value={form.imovel_id}
            onChange={(value) => {
              updateField("imovel_id", value);
              const imv = imoveis.find((i) => i.id === value);
              setImovelSelecionado(imv || null);
            }}
            options={imoveis.map((i) => ({
              value: i.id,
              label: i.titulo,
            }))}
          />
        </Field>

      {/* TEMPLATE */}
        <Field label="Modelo de Contrato">
          <Select
            value={form.template_id}
            onChange={(e) => handleSelectTemplate(e.target.value)}
          >
            <option value="">Selecione</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.tipo})
              </option>
            ))}
          </Select>
        </Field>

        {form.corpo_contrato && (
          <div className="mt-4">
            <Label className="text-xs tracking-wide">
              Corpo do Contrato (editável)
            </Label>
            <Textarea
              className="min-h-[260px]"
              value={form.corpo_contrato}
              onChange={(e) =>
                updateField("corpo_contrato", e.target.value)
              }
            />
          </div>
        )}

      {/* FINANCEIRO */}
        <h4 className="font-semibold text-sm mb-4 tracking-wide">
          Financeiro
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Valor do Contrato (R$)">
            <Input
              type="number"
              value={form.valor_acordado}
              onChange={(e) =>
                updateField("valor_acordado", e.target.value)
              }
            />
          </Field>

          <Field
            label={
              form.tipo === "venda"
                ? "% Comissão"
                : "% Taxa de Administração"
            }
          >
            <Input
              type="number"
              value={form.taxa_administracao_percent}
              onChange={(e) =>
                updateField(
                  "taxa_administracao_percent",
                  e.target.value
                )
              }
            />
          </Field>

          {form.tipo === "locacao" && (
            <>
              <Field label="Dia de Vencimento">
                <Input
                  type="number"
                  value={form.dia_vencimento_aluguel}
                  onChange={(e) =>
                    updateField(
                      "dia_vencimento_aluguel",
                      Number(e.target.value)
                    )
                  }
                />
              </Field>

              <Field label="Índice de Reajuste">
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
            </>
          )}
        </div>

      {/* VIGÊNCIA */}
        <h4 className="font-semibold text-sm mb-4 tracking-wide">
          Vigência
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Data de Início">
            <Input
              type="date"
              value={form.data_inicio}
              onChange={(e) =>
                updateField("data_inicio", e.target.value)
              }
            />
          </Field>

          <Field label="Data de Término">
            <Input
              type="date"
              value={form.data_fim}
              onChange={(e) =>
                updateField("data_fim", e.target.value)
              }
            />
          </Field>
        </div>

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

/* FIELD */
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs tracking-wide">{label}</Label>
      {children}
    </div>
  );
}
