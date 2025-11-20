"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import Toast from "@/components/admin/ui/Toast";
import {
  FileText,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  RefreshCcw,
  Search,
  Home,
  BadgeCheck,
} from "lucide-react";
import CRMPropostaForm from "./CRMPropostaForm";

const money = (v) =>
  `R$ ${Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
  })}`;

const StatusBadge = ({ status }) => {
  const map = {
    pendente: "bg-amber-100 text-amber-800 border-amber-200",
    aceita: "bg-emerald-100 text-emerald-800 border-emerald-200",
    recusada: "bg-rose-100 text-rose-800 border-rose-200",
    contraproposta: "bg-indigo-100 text-indigo-800 border-indigo-200",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs rounded border capitalize ${
        map[status] || "bg-muted text-foreground border-border"
      }`}
    >
      {status}
    </span>
  );
};

export default function CRMPropostasPanel() {
  const [propostas, setPropostas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

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

  // ============================================================
  // 🔹 Carrega previamente listas (imóveis & corretores)
  // ============================================================
  const loadLists = useCallback(async () => {
    try {
      const [imRes, corrRes] = await Promise.all([
        fetch("/api/crm/imoveis/list", { cache: "no-store" }),
        fetch("/api/perfis/list?type=equipe", { cache: "no-store" }),
      ]);

      const [imJson, corrJson] = await Promise.all([
        imRes.json(),
        corrRes.json(),
      ]);

      if (!imRes.ok) throw new Error(imJson.error || "Erro ao carregar imóveis");
      if (!corrRes.ok)
        throw new Error(corrJson.error || "Erro ao carregar equipe");

      setImoveis(imJson.data || []);
      setCorretores(corrJson.data || []);
    } catch (err) {
      Toast.error("Erro ao carregar filtros: " + err.message);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await loadLists();
    }
    init();
  }, [loadLists]);

  // ============================================================
  // 🔹 Monta QueryString / filtros dinâmicos
  // ============================================================
  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== "" && val !== undefined && val !== null)
        p.set(key, String(val));
    });
    return p.toString();
  }, [filters]);

  // ============================================================
  // 🔹 Carrega propostas
  // ============================================================
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
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    async function init() {
      await loadPropostas();
    }
    init();
  }, [loadPropostas]);

  // ============================================================
  // 🔹 Handlers
  // ============================================================
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

  const handleDelete = async (id) => {
    if (!confirm("Excluir esta proposta?")) return;

    const prev = propostas;
    setPropostas((ps) => ps.filter((p) => p.id !== id));

    try {
      const res = await fetch(`/api/crm/propostas?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      Toast.success("Proposta excluída!");
      loadPropostas();
    } catch (err) {
      setPropostas(prev);
      Toast.error(err.message);
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

      Toast.success("Status atualizado!");
    } catch (err) {
      setPropostas(prev);
      Toast.error(err.message);
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

  // ============================================================
  // 🔹 UI
  // ============================================================
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">

      {/* ===================== HEADER ===================== */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
          <FileText size={20} /> Gestão de Propostas
        </h3>

        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus size={16} /> Nova Proposta
        </Button>
      </div>

      {/* ===================== FILTROS ===================== */}
      <Card className="p-4 shadow-sm border-border bg-panel-card">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">

          <div className="flex items-center gap-2 border border-border rounded-md bg-panel-card px-2">
            <Search size={14} className="text-muted-foreground" />
            <input
              placeholder="Buscar por lead/imóvel"
              value={filters.q}
              onChange={(e) =>
                setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))
              }
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))
            }
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
          >
            <option value="">Status (todos)</option>
            <option value="pendente">Pendente</option>
            <option value="aceita">Aceita</option>
            <option value="recusada">Recusada</option>
            <option value="contraproposta">Contraproposta</option>
          </select>

          <select
            value={filters.corretor_id}
            onChange={(e) =>
              setFilters((f) => ({ ...f, corretor_id: e.target.value, page: 1 }))
            }
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
          >
            <option value="">Corretor (todos)</option>
            {corretores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_completo}
              </option>
            ))}
          </select>

          <select
            value={filters.imovel_id}
            onChange={(e) =>
              setFilters((f) => ({ ...f, imovel_id: e.target.value, page: 1 }))
            }
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
          >
            <option value="">Imóvel (todos)</option>
            {imoveis.map((im) => (
              <option key={im.id} value={im.id}>
                {im.titulo}
              </option>
            ))}
          </select>

          <select
            value={filters.orderBy}
            onChange={(e) => setFilters((f) => ({ ...f, orderBy: e.target.value }))}
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
          >
            <option value="created_at">Ordenar por: Data</option>
            <option value="valor_proposta">Ordenar por: Valor</option>
            <option value="status">Ordenar por: Status</option>
          </select>

          <select
            value={filters.orderDir}
            onChange={(e) => setFilters((f) => ({ ...f, orderDir: e.target.value }))}
            className="w-full border border-border rounded-md p-2 bg-panel-card text-sm"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        <div className="flex justify-end mt-3">
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex items-center gap-2"
          >
            <RefreshCcw size={14} /> Limpar filtros
          </Button>
        </div>
      </Card>

      {/* ===================== LISTA ===================== */}
      {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : propostas.length === 0 ? (
        <p className="p-4 text-center text-muted-foreground">
          Nenhuma proposta encontrada.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {propostas.map((p) => (
            <Card key={p.id} className="p-5 space-y-3 shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground text-base">
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
                  onClick={() => handleDelete(p.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 size={14} /> Excluir
                </Button>

                <Button
                  onClick={() => patchStatus(p.id, "aceita")}
                  className="flex items-center gap-2 col-span-1"
                >
                  <BadgeCheck size={14} /> Aceitar
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => patchStatus(p.id, "recusada")}
                  className="flex items-center gap-2 col-span-1"
                >
                  <X size={14} /> Recusar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ===================== PAGINAÇÃO ===================== */}
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

      {/* ===================== MODAL FORM ===================== */}
      <Modal
        open={openForm}
        onOpenChange={setOpenForm}
        title={editing ? "Editar Proposta" : "Nova Proposta"}
      >
        <CRMPropostaForm
          proposta={editing}
          onSaved={handleSaved}
          onClose={() => setOpenForm(false)}
        />
      </Modal>
    </div>
  );
}
