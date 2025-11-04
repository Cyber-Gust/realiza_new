//src/components/perfis/PerfilFormEquipe.jsx

"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Input from "@/components/admin/forms/Input";
import Toast from "@/components/admin/ui/Toast";

// Enums inline
const PERSONA_TIPOS = ["proprietario", "inquilino", "cliente"];

export default function PerfilFormPersonas({ onSuccess }) {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    tipo: "proprietario",
    endereco_json: "",
    observacoes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      let payload = { ...form, type: "personas" };

      if (form.endereco_json) {
        try {
          payload.endereco_json = JSON.parse(form.endereco_json);
        } catch {
          throw new Error("Formato inválido de Endereço (use JSON válido)");
        }
      }

      const res = await fetch("/api/perfis/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      Toast.success("Cadastro criado com sucesso!");
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
      <Input label="CPF/CNPJ" value={form.cpf_cnpj} onChange={(e) => handleChange("cpf_cnpj", e.target.value)} />
      <label className="text-sm font-medium text-muted-foreground">Tipo</label>
      <select
        value={form.tipo}
        onChange={(e) => handleChange("tipo", e.target.value)}
        className="w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
      >
        {PERSONA_TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <Input
        label="Endereço (JSON)"
        value={form.endereco_json}
        onChange={(e) => handleChange("endereco_json", e.target.value)}
        placeholder='{"logradouro":"Rua A","numero":"100","bairro":"Centro"}'
      />
      <textarea
        placeholder="Observações"
        value={form.observacoes}
        onChange={(e) => handleChange("observacoes", e.target.value)}
        className="w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
        rows={3}
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </div>
  );
}
