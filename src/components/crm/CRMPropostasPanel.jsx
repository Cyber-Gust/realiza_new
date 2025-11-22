"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import { useToast } from "@/contexts/ToastContext";

import {
  FileText,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  RefreshCcw,
  Search,
  Home,
  BadgeCheck,
  X,
  AlertTriangle,
} from "lucide-react";

import CRMPropostaForm from "./CRMPropostaForm";

/* ============================================================
   Helpers
============================================================ */
const money = (v) =>
  `R$ ${Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}`;

/* ============================================================
   Status Badge
============================================================ */
const StatusBadge = ({ status }) => {
  const map = {
    pendente: "bg-amber-100 text-amber-800 border border-amber-300",
    aceita: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    recusada: "bg-rose-100 text-rose-800 border border-rose-300",
    contraproposta: "bg-indigo-100 text-indigo-800 border border-indigo-300",
  };

  return (
    <span
      className={`
        inline-flex items-center px-2 py-[2px] rounded-md text-xs font-medium capitalize
        ${map[status] || "bg-muted text-foreground border border-border"}
      `}
    >
      {status}
    </span>
  );
};

/* ============================================================
   CRMPropostasPanel — versão enterprise
============================================================ */
export default function CRMPropostasPanel() {
  const toast = useToast();

  const [propostas, setPropostas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [imoveis, setImoveis] = useState([]);
  const [corretores, setCorretores] = useState([]);

  const [filters, setFilters] = useState({
    q: "",
    status: "",
    corretor_id: "",
    imovel_id: "",
    min: "",
    max: "",
    orderBy: "created_at",
    orderDir: "desc",
    page: 1,
    pageSize: 9,
  });

  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));

  /* ============================================================
     Load Listas
  ============================================================ */
  const loadLists = useCallback(async () => {
    try {
      const [imRes, corrRes] = await Promise.all([
        fetch("/api/imoveis/list", { cache: "no-store" }),
        fetch("/api/perfis/list?type=equipe", { cache: "no-store" }),
      ]);

      const [imJson, corJson] = await Promise.all([
        imRes.json(),
        corrRes.json(),
      ]);

      if (!imRes.ok) throw new Error(imJson.error);
      if (!corrRes.ok) throw new Error(corJson.error);

      setImoveis(imJson.data || []);
      setCorretores(corJson.data || []);
    } catch (err) {
      toast.error("Erro ao carregar filtros: " + err.message);
    }
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  /* ============================================================
     QueryString
  ============================================================ */
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) params.set(k, String(v));
    });
    return params.toString();
  }, [filters]);

  /* ============================================================
     Load Propostas
  ============================================================ */
  const loadPropostas = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/crm/propostas?${queryString}`, {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setPropostas(json.data || []);
      setTotal(json.count || json.data?.length || 0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    loadPropostas();
  }, [loadPropostas]);

  /* ============================================================
     CRUD Handlers
  ============================================================ */
  const handleCreate = () => {
    setEditing(null);
    setOpenForm(true);
  };

  const handleEdit = (p) => {
    setEditing(p);
    setOpenForm(true);
  };

  const handleSaved = () => {
    setOpenForm(false);
    loadPropostas();
  };

  const confirmDelete = (p) => setDeleteTarget(p);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id) return toast.error("ID inválido!");

    setDeleting(true);

    try {
      const res = await fetch(`/api/crm/propostas?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Proposta removida com sucesso!");
      setDeleteTarget(null);
      loadPropostas();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const patchStatus = async (id, status) => {
    const prev = propostas;
    setPropostas((ps) => ps.map((p) => (p.id === id ? { ...p, status } : p)));

    try {
      const res = await fetch(`/api/crm/propostas`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Status atualizado!");
    } catch (err) {
      setPropostas(prev);
      toast.error(err.message);
    }
  };

  const resetFilters = () =>
    setFilters({
      q: "",
      status: "",
      corretor_id: "",
      imovel_id: "",
      min: "",
      max: "",
      orderBy: "created_at",
      orderDir: "desc",
      page: 1,
      pageSize: 9,
    });

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
          <FileText size={20} /> Gestão de Propostas
        </h3>

        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus size={16} /> Nova Proposta
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="p-4 bg-panel-card border-border shadow-sm rounded-xl">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">

          {/* Search */}
          <div className="flex items-center gap-2 border border-border rounded-md bg-panel-card px-2">
            <Search size={14} className="text-muted-foreground" />
            <input
              placeholder="Buscar por lead / imóvel"
              value={filters.q}
              onChange={(e) =>
                setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))
              }
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>

          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))
            }
            className="w-full border border-border rounded-md p-2 text-sm bg-panel-card"
          >
            <option value="">Status (todos)</option>
            <option value="pendente">Pendente</option>
            <option value="aceita">Aceita</option>
            <option value="recusada">Recusada</option>
            <option value="contraproposta">Contraproposta</option>
          </select>

          {/* Corretor */}
          <select
            value={filters.corretor_id}
            onChange={(e) =>
              setFilters((f) => ({ ...f, corretor_id: e.target.value, page: 1 }))
            }
            className="w-full border border-border rounded-md p-2 text-sm bg-panel-card"
          >
            <option value="">Corretor (todos)</option>
            {corretores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_completo}
              </option>
            ))}
          </select>

          {/* Imóvel */}
          <select
            value={filters.imovel_id}
            onChange={(e) =>
              setFilters((f) => ({ ...f, imovel_id: e.target.value, page: 1 }))
            }
            className="w-full border border-border rounded-md p-2 text-sm bg-panel-card"
          >
            <option value="">Imóvel (todos)</option>
            {imoveis.map((im) => (
              <option key={im.id} value={im.id}>
                {im.titulo}
              </option>
            ))}
          </select>

          {/* Ordenação */}
          <select
            value={filters.orderBy}
            onChange={(e) =>
              setFilters((f) => ({ ...f, orderBy: e.target.value }))
            }
            className="w-full border border-border rounded-md p-2 text-sm bg-panel-card"
          >
            <option value="created_at">Ordenar por: Data</option>
            <option value="valor_proposta">Ordenar por: Valor</option>
            <option value="status">Ordenar por: Status</option>
          </select>

          <select
            value={filters.orderDir}
            onChange={(e) =>
              setFilters((f) => ({ ...f, orderDir: e.target.value }))
            }
            className="w-full border border-border rounded-md p-2 text-sm bg-panel-card"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        <div className="flex justify-end mt-3">
          <Button
            variant="secondary"
            onClick={resetFilters}
            className="flex items-center gap-2"
          >
            <RefreshCcw size={14} /> Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* LISTA */}
      {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : propostas.length === 0 ? (
        <Card className="p-5 text-center text-muted-foreground bg-panel-card border-border rounded-xl">
          Nenhuma proposta encontrada.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {propostas.map((p) => (
            <Card
              key={p.id}
              className="
                p-5 space-y-3 border border-border rounded-xl
                bg-panel-card shadow-sm hover:shadow-md transition
              "
            >
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground">
                    {p.leads?.nome || "Lead não identificado"}
                  </h4>

                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Home size={14} /> {p.imoveis?.titulo || "-"}
                  </p>
                </div>

                <StatusBadge status={p.status} />
              </div>

              <p className="text-lg font-bold text-primary">
                {money(p.valor_proposta)}
              </p>

              <p className="text-xs text-muted-foreground italic">
                Corretor: {p.profiles?.nome_completo || "-"}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <Button
                  variant="outline"
                  onClick={() => handleEdit(p)}
                  className="flex items-center gap-2"
                >
                  <Pencil size={14} /> Editar
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => confirmDelete(p)}
                  className="flex items-center gap-2"
                >
                  <Trash2 size={14} /> Excluir
                </Button>

                <Button
                  className="flex items-center gap-2"
                  onClick={() => patchStatus(p.id, "aceita")}
                >
                  <BadgeCheck size={14} /> Aceitar
                </Button>

              <Button
                variant="secondary"
                onClick={() => patchStatus(p.id, "recusada")}
                className="flex items-center gap-2"
              >
                <X size={14} /> Recusar
              </Button>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* PAGINAÇÃO */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Página {filters.page} de {totalPages} • {total} propostas
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={filters.page <= 1}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
          >
            Anterior
          </Button>

          <Button
            variant="outline"
            disabled={filters.page >= totalPages}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            Próxima
          </Button>
        </div>
      </div>

      {/* MODAL: FORM */}
      <Modal
        isOpen={openForm}
        onOpenChange={setOpenForm}
        title={editing ? "Editar Proposta" : "Nova Proposta"}
      >
        <CRMPropostaForm
          proposta={editing}
          onSaved={handleSaved}
          onClose={() => setOpenForm(false)}
        />
      </Modal>

      {/* MODAL: DELETE */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Proposta"
        className="max-w-md"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-1 shrink-0" />

              <div>
                <p>
                  Tem certeza que deseja remover a proposta de{" "}
                  <strong>{deleteTarget.leads?.nome || "Lead desconhecido"}</strong>?
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  Valor:{" "}
                  <strong>
                    R$ {Number(deleteTarget.valor_proposta).toLocaleString("pt-BR")}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="w-1/2"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </Button>

              <Button
                className="w-1/2 bg-red-600 hover:bg-red-700"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Removendo...
                  </span>
                ) : (
                  "Confirmar Remoção"
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
