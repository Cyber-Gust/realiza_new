// src/components/perfis/PerfisPersonasPanel.jsx

"use client";

import { useEffect, useState } from "react";

// Componentes corretos
import { Button } from "@/components/admin/ui/Button";
import Modal from "@/components/admin/ui/Modal";
import { Input, Label, Textarea, Select } from "@/components/admin/ui/Form";

// Toast Context
import { useToast } from "@/contexts/ToastContext";

import PerfisTable from "./PerfisTable";

import { UsersRound, UserPlus } from "lucide-react";

// Enums inline
const PERSONA_TIPOS = ["proprietario", "inquilino", "cliente"];

export default function PerfisPersonasPanel() {
  const { success, error } = useToast();

  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    tipo: "proprietario",
    observacoes: "",
    endereco_json: "",
  });

  const [saving, setSaving] = useState(false);

  const loadPersonas = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/perfis/list?type=personas", {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setPersonas(json.data || []);
    } catch (err) {
      error("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonas();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/perfis/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "personas" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      success("Cadastro criado com sucesso!");

      setOpen(false);

      setForm({
        nome: "",
        email: "",
        telefone: "",
        cpf_cnpj: "",
        tipo: "proprietario",
        observacoes: "",
        endereco_json: "",
      });

      loadPersonas();
    } catch (err) {
      error("Erro", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2 text-foreground">
          <UsersRound size={18} /> Proprietários e Inquilinos
        </h3>

        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1"
        >
          <UserPlus size={16} /> Novo Cadastro
        </Button>
      </div>

      {/* Tabela */}
      <PerfisTable data={personas} type="personas" loading={loading} />

      {/* Modal */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Novo Cadastro de Pessoa"
      >
        <div className="max-h-[70vh] overflow-y-auto space-y-3">
          {/* Nome */}
          <div>
            <Label>Nome completo</Label>
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </div>

          {/* E-mail */}
          <div>
            <Label>E-mail</Label>
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Telefone */}
          <div>
            <Label>Telefone</Label>
            <Input
              value={form.telefone}
              onChange={(e) =>
                setForm({ ...form, telefone: e.target.value })
              }
            />
          </div>

          {/* CPF/CNPJ */}
          <div>
            <Label>CPF/CNPJ</Label>
            <Input
              value={form.cpf_cnpj}
              onChange={(e) =>
                setForm({ ...form, cpf_cnpj: e.target.value })
              }
            />
          </div>

          {/* Tipo */}
          <div>
            <Label>Tipo</Label>
            <Select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              {PERSONA_TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          {/* Observações */}
          <div>
            <Label>Observações</Label>
            <Textarea
              rows={3}
              value={form.observacoes}
              onChange={(e) =>
                setForm({ ...form, observacoes: e.target.value })
              }
            />
          </div>

          {/* Endereço JSON */}
          <div>
            <Label>Endereço (JSON)</Label>
            <Input
              placeholder='{"logradouro":"Rua A","numero":"100"}'
              value={form.endereco_json}
              onChange={(e) =>
                setForm({ ...form, endereco_json: e.target.value })
              }
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
