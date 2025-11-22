"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Input, Textarea, Select, Label, FormError } from "@/components/admin/ui/Form";
import { useToast } from "@/contexts/ToastContext";
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

  const toast = useToast();

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ============================================================
     Corretores
  ============================================================ */
  useEffect(() => {
    const loadCorretores = async () => {
      try {
        const res = await fetch("/api/perfis/list?type=equipe", {
          cache: "no-store",
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        setCorretores(json.data || []);
      } catch (err) {
        toast.error("Erro ao carregar corretores", err.message);
      }
    };

    loadCorretores();
  }, []);

  /* ============================================================
     Payload Cleaner
  ============================================================ */
  const cleanPayload = (obj) => {
    const cleaned = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== "" && v !== null && v !== undefined) cleaned[k] = v;
    }
    return cleaned;
  };

  /* ============================================================
     Submit
  ============================================================ */
  const handleSubmit = async () => {
    if (!form.nome || !form.telefone)
      return toast.error("Erro", "Nome e telefone são obrigatórios!");

    if (jsonError)
      return toast.error("Erro", "Corrija o JSON antes de salvar!");

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
      if (!res.ok) throw new Error(json.error);

      toast.success(
        "Sucesso",
        `Lead ${isEdit ? "atualizado" : "criado"} com sucesso!`
      );

      onSaved?.(json.data);
      onClose?.();
    } catch (err) {
      toast.error("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     Render
  ============================================================ */
  return (
    <div className="space-y-4">

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Nome */}
        <div>
          <Label>Nome</Label>
          <Input
            value={form.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
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

        {/* Email */}
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </div>

        {/* Origem */}
        <div>
          <Label>Origem</Label>
          <Input
            value={form.origem}
            onChange={(e) => handleChange("origem", e.target.value)}
          />
        </div>

        {/* Status */}
        <div>
          <Label>Status</Label>
          <Select
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
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
          </Select>
        </div>

        {/* Corretor */}
        <div>
          <Label>Corretor Responsável</Label>
          <Select
            value={form.corretor_id}
            onChange={(e) => handleChange("corretor_id", e.target.value)}
          >
            <option value="">Selecione</option>
            {corretores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_completo}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Perfil JSON */}
      <div>
        <Label>Perfil de busca (JSON)</Label>
        <Textarea
          rows={6}
          className={cn(
            "font-mono text-xs resize-none bg-panel-card",
            jsonError ? "border-red-500" : "border-border"
          )}
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
        />

        {jsonError && <FormError message="JSON inválido." />}
      </div>

      {/* Botão */}
      <Button
        className="w-full mt-6 h-11 text-sm"
        disabled={loading || jsonError}
        onClick={handleSubmit}
      >
        {loading
          ? "Salvando..."
          : lead
          ? "Atualizar Lead"
          : "Salvar Lead"}
      </Button>
    </div>
  );
}
