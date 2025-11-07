"use client";

import { useState } from "react";
import Input from "@/components/admin/forms/Input";
import { Select } from "@/components/admin/forms/Select";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function LeadForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    origem: "",
    status: "novo",
  });

  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      <Input
        label="Nome"
        placeholder="Ex: João Silva"
        value={form.nome}
        onChange={(e) => handleChange("nome", e.target.value)}
      />
      <Input
        label="Telefone"
        placeholder="(31) 99999-9999"
        value={form.telefone}
        onChange={(e) => handleChange("telefone", e.target.value)}
      />
      <Input
        label="E-mail"
        type="email"
        placeholder="joao@email.com"
        value={form.email}
        onChange={(e) => handleChange("email", e.target.value)}
      />
      <Input
        label="Origem"
        placeholder="WhatsApp, Site, Indicação..."
        value={form.origem}
        onChange={(e) => handleChange("origem", e.target.value)}
      />
      <Select
        label="Status"
        options={statusOptions}
        value={form.status}
        onChange={(v) => handleChange("status", v)}
      />
      <div className="flex justify-end pt-3">
        <Button onClick={handleSubmit} className="min-w-[120px]">
          Salvar
        </Button>
      </div>
    </motion.div>
  );
}
