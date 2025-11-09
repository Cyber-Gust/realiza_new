"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";

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
  const [imoveis, setImoveis] = useState([]);
  const [leads, setLeads] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // 🔹 Carrega listas dinâmicas
  useEffect(() => {
    const loadLists = async () => {
      try {
        setLoadingData(true);
        const [imoveisRes, leadsRes, corretoresRes] = await Promise.all([
          fetch("/api/crm/agenda/imoveis/list", { cache: "no-store" }),
          fetch("/api/perfis/list?type=leads", { cache: "no-store" }),
          fetch("/api/perfis/list?type=equipe", { cache: "no-store" }),
        ]);

        const [imoveisJson, leadsJson, corretoresJson] = await Promise.all([
          imoveisRes.json(),
          leadsRes.json(),
          corretoresRes.json(),
        ]);

        if (!imoveisRes.ok) throw new Error(imoveisJson.error || "Erro em /imoveis");
        if (!leadsRes.ok) throw new Error(leadsJson.error || "Erro em /leads");
        if (!corretoresRes.ok) throw new Error(corretoresJson.error || "Erro em /equipe");

        setImoveis(imoveisJson.data || []);
        setLeads(leadsJson.data || []);
        setCorretores(corretoresJson.data || []);
      } catch (err) {
        Toast.error("Erro ao carregar listas: " + err.message);
      } finally {
        setLoadingData(false);
      }
    };
    loadLists();
  }, []);

  const valorMasked = useMemo(
    () => (form.valor_proposta ? BRL(form.valor_proposta) : ""),
    [form.valor_proposta]
  );

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
        body: JSON.stringify(proposta ? { id: proposta.id, ...payload } : payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao salvar proposta.");

      Toast.success(`Proposta ${proposta ? "atualizada" : "criada"} com sucesso!`);
      onSaved?.();
      onClose?.();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData)
    return (
      <p className="text-center text-sm text-muted-foreground py-4">
        Carregando listas de imóveis, leads e corretores...
      </p>
    );

  return (
    <div className="space-y-3">
      {/* 🔹 Imóvel */}
      <select
        value={form.imovel_id}
        onChange={(e) => setForm({ ...form, imovel_id: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card"
      >
        <option value="">Selecione um imóvel</option>
        {imoveis.map((i) => (
          <option key={i.id} value={i.id}>
            {i.titulo || i.endereco_bairro || `Imóvel ${i.id}`}
          </option>
        ))}
      </select>

      {/* 🔹 Lead */}
      <select
        value={form.lead_id}
        onChange={(e) => setForm({ ...form, lead_id: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card"
      >
        <option value="">Selecione um lead</option>
        {leads.map((l) => (
          <option key={l.id} value={l.id}>
            {l.nome || l.telefone || l.email}
          </option>
        ))}
      </select>

      {/* 🔹 Corretor */}
      <select
        value={form.corretor_id}
        onChange={(e) => setForm({ ...form, corretor_id: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card"
      >
        <option value="">Selecione o corretor</option>
        {corretores.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nome_completo} ({c.role})
          </option>
        ))}
      </select>

      {/* 🔹 Valor */}
      <input
        inputMode="numeric"
        placeholder="VALOR (R$)"
        value={valorMasked}
        onChange={(e) => setForm({ ...form, valor_proposta: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card"
      />

      {/* 🔹 Garantia */}
      <select
        value={form.condicao_garantia}
        onChange={(e) => setForm({ ...form, condicao_garantia: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card"
      >
        <option value="">Condição de Garantia</option>
        {GARANTIA_OPTIONS.map((g) => (
          <option key={g}>{g}</option>
        ))}
      </select>

      {/* 🔹 Status */}
      <select
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {/* 🔹 Observações */}
      <textarea
        placeholder="Observações"
        value={form.observacoes}
        onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
        rows={3}
      />

      <Button className="w-full" disabled={loading} onClick={handleSubmit}>
        {loading ? "Salvando..." : proposta ? "Atualizar" : "Salvar Proposta"}
      </Button>
    </div>
  );
}
