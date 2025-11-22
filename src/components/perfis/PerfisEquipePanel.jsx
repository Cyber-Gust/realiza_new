// src/components/perfis/PerfisEquipePanel.jsx

"use client";

import { useEffect, useState } from "react";

// Componentes corretos
import { Button } from "@/components/admin/ui/Button";
import Modal from "@/components/admin/ui/Modal";
import { Input, Label, Select } from "@/components/admin/ui/Form";

// Toast Context
import { useToast } from "@/contexts/ToastContext";

import PerfisTable from "./PerfisTable";

import { ShieldCheck, UserPlus } from "lucide-react";

const USER_ROLES = ["admin", "corretor"];

export default function PerfisEquipePanel() {
  const { success, error } = useToast();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    creci: "",
    role: "corretor",
  });

  const [saving, setSaving] = useState(false);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/perfis/list?type=equipe", {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setProfiles(json.data || []);
    } catch (err) {
      error("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);

      const res = await fetch("/api/perfis/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "equipe" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      success("Perfil criado com sucesso!");

      setOpen(false);

      setForm({
        nome_completo: "",
        email: "",
        telefone: "",
        cpf_cnpj: "",
        creci: "",
        role: "corretor",
      });

      loadProfiles();
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
          <ShieldCheck size={18} /> Equipe (Admins e Corretores)
        </h3>

        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1"
        >
          <UserPlus size={16} /> Novo Perfil
        </Button>
      </div>

      {/* Tabela */}
      <PerfisTable data={profiles} type="equipe" loading={loading} />

      {/* Modal */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Novo Perfil da Equipe"
      >
        <div className="max-h-[70vh] overflow-y-auto space-y-3">
          {/* Nome */}
          <div>
            <Label>Nome completo</Label>
            <Input
              value={form.nome_completo}
              onChange={(e) =>
                setForm({ ...form, nome_completo: e.target.value })
              }
            />
          </div>

          {/* E-mail */}
          <div>
            <Label>E-mail</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {/* Telefone */}
          <div>
            <Label>Telefone</Label>
            <Input
              value={form.telefone}
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
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

          {/* CRECI */}
          <div>
            <Label>CRECI</Label>
            <Input
              value={form.creci}
              onChange={(e) => setForm({ ...form, creci: e.target.value })}
            />
          </div>

          {/* Role */}
          <div>
            <Label>Função</Label>
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
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
