"use client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import Toast from "@/components/admin/ui/Toast";

import {
  Loader2,
  Plus,
  User2,
  Trash2,
  Edit,
  AlertTriangle,
  Search,
  Filter,
  RefreshCcw,
} from "lucide-react";

import CRMLeadForm from "./CRMLeadForm";

export default function CRMLeadsPanel() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [corretores, setCorretores] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    origem: "",
    corretor_id: "",
  });

  // ========================================================
  // 🔥 LOAD CORRETORES E LEADS (NOVAS ROTAS)
  // ========================================================
  const loadAll = async () => {
    try {
      setLoading(true);

      const [leadsRes, corretoresRes] = await Promise.all([
        fetch("/api/crm/leads", { cache: "no-store" }),
        fetch("/api/perfis/list?type=equipe", { cache: "no-store" }),
      ]);

      const [leadsJson, corrJson] = await Promise.all([
        leadsRes.json(),
        corretoresRes.json(),
      ]);

      if (!leadsRes.ok) throw new Error(leadsJson.error);
      if (!corretoresRes.ok) throw new Error(corrJson.error);

      setLeads(leadsJson.data || []);
      setCorretores(corrJson.data || []);
    } catch (err) {
      Toast.error("Erro ao carregar leads: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ========================================================
  // 🔥 FILTRAGEM LOCAL
  // ========================================================
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filters.status && lead.status !== filters.status) return false;
      if (filters.origem && !lead.origem?.toLowerCase().includes(filters.origem.toLowerCase()))
        return false;
      if (filters.corretor_id && lead.corretor_id !== filters.corretor_id)
        return false;
      if (
        filters.search &&
        !(
          lead.nome?.toLowerCase().includes(filters.search.toLowerCase()) ||
          lead.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
          lead.telefone?.toLowerCase().includes(filters.search.toLowerCase())
        )
      )
        return false;

      return true;
    });
  }, [leads, filters]);

  // ========================================================
  // 🔥 DELETE (NOVO ENDPOINT)
  // ========================================================
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/leads?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      Toast.success(`Lead "${deleteTarget.nome}" removido com sucesso!`);
      setDeleteTarget(null);
      loadAll();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ========================================================
  // 🔥 STATUS COLORS
  // ========================================================
  const getStatusColor = (status) => {
    const map = {
      novo: "bg-blue-500",
      qualificado: "bg-green-500",
      visita_agendada: "bg-yellow-500",
      proposta_feita: "bg-purple-500",
      documentacao: "bg-orange-500",
      concluido: "bg-emerald-600",
      perdido: "bg-gray-400",
    };
    return map[status] || "bg-muted";
  };

  const resetFilters = () =>
    setFilters({ search: "", status: "", origem: "", corretor_id: "" });

  // ========================================================
  // 🔥 UI
  // ========================================================
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-200">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
          <User2 size={20} /> Leads Cadastrados
        </h3>

        <Button onClick={() => setOpenForm(true)} className="flex items-center gap-2">
          <Plus size={16} /> Novo Lead
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="p-4 shadow-sm bg-panel-card border-border">
        <div className="grid md:grid-cols-5 gap-3">

          {/* SEARCH */}
          <div className="flex items-center gap-2 border border-border rounded-md p-2 bg-panel-card">
            <Search size={14} className="text-muted-foreground" />
            <input
              placeholder="Buscar por nome, telefone ou email"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          {/* STATUS */}
          <select
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">Todos os status</option>
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
          </select>

          {/* CORRETOR */}
          <select
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
            value={filters.corretor_id}
            onChange={(e) => setFilters((f) => ({ ...f, corretor_id: e.target.value }))}
          >
            <option value="">Todos os corretores</option>
            {corretores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_completo}
              </option>
            ))}
          </select>

          {/* ORIGEM */}
          <input
            placeholder="Filtrar por origem"
            value={filters.origem}
            onChange={(e) => setFilters((f) => ({ ...f, origem: e.target.value }))}
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
          />

          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={resetFilters}
          >
            <RefreshCcw size={14} /> Reset
          </Button>
        </div>
      </Card>

      {/* LISTAGEM */}
      {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : filteredLeads.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">
          Nenhum lead encontrado com os filtros aplicados.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <Card
              key={lead.id}
              className="p-4 space-y-2 shadow-md hover:shadow-lg transition border-border cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <h4 className="text-lg font-bold text-foreground">{lead.nome}</h4>

                <div className="flex gap-1">
                  {/* EDITAR */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(lead);
                      setOpenForm(true);
                    }}
                  >
                    <Edit size={16} />
                  </Button>

                  {/* EXCLUIR */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(lead);
                    }}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{lead.email || "-"}</p>
              <p className="text-sm text-muted-foreground">{lead.telefone || "-"}</p>

              <p className="text-xs text-muted-foreground italic">
                {lead.profiles?.nome_completo || "Sem corretor atribuído"}
              </p>

              <div className="flex justify-between items-center text-xs text-muted-foreground italic">
                <span>Origem: {lead.origem || "Manual"}</span>

                <span
                  className={`px-2 py-0.5 rounded-full text-white ${getStatusColor(
                    lead.status
                  )}`}
                >
                  {lead.status}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL — FORM */}
      <Modal
        open={openForm}
        onOpenChange={(v) => {
          setOpenForm(v);
          if (!v) setEditing(null);
        }}
        title={editing ? "Editar Lead" : "Novo Lead"}
      >
        <CRMLeadForm
          lead={editing}
          onSaved={loadAll}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
        />
      </Modal>

      {/* MODAL — CONFIRM DELETE */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Remover Lead"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-1" />
              <div>
                <p>
                  Tem certeza que deseja remover o lead{" "}
                  <strong>{deleteTarget.nome}</strong>?
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  Origem: {deleteTarget.origem || "Manual"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="w-1/2"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </Button>

              <Button
                className="w-1/2 bg-red-600 hover:bg-red-700"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? "Removendo..." : "Confirmar Remoção"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
