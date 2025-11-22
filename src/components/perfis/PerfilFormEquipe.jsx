"use client";
import { useState } from "react";

// Componentes certos
import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Select } from "@/components/admin/ui/Form";

// Toast context
import { useToast } from "@/contexts/ToastContext";

const USER_ROLES = ["admin", "corretor"];

export default function PerfilFormEquipe({
  onSuccess,
  modo = "create",
  dadosIniciais = {},
  readOnly = false,
}) {
  const { success, error } = useToast();

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
    if (readOnly) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (readOnly) return;

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

      success(modo === "edit" ? "Perfil atualizado!" : "Perfil criado!");
      onSuccess?.();
    } catch (err) {
      error("Erro", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Nome completo</Label>
        <Input
          value={form.nome_completo}
          disabled={readOnly}
          onChange={(e) => handleChange("nome_completo", e.target.value)}
        />
      </div>

      <div>
        <Label>E-mail</Label>
        <Input
          type="email"
          value={form.email}
          disabled={readOnly}
          onChange={(e) => handleChange("email", e.target.value)}
        />
      </div>

      <div>
        <Label>Telefone</Label>
        <Input
          value={form.telefone}
          disabled={readOnly}
          onChange={(e) => handleChange("telefone", e.target.value)}
        />
      </div>

      <div>
        <Label>CPF/CNPJ</Label>
        <Input
          value={form.cpf_cnpj}
          disabled={readOnly}
          onChange={(e) => handleChange("cpf_cnpj", e.target.value)}
        />
      </div>

      <div>
        <Label>CRECI</Label>
        <Input
          value={form.creci}
          disabled={readOnly}
          onChange={(e) => handleChange("creci", e.target.value)}
        />
      </div>

      {/* Função */}
      <div>
        <Label>Função</Label>
        <Select
          value={form.role}
          disabled={true} // segue tua regra
        >
          <option>{form.role}</option>
        </Select>
      </div>

      {/* Dados bancários */}
      <div>
        <Label>Dados Bancários (JSON)</Label>
        <Input
          value={form.dados_bancarios_json}
          disabled={readOnly}
          onChange={(e) =>
            handleChange("dados_bancarios_json", e.target.value)
          }
        />
      </div>

      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? "Salvando..."
              : modo === "edit"
              ? "Salvar alterações"
              : "Salvar"}
          </Button>
        </div>
      )}
    </div>
  );
}
