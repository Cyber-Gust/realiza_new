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

  // =============================
  // CAMPOS DO FORM
  // =============================
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
    status: "em_elaboracao",

    template_id: "",
    corpo_contrato: "",

    assinatura_status: "pendente",
  });

  // =============================
  // LOAD OPTIONS
  // =============================
  const loadOptions = useCallback(async () => {
    try {
      const [imv, ppl, tmpl] = await Promise.all([
        fetch("/api/imoveis").then((r) => r.json()),
        fetch("/api/perfis/list?type=personas").then((r) => r.json()),
        fetch("/api/contratos/templates")
          .then((r) => r.json())
          .catch(() => ({ data: [] })),
      ]);

      setImoveis(imv.data || []);
      setPessoas(ppl.data || []);
      setTemplates(tmpl.data || []);
    } catch {
      toast.error("Erro ao carregar opções");
    }
  }, [toast]);

  // Carregar contrato existente
  useEffect(() => {
    loadOptions();

    if (contrato) {
      setForm({
        ...contrato,
        corpo_contrato: contrato.corpo_contrato || "",
        template_id: contrato.template_id || "",
        valor_acordado: contrato.valor_acordado || "",
        taxa_administracao_percent: contrato.taxa_administracao_percent || "",
      });
    }
  }, [contrato, loadOptions]);

  // =============================
  // HANDLERS
  // =============================
  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Quando escolher um template → carregar texto
  const handleSelectTemplate = (templateId) => {
    updateField("template_id", templateId);

    const tpl = templates.find((t) => t.id === templateId);
    if (tpl) {
      updateField("corpo_contrato", tpl.conteudo); // 🔧 MOD: texto do template vai para o campo editável
    }
  };

  // =============================
  // SAVE
  // =============================
  const handleSave = async () => {
    try {
      setSaving(true);

      if (!form.imovel_id) return toast.error("Selecione o imóvel");
      if (!form.proprietario_id) return toast.error("Selecione o proprietário");

      // 🔧 MOD: validação dinâmica → só exige inquilino para locação
      if (form.tipo === "locacao" && !form.inquilino_id)
        return toast.error("Selecione o inquilino (somente em contratos de locação)");

      if (!form.data_inicio || !form.data_fim)
        return toast.error("Preencha as datas de vigência");
      if (new Date(form.data_inicio) > new Date(form.data_fim))
        return toast.error("A data de início não pode ser maior que a de término");

      // =============================
      // MONTAGEM DO PAYLOAD
      // =============================
      const payload = {
        ...form,
        valor_acordado: Number(form.valor_acordado),
        taxa_administracao_percent: form.taxa_administracao_percent
          ? Number(form.taxa_administracao_percent)
          : null,
        corpo_contrato: form.corpo_contrato,
      };

      // Ajuste crítico: nunca enviar "" como UUID
      if (form.tipo !== "locacao") {
        payload.inquilino_id = null;
      } else {
        if (!form.inquilino_id) {
          return toast.error("Selecione o inquilino");
        }
      }

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

  // =============================
  // UI
  // =============================
  return (
    <div className="space-y-8">

      {/* ===========================================
          DADOS GERAIS
      ============================================ */}
      <div >
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
              <option value="em_elaboracao">Em Elaboração</option>
              <option value="aguardando_assinatura">Aguardando Assinatura</option>
              <option value="assinado">Assinado</option>
              <option value="vigente">Vigente</option>
              <option value="reajuste_pendente">Reajuste Pendente</option>
              <option value="renovacao_pendente">Renovação Pendente</option>
              <option value="encerrado">Encerrado</option>
              <option value="rescindido">Rescindido</option>
              <option value="cancelado">Cancelado</option>
            </Select>
          </Field>

        </div>
      </div>

      {/* ===========================================
          PARTICIPANTES
      ============================================ */}
      <div>
        <h4 className="font-semibold text-sm mb-4 tracking-wide">Participantes</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Field label="Proprietário">
            <SearchableSelect
              value={form.proprietario_id}
              onChange={(value) => updateField("proprietario_id", value)}
              placeholder="Selecione o proprietário"
              options={pessoas.map((p) => ({
                value: p.id,
                label: p.nome,
              }))}
            />
          </Field>

          {/* 🔧 MOD: inquilino só aparece quando tipo === locacao  */}
          {form.tipo === "locacao" && (
            <Field label="Inquilino">
              <SearchableSelect
                value={form.inquilino_id}
                onChange={(value) => updateField("inquilino_id", value)}
                placeholder="Selecione o inquilino"
                options={pessoas.map((p) => ({
                  value: p.id,
                  label: p.nome,
                }))}
              />
            </Field>
          )}

        </div>
      </div>

      {/* ===========================================
          IMÓVEL
      ============================================ */}
      <div>
        <h4 className="font-semibold text-sm mb-4 tracking-wide">Imóvel</h4>

        <Field label="Selecione o imóvel">
          <SearchableSelect
            value={form.imovel_id}
            onChange={(value) => updateField("imovel_id", value)}
            placeholder="Buscar imóvel..."
            options={imoveis.map((i) => ({
              value: i.id,
              label: i.titulo,
            }))}
          />
        </Field>
      </div>

      {/* ===========================================
          TEMPLATE & CORPO DO CONTRATO
      ============================================ */}
      <div >
        <h4 className="font-semibold text-sm mb-4 tracking-wide">Template do Contrato</h4>

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

        {/* 🔧 MOD: corpo_contrato aparece sempre que existir texto */}
        {form.corpo_contrato && (
          <div className="mt-4 space-y-1">
            <Label className="text-xs tracking-wide">Corpo do Contrato (editável)</Label>

            <Textarea
              className="min-h-[260px]"
              value={form.corpo_contrato}
              onChange={(e) => updateField("corpo_contrato", e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ===========================================
          FINANCEIRO
      ============================================ */}
      <div>
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

          {form.tipo === "locacao" && (
            <>
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
            </>
          )}

        </div>
      </div>

      {/* ===========================================
          VIGÊNCIA
      ============================================ */}
      <div >
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

/* COMPONENTE FIELD */
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs tracking-wide">{label}</Label>
      {children}
    </div>
  );
}
