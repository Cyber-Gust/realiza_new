"use client";

import { useState } from "react";

// UI
import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Textarea, Select } from "@/components/admin/ui/Form";

// Toast
import { useToast } from "@/contexts/ToastContext";

const PERSONA_TIPOS = ["proprietario", "inquilino"];

export default function PerfilFormPersonas({
  onSuccess,
  modo = "create",
  dadosIniciais = {},
  readOnly = false,
}) {
  const { success, error } = useToast();

  const [form, setForm] = useState({
    id: dadosIniciais.id || null,

    // Dados (Obrigatórios)
    nome: dadosIniciais.nome || "",
    telefone: dadosIniciais.telefone || "",
    cpf_cnpj: dadosIniciais.cpf_cnpj || "",

    email: dadosIniciais.email || "",
    tipo: dadosIniciais.tipo || "proprietario",

    data_nascimento: dadosIniciais.data_nascimento || "",
    rg: dadosIniciais.rg || "",
    estado_civil: dadosIniciais.estado_civil || "",
    profissao: dadosIniciais.profissao || "",

    // Endereço
    endereco_cep: dadosIniciais.endereco_cep || "",
    endereco_logradouro: dadosIniciais.endereco_logradouro || "",
    endereco_numero: dadosIniciais.endereco_numero || "",
    endereco_bairro: dadosIniciais.endereco_bairro || "",
    endereco_cidade: dadosIniciais.endereco_cidade || "",
    endereco_estado: dadosIniciais.endereco_estado || "",

    // Extras CRM
    origem: dadosIniciais.origem || "",
    tags: dadosIniciais.tags?.join(", ") || "",
    observacoes: dadosIniciais.observacoes || "",

    ativo: dadosIniciais.ativo ?? true,
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => {
    if (readOnly) return;
    setForm((p) => ({ ...p, [key]: value }));
  };

  // CEP AUTO-PREENCHER
  const handleCepBlur = async () => {
    const cep = form.endereco_cep.replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const json = await res.json();
      if (json.erro) return;

      setForm((p) => ({
        ...p,
        endereco_logradouro: json.logradouro || "",
        endereco_bairro: json.bairro || "",
        endereco_cidade: json.localidade || "",
        endereco_estado: json.uf || "",
      }));
    } catch (e) {
      console.error("Erro ao buscar CEP");
    }
  };

  const handleSave = async () => {
    if (readOnly) return;

    // Validação de obrigatórios
    if (!form.nome || !form.telefone || !form.cpf_cnpj) {
      error("Erro", "Nome, Telefone e CPF/CNPJ são obrigatórios.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        type: "personas",
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };

      const url = modo === "edit" ? "/api/perfis/update" : "/api/perfis/create";
      const method = modo === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      success(modo === "edit" ? "Cadastro atualizado!" : "Cadastro criado!");
      onSuccess?.();
    } catch (err) {
      error("Erro", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================= */}
      {/* DADOS PESSOAIS */}
      {/* ======================= */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Dados pessoais</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          <InputBlock required label="Nome" field="nome" form={form} handleChange={handleChange} readOnly={readOnly} />

          <div>
            <Label>Tipo</Label>
            <Select
              value={form.tipo}
              disabled={readOnly}
              onChange={(e) => handleChange("tipo", e.target.value)}
            >
              {PERSONA_TIPOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </div>

          <InputBlock required label="Telefone" field="telefone" form={form} handleChange={handleChange} readOnly={readOnly} />

          <InputBlock label="E-mail" field="email" form={form} handleChange={handleChange} readOnly={readOnly} />

          <InputBlock required label="CPF/CNPJ" field="cpf_cnpj" form={form} handleChange={handleChange} readOnly={readOnly} />

          <InputBlock
            label="Data de nascimento"
            field="data_nascimento"
            type="date"
            form={form}
            handleChange={handleChange}
            readOnly={readOnly}
          />

          <InputBlock label="RG" field="rg" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Estado civil" field="estado_civil" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Profissão" field="profissao" form={form} handleChange={handleChange} readOnly={readOnly} />
        </div>
      </div>

      {/* ======================= */}
      {/* ENDEREÇO */}
      {/* ======================= */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Endereço</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <Label>CEP</Label>
            <Input
              value={form.endereco_cep}
              disabled={readOnly}
              onChange={(e) => handleChange("endereco_cep", e.target.value)}
              onBlur={handleCepBlur}
            />
          </div>

          <InputBlock label="Logradouro" field="endereco_logradouro" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Número" field="endereco_numero" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Bairro" field="endereco_bairro" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Cidade" field="endereco_cidade" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Estado" field="endereco_estado" form={form} handleChange={handleChange} readOnly={readOnly} />
        </div>
      </div>

      {/* ======================= */}
      {/* CRM EXTRAS */}
      {/* ======================= */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Informações adicionais</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <InputBlock label="Origem" field="origem" form={form} handleChange={handleChange} readOnly={readOnly} />

          <div className="lg:col-span-3">
            <Label>Tags (separadas por vírgula)</Label>
            <Input
              value={form.tags}
              disabled={readOnly}
              onChange={(e) => handleChange("tags", e.target.value)}
            />
          </div>

          <div className="lg:col-span-3">
            <Label>Observações</Label>
            <Textarea
              rows={3}
              value={form.observacoes}
              disabled={readOnly}
              onChange={(e) => handleChange("observacoes", e.target.value)}
            />
          </div>
        </div>
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

/* Helper Component */
function InputBlock({ label, field, form, handleChange, readOnly, type = "text", required }) {
  return (
    <div>
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        type={type}
        value={form[field] || ""}
        disabled={readOnly}
        onChange={(e) => handleChange(field, e.target.value)}
      />
    </div>
  );
}
