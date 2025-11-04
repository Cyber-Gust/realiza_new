//src/components/perfis/PerfisLeadsPanel.jsx

"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/admin/ui/Modal";
import PerfisTable from "./PerfisTable";
import Toast from "@/components/admin/ui/Toast";
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
      const res = await fetch("/api/perfis/list?type=leads", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLeads(json.data || []);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLeads(); }, []);

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
      Toast.success("Lead criado com sucesso!");
      setOpen(false);
      setForm({ nome: "", email: "", telefone: "", status: "novo", origem: "manual", perfil_busca_json: "" });
      loadLeads();
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
          <Sparkles size={18} /> Leads e Clientes
        </h3>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-1">
          <UserPlus size={16} /> Novo Lead
        </Button>
      </div>

      <PerfisTable data={leads} type="leads" loading={loading} />

      <Modal open={open} onOpenChange={setOpen} title="Novo Lead">
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
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card"
          >
            {LEAD_STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            placeholder="Origem (ex: WhatsApp, Site, Indicação)"
            value={form.origem}
            onChange={(e) => setForm({ ...form, origem: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card"
          />
          <input
            placeholder='Preferências (JSON) — ex: {"tipo":"apartamento","faixa_preco":"500000"}'
            value={form.perfil_busca_json}
            onChange={(e) => setForm({ ...form, perfil_busca_json: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card"
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
