"use client";
import { useEffect, useMemo, useState } from "react";

import {
  Input,
  Textarea,
  Select,
  Label,
} from "@/components/admin/ui/Form";
import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import SearchableSelect from "@/components/admin/ui/SearchableSelect"; 


/* ============================================================
   Helpers BRL
============================================================ */
const BRL = (v) =>
  (v ?? "")
    .toString()
    .replace(/[^\d]/g, "")
    .replace(/^0+/, "")
    .padStart(1, "0")
    .replace(/(\d{1,})(\d{2})$/, "$1,$2")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const unBRL = (v) =>
  Number(String(v || "0").replace(/\./g, "").replace(",", ".")) || 0;

const GARANTIA_OPTIONS = ["Fiador", "Seguro Fiança", "Caução", "Carta Fiança", "Outros"];
const ORIGEM_OPTIONS = ["Presencial", "WhatsApp", "Telefone", "Instagram"];
const TIPO_PAGAMENTO_OPTIONS = ["À Vista", "Financiamento", "Parcelado Direto", "Aluguel"];

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente" },
  { value: "aceita", label: "Aceita" },
  { value: "recusada", label: "Recusada" },
  { value: "contraproposta", label: "Contraproposta" },
];

export default function CRMPropostaForm({ onSaved, onClose, proposta = null }) {
  const toast = useToast();

  const [form, setForm] = useState({
    imovel_id: proposta?.imovel_id || "",
    lead_id: proposta?.lead_id || "",
    persona_id: proposta?.persona_id || "",
    corretor_id: proposta?.corretor_id || "",
    valor_proposta: proposta ? String(proposta.valor_proposta * 100) : "",
    condicao_garantia: proposta?.condicao_garantia || "",
    observacoes: proposta?.observacoes || "",
    status: proposta?.status || "pendente",

    origem_proposta: proposta?.origem_proposta || "",
    tipo_pagamento: proposta?.tipo_pagamento || "",
    entrada: proposta ? String((proposta.entrada || 0) * 100) : "",
    parcelas: proposta?.parcelas || "",
    data_validade: proposta?.data_validade?.split("T")[0] || "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [imoveis, setImoveis] = useState([]);
  const [leads, setLeads] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [corretores, setCorretores] = useState([]);

  const setValue = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ============================================================
     LOAD LISTS via /crm/propostas?bootstrap=1
  ============================================================ */
  useEffect(() => {
    const loadLists = async () => {
      try {
        setLoadingData(true);

        const res = await fetch("/api/crm/propostas?bootstrap=1");
        const json = await res.json();

        if (!json.boot) throw new Error("Resposta inválida");

        setImoveis(json.boot.imoveis);
        setLeads(json.boot.leads);
        setPersonas(json.boot.personas);
        setCorretores(json.boot.corretores);

      } catch (err) {
        toast.error("Erro ao carregar listas: " + err.message);
      } finally {
        setLoadingData(false);
      }
    };

    loadLists();
  }, []);

  /* ============================================================
     Mascara BRL
  ============================================================ */
  const valorMasked = useMemo(
    () => (form.valor_proposta ? BRL(form.valor_proposta) : ""),
    [form.valor_proposta]
  );

  const entradaMasked = useMemo(
    () => (form.entrada ? BRL(form.entrada) : ""),
    [form.entrada]
  );

  /* ============================================================
     SUBMIT
  ============================================================ */
  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!form.imovel_id) throw new Error("Selecione o imóvel.");
      if (!form.corretor_id) throw new Error("Selecione o corretor.");

      // lead OR persona
      if (!form.persona_id && !form.lead_id)
        throw new Error("Selecione um lead OU uma pessoa.");

      if (form.persona_id && form.lead_id)
        throw new Error("Escolha apenas lead OU pessoa — não ambos.");

      const payload = {
        ...form,
        valor_proposta: unBRL(BRL(form.valor_proposta)),
        entrada: form.entrada ? unBRL(BRL(form.entrada)) : null,
        parcelas: form.parcelas ? Number(form.parcelas) : null,
        data_validade: form.data_validade || null,
      };

      const method = proposta ? "PATCH" : "POST";

      const res = await fetch("/api/crm/propostas", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          proposta ? { id: proposta.id, ...payload } : payload
        ),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(`Proposta ${proposta ? "atualizada" : "criada"} com sucesso!`);

      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData)
    return (
      <p className="text-center text-sm text-muted-foreground py-4">
        Carregando dados...
      </p>
    );

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div className="space-y-4">

      {/* IMÓVEL */}
      <div>
        <Label>Imóvel</Label>
        <SearchableSelect
          value={form.imovel_id}
          onChange={(v) => setValue("imovel_id", v)}
          options={imoveis.map((i) => ({
            value: String(i.id),
            label: i.titulo || i.endereco_bairro
          }))}
        />
      </div>

      {/* LEAD */}
      <div>
        <Label>Lead (opcional)</Label>
        <SearchableSelect
          value={form.lead_id}
          onChange={(v) => setValue("lead_id", v)}
          options={leads.map((l) => ({
            value: String(l.id),
            label: l.nome
          }))}
          className={form.persona_id ? "opacity-50 pointer-events-none" : ""}
        />
      </div>

      {/* PERSONA */}
      <div>
        <Label>Pessoa</Label>
        <SearchableSelect
          value={form.persona_id}
          onChange={(v) => setValue("persona_id", v)}
          options={personas.map((p) => ({
            value: String(p.id),
            label: p.nome
          }))}
          className={form.lead_id ? "opacity-50 pointer-events-none" : ""}
        />
      </div>

      {/* CORRETOR */}
      <div>
        <Label>Corretor</Label>
        <SearchableSelect
          value={form.corretor_id}
          onChange={(v) => setValue("corretor_id", v)}
          options={corretores.map((c) => ({
            value: String(c.id),
            label: c.nome_completo
          }))}
        />
      </div>

      {/* VALOR */}
      <div>
        <Label>Valor da Proposta (R$)</Label>
        <Input
          inputMode="numeric"
          placeholder="0,00"
          value={valorMasked}
          onChange={(e) => {
            const onlyDigits = e.target.value.replace(/\D/g, "");
            setValue("valor_proposta", onlyDigits);
          }}
        />
      </div>

      {/* TIPO PAGAMENTO */}
      <div>
        <Label>Tipo de Pagamento</Label>
        <Select
          value={form.tipo_pagamento}
          onChange={(e) => setValue("tipo_pagamento", e.target.value)}
        >
          <option value="">Selecione</option>
          {TIPO_PAGAMENTO_OPTIONS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </div>

      {/* ENTRADA */}
      <div>
        <Label>Entrada (R$)</Label>
        <Input
          inputMode="numeric"
          placeholder="0,00"
          value={entradaMasked}
          onChange={(e) => {
            const onlyDigits = e.target.value.replace(/\D/g, "");
            setValue("entrada", onlyDigits);
          }}
        />
      </div>

      {/* PARCELAS */}
      <div>
        <Label>Parcelas</Label>
        <Input
          type="number"
          min="1"
          value={form.parcelas}
          onChange={(e) => setValue("parcelas", e.target.value)}
        />
      </div>

      {/* DATA VALIDADE */}
      <div>
        <Label>Data de Validade</Label>
        <Input
          type="date"
          value={form.data_validade}
          onChange={(e) => setValue("data_validade", e.target.value)}
        />
      </div>

      {/* GARANTIA */}
      <div>
        <Label>Garantia</Label>
        <Select
          value={form.condicao_garantia}
          onChange={(e) => setValue("condicao_garantia", e.target.value)}
        >
          <option value="">Selecione</option>
          {GARANTIA_OPTIONS.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </Select>
      </div>

      {/* ORIGEM */}
      <div>
        <Label>Origem da Proposta</Label>
        <Select
          value={form.origem_proposta}
          onChange={(e) => setValue("origem_proposta", e.target.value)}
        >
          <option value="">Selecione</option>
          {ORIGEM_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </Select>
      </div>

      {/* STATUS */}
      <div>
        <Label>Status</Label>
        <Select
          value={form.status}
          onChange={(e) => setValue("status", e.target.value)}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      {/* OBSERVAÇÕES */}
      <div>
        <Label>Observações</Label>
        <Textarea
          rows={4}
          value={form.observacoes}
          onChange={(e) => setValue("observacoes", e.target.value)}
          placeholder="Observações adicionais..."
        />
      </div>

      <Button
        className="w-full h-11 text-sm"
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading ? "Salvando..." : proposta ? "Atualizar Proposta" : "Salvar Proposta"}
      </Button>

    </div>
  );
}
