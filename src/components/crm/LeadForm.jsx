"use client";
import { useState } from "react";
import Input from "@/components/admin/forms/Input";
import Select from "@/components/admin/forms/Select";
import { Button } from "@/components/ui/button";

export default function LeadForm({ onSave, onClose }) {
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", origem: "", status: "novo" });

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    await onSave(form);
    onClose();
  };

  const statusOptions = [
    { label: "Novo", value: "novo" },
    { label: "Qualificado", value: "qualificado" },
    { label: "Visita Agendada", value: "visita_agendada" },
    { label: "Proposta Feita", value: "proposta_feita" },
    { label: "Documentação", value: "documentacao" },
    { label: "Concluído", value: "concluido" },
    { label: "Perdido", value: "perdido" },
  ];

  return (
    <div className="space-y-3">
      <Input label="Nome" value={form.nome} onChange={(e) => handleChange("nome", e.target.value)} />
      <Input label="Telefone" value={form.telefone} onChange={(e) => handleChange("telefone", e.target.value)} />
      <Input label="E-mail" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
      <Input label="Origem (WhatsApp, Site, Indicação...)" value={form.origem} onChange={(e) => handleChange("origem", e.target.value)} />
      <Select label="Status" options={statusOptions} value={form.status} onChange={(v) => handleChange("status", v)} />
      <div className="flex justify-end pt-2">
        <Button onClick={handleSubmit}>Salvar</Button>
      </div>
    </div>
  );
}
