"use client";

import { useState } from "react";

import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Textarea } from "@/components/admin/ui/Form";

import { useToast } from "@/contexts/ToastContext";

export default function PerfilFormCliente({
  onSuccess,
  modo = "create",
  dadosIniciais = {},
  readOnly = false,
}) {
  const { success, error } = useToast();

  const [form, setForm] = useState({
    id: dadosIniciais.id || null,

    // Dados pessoais
    nome: dadosIniciais.nome || "",
    email: dadosIniciais.email || "",
    telefone: dadosIniciais.telefone || "",
    cpf_cnpj: dadosIniciais.cpf_cnpj || "",
    data_nascimento: dadosIniciais.data_nascimento || "",
    estado_civil: dadosIniciais.estado_civil || "",
    profissao: dadosIniciais.profissao || "",

    // Endereço
    endereco_cep: dadosIniciais.endereco_cep || "",
    endereco_logradouro: dadosIniciais.endereco_logradouro || "",
    endereco_numero: dadosIniciais.endereco_numero || "",
    endereco_bairro: dadosIniciais.endereco_bairro || "",
    endereco_cidade: dadosIniciais.endereco_cidade || "",
    endereco_estado: dadosIniciais.endereco_estado || "",

    // CRM
    origem: dadosIniciais.origem || "",
    tags: dadosIniciais.tags?.join(", ") || "",
    observacoes: dadosIniciais.observacoes || "",

    ativo: dadosIniciais.ativo ?? true,

    // Tipo fixo
    tipo: "cliente",
  });

  const [saving, setSaving] = useState(false);

  // ============================================================
  // BUSCA AUTOMÁTICA DO CEP
  // ============================================================
  const buscarCEP = async (cep) => {
    try {
      const sanitized = cep.replace(/\D/g, "");
      if (sanitized.length !== 8) return;

      const res = await fetch(`https://viacep.com.br/ws/${sanitized}/json/`);
      const data = await res.json();

      if (data.erro) return;

      setForm((prev) => ({
        ...prev,
        endereco_logradouro: data.logradouro || "",
        endereco_bairro: data.bairro || "",
        endereco_cidade: data.localidade || "",
        endereco_estado: data.uf || "",
      }));
    } catch (err) {
      console.log("Erro ao buscar CEP", err);
    }
  };

  const handleChange = (key, value) => {
    if (readOnly) return;

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (readOnly) return;

    // ============================================================
    // VALIDAÇÃO – CAMPOS OBRIGATÓRIOS
    // ============================================================
    if (!form.nome.trim() || !form.telefone.trim()) {
      error("Campos obrigatórios", "Preencha nome e telefone.");
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

      success(modo === "edit" ? "Cliente atualizado!" : "Cliente criado!");
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
          <InputBlock required label="Telefone" field="telefone" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="E-mail" field="email" form={form} handleChange={handleChange} readOnly={readOnly} />

          <InputBlock label="CPF/CNPJ" field="cpf_cnpj" form={form} handleChange={handleChange} readOnly={readOnly} />

          <InputBlock
            label="Data de nascimento"
            field="data_nascimento"
            form={form}
            type="date"
            handleChange={handleChange}
            readOnly={readOnly}
          />

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

          {/* CEP com auto-complete */}
          <div>
            <Label>CEP</Label>
            <Input
              value={form.endereco_cep}
              disabled={readOnly}
              onChange={(e) => {
                handleChange("endereco_cep", e.target.value);
                buscarCEP(e.target.value);
              }}
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

      {/* ======================= */}
      {/* AÇÃO */}
      {/* ======================= */}
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

