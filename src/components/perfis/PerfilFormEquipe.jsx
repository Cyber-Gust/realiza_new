//src/components/perfis/PerfilFormEquipe.jsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Input from "@/components/admin/forms/Input";
import Toast from "@/components/admin/ui/Toast";

// Enums inline
const USER_ROLES = ["admin", "corretor"];

export default function PerfilFormEquipe({ onSuccess }) {
  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    creci: "",
    role: "corretor",
    dados_bancarios_json: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      let payload = { ...form, type: "equipe" };

      if (form.dados_bancarios_json) {
        try {
          payload.dados_bancarios_json = JSON.parse(form.dados_bancarios_json);
        } catch {
          throw new Error("Formato inválido de Dados Bancários (use JSON válido)");
        }
      }

      const res = await fetch("/api/perfis/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      Toast.success("Perfil criado com sucesso!");
      onSuccess?.();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Input label="Nome completo" value={form.nome_completo} onChange={(e) => handleChange("nome_completo", e.target.value)} />
      <Input label="E-mail" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
      <Input label="Telefone" value={form.telefone} onChange={(e) => handleChange("telefone", e.target.value)} />
      <Input label="CPF/CNPJ" value={form.cpf_cnpj} onChange={(e) => handleChange("cpf_cnpj", e.target.value)} />
      <Input label="CRECI" value={form.creci} onChange={(e) => handleChange("creci", e.target.value)} />
      <label className="text-sm font-medium text-muted-foreground">Função</label>
      <select
        value={form.role}
        onChange={(e) => handleChange("role", e.target.value)}
        className="w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
      >
        {USER_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <Input
        label="Dados Bancários (JSON)"
        value={form.dados_bancarios_json}
        onChange={(e) => handleChange("dados_bancarios_json", e.target.value)}
        placeholder='{"banco":"001","agencia":"1234","conta":"56789-0"}'
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </div>
  );
}
