"use client";
import { useEffect, useMemo, useState } from "react";

import { Input, Textarea, Select, Label, FormError } from "@/components/admin/ui/Form";
import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/contexts/ToastContext";

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

const GARANTIA_OPTIONS = [
  "Fiador",
  "Seguro Fiança",
  "Caução",
  "Carta Fiança",
  "Outros",
];

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
    corretor_id: proposta?.corretor_id || "",
    valor_proposta: proposta?.valor_proposta || "",
    condicao_garantia: proposta?.condicao_garantia || "",
    observacoes: proposta?.observacoes || "",
    status: proposta?.status || "pendente",
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [imoveis, setImoveis] = useState([]);
  const [leads, setLeads] = useState([]);
  const [corretores, setCorretores] = useState([]);

  const setValue = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ============================================================
     Load lists
  ============================================================ */
  useEffect(() => {
    const loadLists = async () => {
      try {
        setLoadingData(true);

        const [imoveisRes, leadsRes, corretoresRes] = await Promise.all([
          fetch("/api/imoveis/list", { cache: "no-store" }),
          fetch("/api/perfis/list?type=leads", { cache: "no-store" }),
          fetch("/api/perfis/list?type=equipe", { cache: "no-store" }),
        ]);

        const [imoveisJson, leadsJson, corretoresJson] = await Promise.all([
          imoveisRes.json(),
          leadsRes.json(),
          corretoresRes.json(),
        ]);

        if (!imoveisRes.ok) throw new Error(imoveisJson.error);
        if (!leadsRes.ok) throw new Error(leadsJson.error);
        if (!corretoresRes.ok) throw new Error(corretoresJson.error);

        setImoveis(imoveisJson.data || []);
        setLeads(leadsJson.data || []);
        setCorretores(corretoresJson.data || []);
      } catch (err) {
        toast.error("Erro ao carregar listas: " + err.message);
      } finally {
        setLoadingData(false);
      }
    };

    loadLists();
  }, [toast]);

  /* ============================================================
     Máscara (BRL)
  ============================================================ */
  const valorMasked = useMemo(
    () => (form.valor_proposta ? BRL(form.valor_proposta) : ""),
    [form.valor_proposta]
  );

  /* ============================================================
     Submit
  ============================================================ */
  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!form.imovel_id || !form.lead_id || !form.corretor_id)
        throw new Error("Selecione imóvel, lead e corretor.");

      const valor = unBRL(form.valor_proposta);
      if (valor <= 0) throw new Error("Valor da proposta inválido.");

      const payload = { ...form, valor_proposta: valor };
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

      toast.success(
        `Proposta ${proposta ? "atualizada" : "criada"} com sucesso!`
      );

      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     Loading das listas
  ============================================================ */
  if (loadingData)
    return (
      <p className="text-center text-sm text-muted-foreground py-4">
        Carregando listas...
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
        <Select
          value={form.imovel_id}
          onChange={(e) => setValue("imovel_id", e.target.value)}
        >
          <option value="">Selecione</option>
          {imoveis.map((i) => (
            <option key={i.id} value={i.id}>
              {i.titulo || i.endereco_bairro || `Imóvel ${i.id}`}
            </option>
          ))}
        </Select>
      </div>

      {/* LEAD */}
      <div>
        <Label>Lead</Label>
        <Select
          value={form.lead_id}
          onChange={(e) => setValue("lead_id", e.target.value)}
        >
          <option value="">Selecione</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome || l.telefone}
            </option>
          ))}
        </Select>
      </div>

      {/* CORRETOR */}
      <div>
        <Label>Corretor</Label>
        <Select
          value={form.corretor_id}
          onChange={(e) => setValue("corretor_id", e.target.value)}
        >
          <option value="">Selecione</option>
          {corretores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome_completo}
            </option>
          ))}
        </Select>
      </div>

      {/* VALOR */}
      <div>
        <Label>Valor da Proposta (R$)</Label>
        <Input
          inputMode="numeric"
          placeholder="0,00"
          value={valorMasked}
          onChange={(e) => setValue("valor_proposta", e.target.value)}
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
          className="bg-panel-card"
          placeholder="Observações adicionais..."
        />
      </div>

      <Button
        className="w-full h-11 text-sm"
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading
          ? "Salvando..."
          : proposta
          ? "Atualizar Proposta"
          : "Salvar Proposta"}
      </Button>
    </div>
  );
}
