"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import Toast from "@/components/admin/ui/Toast";
import { Loader2, Plus, User2, Trash2, Edit, AlertTriangle } from "lucide-react";
import CRMLeadForm from "./CRMLeadForm";

export default function CRMLeadsPanel() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filter, setFilter] = useState({ status: "todos", origem: "", corretor_id: "todos" });
  const [deleting, setDeleting] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [corretoresMap, setCorretoresMap] = useState({});
  const [corretores, setCorretores] = useState([]);

  // ======================================
  // 🔹 Carregar leads + corretores
  // ======================================
  const loadLeads = async () => {
    try {
      setLoading(true);

      // 1️⃣ Busca os leads
      const res = await fetch("/api/perfis/list?type=leads", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // 2️⃣ Busca corretores para mapear nome
      const resCorretores = await fetch("/api/perfis/list?type=equipe", { cache: "no-store" });
      const jsonCorretores = await resCorretores.json();
      if (!resCorretores.ok) throw new Error(jsonCorretores.error);

      const map = {};
      (jsonCorretores.data || []).forEach((c) => {
        map[c.id] = c.nome_completo;
      });

      // 3️⃣ Junta leads com nome do corretor
      const leadsComCorretor = (json.data || []).map((l) => ({
        ...l,
        corretor_nome: map[l.corretor_id] || null,
      }));

      setLeads(leadsComCorretor);
      setCorretoresMap(map);
      setCorretores(jsonCorretores.data || []);
    } catch (err) {
      Toast.error("Erro ao carregar leads: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  // ======================================
  // 🔹 Deletar lead
  // ======================================
  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return Toast.error("ID do lead inválido!");

    setDeleting(true);
    try {
      const res = await fetch("/api/perfis/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id, type: "leads" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      Toast.success(`Lead "${deleteTarget.nome}" removido com sucesso!`);
      setDeleteTarget(null);
      loadLeads();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // ======================================
  // 🔹 Filtro de leads
  // ======================================
  const filteredLeads = leads.filter((lead) => {
    if (filter.status !== "todos" && lead.status !== filter.status) return false;
    if (filter.origem && !lead.origem?.toLowerCase().includes(filter.origem.toLowerCase()))
      return false;
    if (filter.corretor_id !== "todos" && lead.corretor_id !== filter.corretor_id) return false;
    return true;
  });

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

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <User2 size={18} /> Leads Cadastrados
        </h3>

        <div className="flex flex-wrap gap-2 items-center">
          {/* 🔽 FILTRO: STATUS */}
          <select
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="todos">Todos os status</option>
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

          {/* 🔽 FILTRO: CORRETOR */}
          <select
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
            value={filter.corretor_id}
            onChange={(e) => setFilter({ ...filter, corretor_id: e.target.value })}
          >
            <option value="todos">Todos os corretores</option>
            {corretores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_completo}
              </option>
            ))}
          </select>

          {/* 🔍 FILTRO: ORIGEM */}
          <input
            placeholder="Filtrar por origem"
            value={filter.origem}
            onChange={(e) => setFilter({ ...filter, origem: e.target.value })}
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
          />

          <Button onClick={() => setOpenForm(true)} className="flex items-center gap-2">
            <Plus size={16} /> Novo Lead
          </Button>
        </div>
      </div>

      {/* LISTAGEM */}
      {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : filteredLeads.length === 0 ? (
        <p className="p-4 text-center text-muted-foreground">
          Nenhum lead encontrado com os filtros aplicados.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredLeads.map((lead) => (
            <Card
              key={lead.id}
              className="p-4 space-y-2 relative hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelectedLead(lead.id)}
            >
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-foreground">{lead.nome}</h4>
                <div className="flex gap-1">
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
                {lead.corretor_nome
                  ? `Corretor: ${lead.corretor_nome}`
                  : "Sem corretor vinculado"}
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

      {/* MODAIS (form + exclusão) mantidos iguais */}
      <Modal
        open={openForm}
        onOpenChange={(val) => {
          setOpenForm(val);
          if (!val) setEditing(null);
        }}
        title={editing ? "Editar Lead" : "Novo Lead"}
      >
        <CRMLeadForm
          lead={editing}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          onSaved={loadLeads}
        />
      </Modal>

      <Modal
        open={!!deleteTarget}
        onOpenChange={(val) => {
          if (!val) setDeleteTarget(null);
        }}
        title="Remover Lead"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-foreground">
              <AlertTriangle className="text-red-500 mt-1" />
              <div>
                <p>
                  Tem certeza que deseja remover o lead{" "}
                  <strong>{deleteTarget.nome}</strong>?
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Origem: {deleteTarget.origem || "Manual"} | Status:{" "}
                  {deleteTarget.status || "novo"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="w-1/2"
                variant="secondary"
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
