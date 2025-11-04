//src/components/perfis/PerfisEquipePanel.jsx

"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/admin/ui/Modal";
import PerfisTable from "./PerfisTable";
import Toast from "@/components/admin/ui/Toast";
import { ShieldCheck, UserPlus } from "lucide-react";

// Enums inline
const USER_ROLES = ["admin", "corretor"];

export default function PerfisEquipePanel() {
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
      const res = await fetch("/api/perfis/list?type=equipe", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setProfiles(json.data || []);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfiles(); }, []);

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
      Toast.success("Perfil criado com sucesso!");
      setOpen(false);
      setForm({ nome_completo: "", email: "", telefone: "", cpf_cnpj: "", creci: "", role: "corretor" });
      loadProfiles();
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
          <ShieldCheck size={18} /> Equipe (Admins e Corretores)
        </h3>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-1">
          <UserPlus size={16} /> Novo Perfil
        </Button>
      </div>

      <PerfisTable data={profiles} type="equipe" loading={loading} />

      <Modal open={open} onOpenChange={setOpen} title="Novo Perfil da Equipe">
        <div className="max-h-[70vh] overflow-y-auto space-y-3">
          <input
            placeholder="Nome completo"
            value={form.nome_completo}
            onChange={(e) => setForm({ ...form, nome_completo: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card"
          />
          <input
            placeholder="E-mail"
            type="email"
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
          <input
            placeholder="CRECI"
            value={form.creci}
            onChange={(e) => setForm({ ...form, creci: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full border border-border rounded-md p-2 bg-panel-card"
          >
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
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
