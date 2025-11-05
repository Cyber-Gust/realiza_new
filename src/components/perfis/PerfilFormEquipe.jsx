"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Input from "@/components/admin/forms/Input";
import Toast from "@/components/admin/ui/Toast";

const USER_ROLES = ["admin", "corretor"];

export default function PerfilFormEquipe({
  onSuccess,
  modo = "create",
  dadosIniciais = {},
  readOnly = false, // 👈 nova prop
}) {
  const [form, setForm] = useState({
    id: dadosIniciais.id || null,
    nome_completo: dadosIniciais.nome_completo || "",
    email: dadosIniciais.email || "",
    telefone: dadosIniciais.telefone || "",
    cpf_cnpj: dadosIniciais.cpf_cnpj || "",
    creci: dadosIniciais.creci || "",
    role: dadosIniciais.role || "corretor",
    dados_bancarios_json: dadosIniciais.dados_bancarios_json
      ? JSON.stringify(dadosIniciais.dados_bancarios_json, null, 2)
      : "",
  });

  const [saving, setSaving] = useState(false);
  const handleChange = (key, value) => {
    if (readOnly) return; // 🚫 bloqueia edição
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (readOnly) return; // segurança adicional
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
      const url = modo === "edit" ? "/api/perfis/update" : "/api/perfis/create";
      const method = modo === "edit" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      Toast.success(modo === "edit" ? "Perfil atualizado!" : "Perfil criado!");
      onSuccess?.();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Input label="Nome completo" value={form.nome_completo} disabled={readOnly}
        onChange={(e) => handleChange("nome_completo", e.target.value)} />
      <Input label="E-mail" value={form.email} type="email" disabled={readOnly}
        onChange={(e) => handleChange("email", e.target.value)} />
      <Input label="Telefone" value={form.telefone} disabled={readOnly}
        onChange={(e) => handleChange("telefone", e.target.value)} />
      <Input label="CPF/CNPJ" value={form.cpf_cnpj} disabled={readOnly}
        onChange={(e) => handleChange("cpf_cnpj", e.target.value)} />
      <Input label="CRECI" value={form.creci} disabled={readOnly}
        onChange={(e) => handleChange("creci", e.target.value)} />

      <label className="text-sm font-medium text-muted-foreground">Função</label>
      <select value={form.role} disabled className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm">
        <option>{form.role}</option>
      </select>

      <Input label="Dados Bancários (JSON)" value={form.dados_bancarios_json} disabled={readOnly}
        onChange={(e) => handleChange("dados_bancarios_json", e.target.value)} />

      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : modo === "edit" ? "Salvar alterações" : "Salvar"}
          </Button>
        </div>
      )}
    </div>
  );
}
