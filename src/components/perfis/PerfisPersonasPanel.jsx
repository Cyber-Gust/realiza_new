//src/components/perfis/PerfisPersonasPanel.jsx

"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/admin/ui/Modal";
import PerfisTable from "./PerfisTable";
import Toast from "@/components/admin/ui/Toast";
import { UsersRound, UserPlus } from "lucide-react";

// Enums inline
const PERSONA_TIPOS = ["proprietario", "inquilino", "cliente"];

export default function PerfisPersonasPanel() {
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
      const res = await fetch("/api/perfis/list?type=personas", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPersonas(json.data || []);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPersonas(); }, []);

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
      Toast.success("Cadastro criado com sucesso!");
      setOpen(false);
      setForm({ nome: "", email: "", telefone: "", cpf_cnpj: "", tipo: "proprietario", observacoes: "", endereco_json: "" });
      loadPersonas();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2 text-foreground">
          <UsersRound size={18} /> Proprietários e Inquilinos
        </h3>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-1">
          <UserPlus size={16} /> Novo Cadastro
        </Button>
      </div>

      <PerfisTable data={personas} type="personas" loading={loading} />

      <Modal open={open} onOpenChange={setOpen} title="Novo Cadastro de Pessoa">
        <div className="max-h-[70vh] overflow-y-auto space-y-3">
          <input
            placeholder="Nome completo"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card"
          />
          <input
            placeholder="E-mail"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card"
          />
          <input
            placeholder="Telefone"
            value={form.telefone}
            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card"
          />
          <input
            placeholder="CPF/CNPJ"
            value={form.cpf_cnpj}
            onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card"
          />
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card"
          >
            {PERSONA_TIPOS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <textarea
            placeholder="Observações"
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            className="w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
            rows={3}
          />
          <input
            placeholder='Endereço (JSON) — ex: {"logradouro":"Rua A","numero":"100"}'
            value={form.endereco_json}
            onChange={(e) => setForm({ ...form, endereco_json: e.target.value })}
            className="w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
          />
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
