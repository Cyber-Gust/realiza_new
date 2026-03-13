"use client";

import { useState, useEffect, useMemo, useRef } from "react";
 import { useCallback } from "react";
import {
  User2,
  Plus,
  Loader2,
  Edit,
  Search,
  RefreshCcw,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import Badge from "@/components/admin/ui/Badge";
import { Input, Select } from "@/components/admin/ui/Form";

import CRMLeadForm from "./CRMLeadForm";
import CRMLeadDetailDrawer from "./CRMLeadDetailDrawer"; // 🆕 IMPORTAÇÃO DO DRAWER

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/Table";

export default function CRMLeadsPanel() {
  const topRef = useRef(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [openDrawer, setOpenDrawer] = useState(null); // 🆕 drawer ativo

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  const [corretores, setCorretores] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    origem: "",
    corretor_id: "",
  });

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const { user } = useUser();
  /* ============================================================
     LOAD
  ============================================================ */
  const loadAll = useCallback(async () => {
    try {
      setLoading(true);

      const [leadsRes, corretoresRes] = await Promise.all([
        fetch(`/api/corretor/crm/leads?corretor_id=${user.id}`, { cache: "no-store" }),
        fetch("/api/corretor/perfis/list?type=equipe", { cache: "no-store" }),
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
      toast.error("Erro ao carregar leads: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [toast, user.id]);

  useEffect(() => {
    if (user?.id) {
      loadAll();
    }
  }, [user?.id, loadAll]);

  console.log("USER ID", user.id);

  /* ============================================================
     FILTRAGEM
  ============================================================ */
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (filters.status && lead.status !== filters.status) return false;
      if (
        filters.origem &&
        !lead.origem?.toLowerCase().includes(filters.origem.toLowerCase())
      )
        return false;
      if (filters.corretor_id && lead.corretor_id !== filters.corretor_id)
        return false;

      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (
          !(
            lead.nome?.toLowerCase().includes(s) ||
            lead.email?.toLowerCase().includes(s) ||
            lead.telefone?.toLowerCase().includes(s)
          )
        )
          return false;
      }

      return true;
    });
  }, [leads, filters]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

    const paginatedLeads = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    return filteredLeads.slice(start, end);
  }, [filteredLeads, page, itemsPerPage]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  /* ============================================================
     DELETE
  ============================================================ */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/corretor/crm/leads?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(`Lead "${deleteTarget.nome}" removido com sucesso!`);
      setDeleteTarget(null);
      loadAll();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    topRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [page]);

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div ref={topRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-200">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground tracking-tight">
          <User2 size={20} /> Leads Cadastrados
        </h3>

        <Button onClick={() => setOpenForm(true)} className="flex items-center gap-2">
          <Plus size={16} /> Novo Lead
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="p-5 bg-panel-card border-border shadow-sm rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

          {/* SEARCH */}
          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-panel-card">
            <Search size={14} className="text-muted-foreground" />
            <input
              placeholder="Buscar por nome, telefone ou email"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <Select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
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
              <option key={s} value={s}>{s.replaceAll("_", " ").toUpperCase()}</option>
            ))}
          </Select>

          <Input
            placeholder="Filtrar por origem"
            value={filters.origem}
            onChange={(e) =>
              setFilters((f) => ({ ...f, origem: e.target.value }))
            }
          />

          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() =>
              setFilters({ search: "", status: "", origem: "", corretor_id: "" })
            }
          >
            <RefreshCcw size={14} /> Reset
          </Button>
        </div>
      </Card>

      {/* LISTAGEM */}
      {loading ? (
        <div className="flex justify-center items-center py-14 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground bg-panel-card border-border rounded-xl">
          Nenhum lead encontrado com os filtros aplicados.
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Corretor</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {paginatedLeads.map((lead) => (
              <TableRow
                key={lead.id}
                className="cursor-pointer hover:bg-muted/20 transition"
                onClick={() => setOpenDrawer(lead.id)} // 🆕 ABRE O DRAWER
              >
                <TableCell>{lead.nome}</TableCell>
                <TableCell className="text-muted-foreground">{lead.email || "-"}</TableCell>
                <TableCell>{lead.telefone}</TableCell>
                <TableCell>{lead.profiles?.nome_completo || "Sem corretor"}</TableCell>
                <TableCell>{lead.origem || "Manual"}</TableCell>
                <TableCell>
                  <Badge status={lead.status} className="capitalize">{lead.status}</Badge>
                </TableCell>

                {/* AÇÕES */}
                <TableCell className="text-right flex justify-end gap-2">

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

                </TableCell>
              </TableRow>
            ))}
          </tbody>
          
        </Table>
        
      )}

        <div className="flex items-center justify-between pt-4">

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar:</span>

            <Select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setPage(1);
                topRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-[110px]"
            >
              <option value={10}>10</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
              <option value={100}>100</option>
            </Select>

            <span className="text-sm text-muted-foreground">leads</span>
          </div>

        </div>
        
        <div className="flex items-center justify-center gap-4 pt-4">

          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </Button>

          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>

          <Button
            variant="secondary"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima →
          </Button>

        </div>

      {/* FORMULARIO */}
      <Modal
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
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

      {/* 🆕 DRAWER DE DETALHES */}
      {openDrawer && (
        <CRMLeadDetailDrawer
          leadId={openDrawer}
          onClose={() => setOpenDrawer(null)}
          onEdit={(lead) => {
            setEditing(lead);
            setOpenDrawer(null);
            setOpenForm(true);
          }}
        />
      )}
    </div>
  );
}
