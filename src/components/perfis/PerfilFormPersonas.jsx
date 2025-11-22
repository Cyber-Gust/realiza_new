"use client";

import { useState } from "react";

// Componentes certos
import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Textarea, Select } from "@/components/admin/ui/Form";

// Toast Context
import { useToast } from "@/contexts/ToastContext";

const PERSONA_TIPOS = ["proprietario", "inquilino", "cliente"];

export default function PerfilFormPersonas({
  onSuccess,
  modo = "create",
  dadosIniciais = {},
}) {
  const { success, error } = useToast();

  const [form, setForm] = useState({
    id: dadosIniciais.id || null,
    nome: dadosIniciais.nome || "",
    email: dadosIniciais.email || "",
    telefone: dadosIniciais.telefone || "",
    cpf_cnpj: dadosIniciais.cpf_cnpj || "",
    tipo: dadosIniciais.tipo || "proprietario",
    endereco_json: dadosIniciais.endereco_json
      ? JSON.stringify(dadosIniciais.endereco_json, null, 2)
      : "",
    observacoes: dadosIniciais.observacoes || "",
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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

      const url =
        modo === "edit" ? "/api/perfis/update" : "/api/perfis/create";
      const method = modo === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      success(
        modo === "edit"
          ? "Cadastro atualizado com sucesso!"
          : "Cadastro criado com sucesso!"
      );

      onSuccess?.();
    } catch (err) {
      error("Erro", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Nome */}
      <div>
        <Label>Nome</Label>
        <Input
          value={form.nome}
          onChange={(e) => handleChange("nome", e.target.value)}
        />
      </div>

      {/* E-mail */}
      <div>
        <Label>E-mail</Label>
        <Input
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
        />
      </div>

      {/* Telefone */}
      <div>
        <Label>Telefone</Label>
        <Input
          value={form.telefone}
          onChange={(e) => handleChange("telefone", e.target.value)}
        />
      </div>

      {/* CPF/CNPJ */}
      <div>
        <Label>CPF/CNPJ</Label>
        <Input
          value={form.cpf_cnpj}
          onChange={(e) => handleChange("cpf_cnpj", e.target.value)}
        />
      </div>

      {/* Tipo */}
      <div>
        <Label>Tipo</Label>
        <Select
          value={form.tipo}
          onChange={(e) => handleChange("tipo", e.target.value)}
        >
          {PERSONA_TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </div>

      {/* Endereço */}
      <div>
        <Label>Endereço (JSON)</Label>
        <Textarea
          value={form.endereco_json}
          onChange={(e) => handleChange("endereco_json", e.target.value)}
          placeholder='{"logradouro":"Rua A","numero":"100","bairro":"Centro"}'
          rows={3}
        />
      </div>

      {/* Observações */}
      <div>
        <Label>Observações</Label>
        <Textarea
          value={form.observacoes}
          onChange={(e) => handleChange("observacoes", e.target.value)}
          placeholder="Observações gerais..."
          rows={3}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving
            ? "Salvando..."
            : modo === "edit"
            ? "Salvar alterações"
            : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
