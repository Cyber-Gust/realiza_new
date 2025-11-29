"use client";

import { useState } from "react";

// UI
import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/admin/ui/Form";

// Toast
import { useToast } from "@/contexts/ToastContext";

const USER_ROLES = ["admin", "corretor"];

/* ============================================================
   Utilitários de slug
   ============================================================ */

function gerarSlugAutomático(texto) {
  // usado SOMENTE quando o nome muda
  return texto
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function limparSlug(texto) {
  // usado APENAS no salvar
  return texto
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "") // mantém "-"
    .replace(/--+/g, "-")        // evita múltiplos
    .replace(/(^-|-$)/g, "");    // remove bordas
}

export default function PerfilFormEquipe({
  onSuccess,
  modo = "create",
  dadosIniciais = {},
  readOnly = false,
}) {
  const { success, error } = useToast();

  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(
    Boolean(dadosIniciais.slug)
  );

  const [form, setForm] = useState({
    id: dadosIniciais.id || null,

    // Dados pessoais
    nome_completo: dadosIniciais.nome_completo || "",
    telefone: dadosIniciais.telefone || "",
    email: dadosIniciais.email || "",
    cpf_cnpj: dadosIniciais.cpf_cnpj || "",
    data_nascimento: dadosIniciais.data_nascimento || "",

    // Profissionais
    role: dadosIniciais.role || "corretor",
    creci: dadosIniciais.creci || "",
    slug: dadosIniciais.slug || "",
    resumo: dadosIniciais.resumo || "",
    bio_publica: dadosIniciais.bio_publica || "",
    detalhes: dadosIniciais.detalhes?.join("\n") || "",

    // Dados bancários
    banco: dadosIniciais.banco || "",
    agencia: dadosIniciais.agencia || "",
    conta: dadosIniciais.conta || "",
    tipo_conta: dadosIniciais.tipo_conta || "",
    pix: dadosIniciais.pix || "",
    favorecido: dadosIniciais.favorecido || "",

    // Endereço
    endereco_cep: dadosIniciais.endereco_cep || "",
    endereco_logradouro: dadosIniciais.endereco_logradouro || "",
    endereco_numero: dadosIniciais.endereco_numero || "",
    endereco_bairro: dadosIniciais.endereco_bairro || "",
    endereco_cidade: dadosIniciais.endereco_cidade || "",
    endereco_estado: dadosIniciais.endereco_estado || "",

    // Redes sociais
    instagram: dadosIniciais.instagram || "",
    linkedin: dadosIniciais.linkedin || "",
    whatsapp: dadosIniciais.whatsapp || "",

    ativo: dadosIniciais.ativo ?? true,
  });

  const [saving, setSaving] = useState(false);

  /* ============================================================
     HANDLE CHANGE INTELIGENTE PARA SLUG
     ============================================================ */
  const handleChange = (key, value) => {
    if (readOnly) return;

    // Nome → gera slug automaticamente se o usuário ainda não mexeu no slug
    if (key === "nome_completo") {
      setForm((prev) => ({
        ...prev,
        nome_completo: value,
        slug: slugEditadoManualmente ? prev.slug : gerarSlugAutomático(value),
      }));
      return;
    }

    // Slug → permite digitação livre
    if (key === "slug") {
      setSlugEditadoManualmente(true);
      setForm((prev) => ({ ...prev, slug: value }));
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* ============================================================
     SALVAR
     ============================================================ */
  const handleSave = async () => {
    if (readOnly) return;

    try {
      setSaving(true);

      // Limpa slug só no salvar
      const slugFinal = limparSlug(form.slug);
      const slugSeguro = slugFinal || gerarSlugAutomático(form.nome_completo);

      const payload = {
        ...form,
        slug: slugSeguro,
        type: "equipe",
        detalhes: form.detalhes
          ? form.detalhes.split("\n").map((x) => x.trim()).filter(Boolean)
          : [],
      };

      const url = modo === "edit" ? "/api/perfis/update" : "/api/perfis/create";
      const method = modo === "edit" ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",  // 👈 *obrigatório pro cookie chegar*
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

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="space-y-6">

      {/* ======================= */}
      {/* DADOS PESSOAIS */}
      {/* ======================= */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Dados pessoais</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <InputBlock label="Nome completo" field="nome_completo" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Telefone" field="telefone" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="E-mail" type="email" field="email" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="CPF/CNPJ" field="cpf_cnpj" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Data de nascimento" type="date" field="data_nascimento" form={form} handleChange={handleChange} readOnly={readOnly} />

          <div>
            <Label>Cargo</Label>
            <Select
              value={form.role}
              disabled={readOnly || (modo === "edit" && dadosIniciais.role === "admin")}
              onChange={(e) => handleChange("role", e.target.value)}
            >
              {USER_ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* ======================= */}
      {/* PROFISSIONAL */}
      {/* ======================= */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Profissional</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <InputBlock label="CRECI" field="creci" form={form} handleChange={handleChange} readOnly={readOnly} />

          {/* SLUG EDITÁVEL */}
          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              disabled={readOnly}
              onChange={(e) => handleChange("slug", e.target.value)}
            />
          </div>

          <div className="lg:col-span-3">
            <Label>Resumo</Label>
            <Textarea
              rows={2}
              value={form.resumo}
              disabled={readOnly}
              onChange={(e) => handleChange("resumo", e.target.value)}
            />
          </div>

          <div className="lg:col-span-3">
            <Label>Bio pública</Label>
            <Textarea
              rows={3}
              value={form.bio_publica}
              disabled={readOnly}
              onChange={(e) => handleChange("bio_publica", e.target.value)}
            />
          </div>

          <div className="lg:col-span-3">
            <Label>Detalhes (um por linha)</Label>
            <Textarea
              rows={3}
              value={form.detalhes}
              disabled={readOnly}
              onChange={(e) => handleChange("detalhes", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ======================= */}
      {/* DADOS BANCÁRIOS */}
      {/* ======================= */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Dados bancários</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <InputBlock label="Banco" field="banco" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Agência" field="agencia" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Conta" field="conta" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Tipo da conta" field="tipo_conta" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Pix" field="pix" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Favorecido" field="favorecido" form={form} handleChange={handleChange} readOnly={readOnly} />
        </div>
      </div>

      {/* ======================= */}
      {/* ENDEREÇO */}
      {/* ======================= */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Endereço</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <InputBlock label="CEP" field="endereco_cep" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Logradouro" field="endereco_logradouro" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Número" field="endereco_numero" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Bairro" field="endereco_bairro" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Cidade" field="endereco_cidade" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="Estado" field="endereco_estado" form={form} handleChange={handleChange} readOnly={readOnly} />
        </div>
      </div>

      {/* ======================= */}
      {/* REDES SOCIAIS */}
      {/* ======================= */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Redes sociais</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <InputBlock label="Instagram" field="instagram" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="LinkedIn" field="linkedin" form={form} handleChange={handleChange} readOnly={readOnly} />
          <InputBlock label="WhatsApp" field="whatsapp" form={form} handleChange={handleChange} readOnly={readOnly} />
        </div>
      </div>

      {/* ======================= */}
      {/* AÇÕES */}
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

/* ============================================================
   COMPONENTE HELPER
   ============================================================ */
function InputBlock({ label, field, form, handleChange, readOnly, type = "text" }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        value={form[field] || ""}
        disabled={readOnly}
        onChange={(e) => handleChange(field, e.target.value)}
      />
    </div>
  );
}
