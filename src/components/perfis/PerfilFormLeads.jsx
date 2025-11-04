//src/components/perfis/PerfilFormEquipe.jsx

"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Input from "@/components/admin/forms/Input";
import Toast from "@/components/admin/ui/Toast";

// Enums inline
const LEAD_STATUS = [
  "novo",
  "qualificado",
  "visita_agendada",
  "proposta_feita",
  "documentacao",
  "concluido",
  "perdido",
];

export default function PerfilFormLeads({ onSuccess }) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    status: "novo",
    origem: "",
    perfil_busca_json: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      let payload = { ...form, type: "leads" };

      if (form.perfil_busca_json) {
        try {
          payload.perfil_busca_json = JSON.parse(form.perfil_busca_json);
        } catch {
          throw new Error("Formato inválido de Preferências (use JSON válido)");
        }
      }

      const res = await fetch("/api/perfis/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      Toast.success("Lead cadastrado com sucesso!");
      onSuccess?.();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Input label="Nome" value={form.nome} onChange={(e) => handleChange("nome", e.target.value)} />
      <Input label="E-mail" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
      <Input label="Telefone" value={form.telefone} onChange={(e) => handleChange("telefone", e.target.value)} />
      <label className="text-sm font-medium text-muted-foreground">Status</label>
      <select
        value={form.status}
        onChange={(e) => handleChange("status", e.target.value)}
        className="w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
      >
        {LEAD_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <Input label="Origem" placeholder="WhatsApp, Site, Indicação..." value={form.origem} onChange={(e) => handleChange("origem", e.target.value)} />
      <Input
        label="Preferências (JSON)"
        value={form.perfil_busca_json}
        onChange={(e) => handleChange("perfil_busca_json", e.target.value)}
        placeholder='{"tipo":"apartamento","faixa_preco":"500000"}'
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </div>
  );
}
