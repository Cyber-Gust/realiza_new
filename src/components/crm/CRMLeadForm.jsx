"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/admin/forms/Select";
import Toast from "@/components/admin/ui/Toast";
import { cn } from "@/lib/utils";

export default function CRMLeadForm({ onSaved, onClose, lead = null }) {
  const [form, setForm] = useState({
    nome: lead?.nome || "",
    email: lead?.email || "",
    telefone: lead?.telefone || "",
    origem: lead?.origem || "",
    status: lead?.status || "novo",
    corretor_id: lead?.corretor_id || "",
    perfil_busca_json: lead?.perfil_busca_json || {},
  });

  const [loading, setLoading] = useState(false);
  const [corretores, setCorretores] = useState([]);
  const [jsonError, setJsonError] = useState(false);

  // 🔹 Carrega corretores
  useEffect(() => {
    const loadCorretores = async () => {
      try {
        const res = await fetch("/api/perfis/list?type=equipe", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setCorretores(json.data || []);
      } catch (err) {
        Toast.error("Erro ao carregar corretores: " + err.message);
      }
    };
    loadCorretores();
  }, []);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const cleanPayload = (obj) => {
    const cleaned = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== "" && value !== null && value !== undefined) cleaned[key] = value;
    });
    return cleaned;
  };

  const handleSubmit = async () => {
    if (!form.nome || !form.telefone) return Toast.error("Nome e telefone são obrigatórios!");
    if (jsonError) return Toast.error("Corrija o JSON antes de salvar!");

    setLoading(true);
    try {
      const isEdit = !!lead?.id;
      const payload = cleanPayload({
        type: "leads",
        ...form,
        ...(isEdit ? { id: lead.id } : {}),
      });

      const url = isEdit ? "/api/perfis/update" : "/api/perfis/create";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar lead");

      Toast.success(`Lead ${isEdit ? "atualizado" : "criado"} com sucesso!`);
      onSaved?.(json.data);
      onClose?.();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {["nome", "email", "telefone", "origem"].map((field) => (
        <input
          key={field}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          value={form[field]}
          onChange={(e) => handleChange(field, e.target.value)}
          className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
        />
      ))}

      {/* SELEÇÃO DO CORRETOR */}
      <Select
        label="Corretor Responsável"
        value={form.corretor_id}
        onChange={(e) => handleChange("corretor_id", e?.target?.value || e)}
        options={corretores.map((c) => ({
          label: c.nome_completo,
          value: c.id,
        }))}
        placeholder="Selecione o corretor"
      />

      {/* STATUS */}
      <select
        value={form.status}
        onChange={(e) => handleChange("status", e.target.value)}
        className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
      >
        {[
          "novo",
          "qualificado",
          "visita_agendada",
          "proposta_feita",
          "documentacao",
          "concluido",
          "perdido",
        ].map((s) => (
          <option key={s} value={s}>
            {s.replaceAll("_", " ").toUpperCase()}
          </option>
        ))}
      </select>

      {/* PERFIL DE BUSCA */}
      <textarea
        placeholder={`Perfil de busca (JSON)\nExemplo:\n{\n  "bairro": "Centro",\n  "min_preco": 200000\n}`}
        value={JSON.stringify(form.perfil_busca_json, null, 2)}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            setJsonError(false);
            handleChange("perfil_busca_json", parsed);
          } catch {
            setJsonError(true);
          }
        }}
        className={cn(
          "w-full border rounded-md p-2 bg-panel-card text-xs font-mono resize-none",
          jsonError ? "border-red-500" : "border-border"
        )}
        rows={5}
      />
      {jsonError && <p className="text-xs text-red-500">JSON inválido.</p>}

      <Button className="w-full" disabled={loading || jsonError} onClick={handleSubmit}>
        {loading ? "Salvando..." : lead ? "Atualizar Lead" : "Salvar Lead"}
      </Button>
    </div>
  );
}
