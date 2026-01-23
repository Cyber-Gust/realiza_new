"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Label, Input, Select, Textarea } from "@/components/admin/ui/Form";
import { Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import SearchableSelect from "../admin/ui/SearchableSelect";
import { Card } from "@/components/admin/ui/Card"

export default function ContratoForm({ contrato, onClose, onSaved }) {
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [imoveis, setImoveis] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [imovelSelecionado, setImovelSelecionado] = useState(null);

  /* =============================
      OPÇÕES DE MENU
   ============================== */
  const TIPOS_GARANTIA = [
    "Pessoa Física",
    "Jurídica",
    "Fiador",
    "Seguro Fiança",
    "Depósito Caução",
    "Título de Capitalização",
    "Sem Garantias",
    "Carta Fiança Bancária",
    "Garantia Real",
    "Carta Fiança Empresa",
    "Caução de Imóvel",
    "Locador Solidário",
    "Locatário Solidário",
    "Fiança Digital",
    "Seguro Gratuito",
    "Carta Fiança do Estado"
  ];

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
    // Novos Campos
    tipo_garantia: "",
    tipo_renovacao: "Tempo Indeterminado",
    // Estado local para campos do fiador (será salvo como JSON em dados_garantia)
    fiador_nome: "",
    fiador_telefone: "",
    fiador_documento: "",
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
      // Extrair dados do fiador do JSON se existir
      const dadosGarantia = contrato.dados_garantia || {};
      
      setForm({
        tipo: contrato.tipo || "locacao",
        imovel_id: contrato.imovel_id || "",
        proprietario_id: contrato.proprietario_id || "",
        inquilino_id: contrato.inquilino_id || "",
        corretor_venda_id: contrato.corretor_venda_id || "",
        valor_acordado: contrato.valor_acordado || "",
        taxa_administracao_percent: contrato.taxa_administracao_percent || "",
        dia_vencimento_aluguel: contrato.dia_vencimento_aluguel || 5,
        indice_reajuste: contrato.indice_reajuste || "IGPM",
        data_inicio: contrato.data_inicio || "",
        data_fim: contrato.data_fim || "",
        template_id: contrato.template_id || "",
        corpo_contrato: contrato.corpo_contrato || "",
        // Novos Campos
        tipo_garantia: contrato.tipo_garantia || "",
        tipo_renovacao: contrato.tipo_renovacao || "Tempo Indeterminado",
        // Mapear JSON de volta para o form
        fiador_nome: dadosGarantia.nome || "",
        fiador_telefone: dadosGarantia.telefone || "",
        fiador_documento: dadosGarantia.documento || "",
      });
    }
  }, [contrato, loadOptions]);

  /* =============================
      AUTO-PREENCHIMENTO FINANCEIRO
   ============================== */
  useEffect(() => {
    if (!imovelSelecionado) return;

    if (form.tipo === "locacao") {
      if (imovelSelecionado.comissao_locacao_percent != null) {
        setForm((prev) => ({
          ...prev,
          taxa_administracao_percent: imovelSelecionado.comissao_locacao_percent,
        }));
      }
    }

    if (form.tipo === "venda") {
      if (imovelSelecionado.comissao_venda_percent != null) {
        setForm((prev) => ({
          ...prev,
          taxa_administracao_percent: imovelSelecionado.comissao_venda_percent,
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
      SAVE LOGIC
   ============================== */
  const handleSave = async () => {
    try {
      setSaving(true);

      // Validações básicas
      if (!form.imovel_id) return toast.error("Selecione o imóvel");
      if (!form.proprietario_id) return toast.error("Selecione o proprietário");
      if (form.tipo === "locacao" && !form.inquilino_id) {
        return toast.error("Selecione o inquilino");
      }
      if (!form.data_inicio || !form.data_fim) return toast.error("Preencha as datas");

      // --- LÓGICA DE VALIDAÇÃO CPF/CNPJ (LOCATARIO_PJ) ---
      let locatario_pj = false;
      
      if (form.inquilino_id) {
        const inquilinoData = pessoas.find(p => p.id === form.inquilino_id);
        
        // Remove tudo que não for número para contar caracteres
        // Atenção: O objeto 'pessoas' precisa ter o campo 'documento' vindo da API
        const documentoLimpo = inquilinoData?.documento 
          ? String(inquilinoData.documento).replace(/\D/g, "") 
          : "";

        // Se tiver mais que 11 caracteres (ex: 14), consideramos CNPJ (True)
        // Se tiver 11 ou menos, CPF (False)
        if (documentoLimpo.length > 11) {
          locatario_pj = true;
        } else {
          locatario_pj = false;
        }
      }

      // --- LÓGICA DE GARANTIA (JSON) ---
      let dados_garantia = {};
      
      if (form.tipo_garantia === "Fiador") {
        if (!form.fiador_nome || !form.fiador_documento) {
            return toast.error("Preencha nome e documento do Fiador");
        }
        dados_garantia = {
            nome: form.fiador_nome,
            telefone: form.fiador_telefone,
            documento: form.fiador_documento
        };
      }

      // Payload final
      const payload = {
        tipo: form.tipo,
        imovel_id: form.imovel_id,
        proprietario_id: form.proprietario_id,
        inquilino_id: form.inquilino_id,
        corretor_venda_id: form.corretor_venda_id,
        valor_acordado: Number(form.valor_acordado),
        taxa_administracao_percent: form.taxa_administracao_percent ? Number(form.taxa_administracao_percent) : null,
        dia_vencimento_aluguel: form.dia_vencimento_aluguel,
        indice_reajuste: form.indice_reajuste,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        template_id: form.template_id,
        corpo_contrato: form.corpo_contrato,
        // Novos campos processados
        tipo_garantia: form.tipo_garantia,
        tipo_renovacao: form.tipo_renovacao,
        locatario_pj: locatario_pj,
        dados_garantia: dados_garantia
      };

      if (form.tipo !== "locacao") payload.inquilino_id = null;
      if (form.tipo !== "venda") payload.corretor_venda_id = null;

      const method = contrato ? "PATCH" : "POST";
      
      // Se for edição, precisamos enviar o ID junto, mas o POST não precisa
      const bodyPayload = contrato ? { id: contrato.id, ...payload } : payload;

      const res = await fetch("/api/contratos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
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
      <h4 className="font-semibold text-sm mb-4 tracking-wide">Participantes</h4>
      
      {form.tipo === "venda" && (
        <Field label="Corretor da Venda">
          <SearchableSelect
            value={form.corretor_venda_id}
            onChange={(v) => updateField("corretor_venda_id", v)}
            options={corretores.map((c) => ({ value: c.id, label: c.nome_completo }))}
          />
        </Field>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Proprietário">
          <SearchableSelect
            value={form.proprietario_id}
            onChange={(v) => updateField("proprietario_id", v)}
            options={pessoas.map((p) => ({ value: p.id, label: p.nome }))}
          />
        </Field>

        {form.tipo === "locacao" && (
          <Field label="Inquilino">
            <SearchableSelect
              value={form.inquilino_id}
              onChange={(v) => updateField("inquilino_id", v)}
              options={pessoas.map((p) => ({ value: p.id, label: p.nome }))}
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
            label: `${i.codigo_ref} - ${i.titulo}`,
          }))}
        />
      </Field>

      {/* DADOS DO CONTRATO DE LOCAÇÃO ESPECÍFICOS */}
      {form.tipo === "locacao" && (
        <>
            <h4 className="font-semibold text-sm mb-4 tracking-wide mt-6">Garantia e Renovação</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Garantia */}
                <Field label="Tipo de Garantia">
                    <Select
                        value={form.tipo_garantia}
                        onChange={(e) => updateField("tipo_garantia", e.target.value)}
                    >
                        <option value="">Selecione...</option>
                        {TIPOS_GARANTIA.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </Select>
                </Field>

                {/* Tipo de Renovação */}
                <Field label="Tipo de Renovação">
                    <Select
                        value={form.tipo_renovacao}
                        onChange={(e) => updateField("tipo_renovacao", e.target.value)}
                    >
                        <option value="Tempo Indeterminado">Tempo Indeterminado</option>
                        <option value="Aditivo">Aditivo</option>
                    </Select>
                </Field>
            </div>

            {/* CAMPOS ESPECÍFICOS SE FOR FIADOR */}
            {form.tipo_garantia === "Fiador" && (
                <Card className="p-4">
                    <h5 className="text-xs font-bold uppercase text-gray-500 mb-3">Dados do Fiador</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field label="Nome do Fiador">
                            <Input 
                                value={form.fiador_nome}
                                onChange={(e) => updateField("fiador_nome", e.target.value)}
                                placeholder="Nome completo"
                            />
                        </Field>
                        <Field label="CPF/CNPJ do Fiador">
                            <Input 
                                value={form.fiador_documento}
                                onChange={(e) => updateField("fiador_documento", e.target.value)}
                                placeholder="Apenas números"
                            />
                        </Field>
                        <Field label="Telefone">
                            <Input 
                                value={form.fiador_telefone}
                                onChange={(e) => updateField("fiador_telefone", e.target.value)}
                                placeholder="(00) 00000-0000"
                            />
                        </Field>
                    </div>
                </Card>
            )}
        </>
      )}

      {/* FINANCEIRO */}
      <h4 className="font-semibold text-sm mb-4 tracking-wide mt-6">Financeiro</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Valor do Contrato (R$)">
          <Input
            type="number"
            value={form.valor_acordado}
            onChange={(e) => updateField("valor_acordado", e.target.value)}
          />
        </Field>
        
        <Field label={form.tipo === "venda" ? "% Comissão" : "% Taxa de Administração"}>
          <Input
            type="number"
            value={form.taxa_administracao_percent}
            onChange={(e) => updateField("taxa_administracao_percent", e.target.value)}
          />
        </Field>

        {form.tipo === "locacao" && (
            <>
                <Field label="Dia de Vencimento">
                <Input
                    type="number"
                    value={form.dia_vencimento_aluguel}
                    onChange={(e) => updateField("dia_vencimento_aluguel", Number(e.target.value))}
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

      {/* VIGÊNCIA */}
      <h4 className="font-semibold text-sm mb-4 tracking-wide mt-6">Vigência</h4>
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

      {/* TEMPLATE (Movi para o final pois é menos prioritário que a garantia) */}
      <div className="mt-6 border-t pt-6">
        <Field label="Modelo de Contrato (Preenche o corpo automaticamente)">
            <Select
            value={form.template_id}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            >
            <option value="">Selecione um modelo...</option>
            {templates.map((t) => (
                <option key={t.id} value={t.id}>
                {t.nome} ({t.tipo})
                </option>
            ))}
            </Select>
        </Field>

        {form.corpo_contrato && (
            <div className="mt-4">
            <Label className="text-xs tracking-wide">Corpo do Contrato (editável)</Label>
            <Textarea
                className="min-h-[260px] font-mono text-sm"
                value={form.corpo_contrato}
                onChange={(e) => updateField("corpo_contrato", e.target.value)}
            />
            </div>
        )}
      </div>

      {/* BOTÕES */}
      <div className="flex justify-end gap-2 mt-8">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          {saving && <Loader2 className="animate-spin" size={16} />}
          Salvar
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs tracking-wide">{label}</Label>
      {children}
    </div>
  );
}