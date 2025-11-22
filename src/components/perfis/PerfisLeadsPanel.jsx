// src/components/perfis/PerfisLeadsPanel.jsx

"use client";

import { useEffect, useState } from "react";

// Componentes certos
import { Button } from "@/components/admin/ui/Button";
import Modal from "@/components/admin/ui/Modal";
import { Input, Label, Select } from "@/components/admin/ui/Form";

// Toast Context
import { useToast } from "@/contexts/ToastContext";

import PerfisTable from "./PerfisTable";

import { Sparkles, UserPlus } from "lucide-react";

// Enums inline
const LEAD_STATUS = [
  "novo",
  "qualificado",
  "visita_agendada",
  "proposta_feita",
  "documentacao",
  "concluido",
  "perdido",
];

export default function PerfisLeadsPanel() {
  const { success, error } = useToast();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    status: "novo",
    origem: "manual",
    perfil_busca_json: "",
  });

  const [saving, setSaving] = useState(false);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/perfis/list?type=leads", {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setLeads(json.data || []);
    } catch (err) {
      error("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/perfis/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "leads" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      success("Lead criado com sucesso!");

      setOpen(false);

      setForm({
        nome: "",
        email: "",
        telefone: "",
        status: "novo",
        origem: "manual",
        perfil_busca_json: "",
      });

      loadLeads();
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
          <Sparkles size={18} /> Leads e Clientes
        </h3>

        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1"
        >
          <UserPlus size={16} /> Novo Lead
        </Button>
      </div>

      {/* Tabela */}
      <PerfisTable data={leads} type="leads" loading={loading} />

      {/* Modal */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Novo Lead"
      >
        <div className="max-h-[70vh] overflow-y-auto space-y-3">
          {/* Nome */}
          <div>
            <Label>Nome</Label>
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

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {LEAD_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          {/* Origem */}
          <div>
            <Label>Origem</Label>
            <Input
              placeholder="WhatsApp, Site, Indicação..."
              value={form.origem}
              onChange={(e) =>
                setForm({ ...form, origem: e.target.value })
              }
            />
          </div>

          {/* Preferências */}
          <div>
            <Label>Preferências (JSON)</Label>
            <Input
              placeholder='{"tipo":"apartamento","faixa_preco":"500000"}'
              value={form.perfil_busca_json}
              onChange={(e) =>
                setForm({ ...form, perfil_busca_json: e.target.value })
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
