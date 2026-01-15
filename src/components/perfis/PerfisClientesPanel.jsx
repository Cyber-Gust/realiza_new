"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  User2,
  Plus,
  Loader2,
  Edit,
  Search,
  RefreshCcw,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import Badge from "@/components/admin/ui/Badge";

import { Input } from "@/components/admin/ui/Form";
import { Table, TableHead, TableHeader, TableRow, TableCell } from "@/components/admin/ui/Table";

import { useToast } from "@/contexts/ToastContext";

import PerfilFormCliente from "./PerfilFormCliente";
import PerfisClienteDrawer from "./PerfisClienteDrawer"; // 🆕 vamos criar depois
import Image from "next/image";

export default function PerfisClientesPanel() {
  const toast = useToast();

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // Modal form
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  // Drawer
  const [openDrawer, setOpenDrawer] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    search: "",
    origem: "",
  });

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);

      const res = await fetch("/api/perfis/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id, type: "clientes" }),
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Cliente removido com sucesso!");
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error("Erro ao remover: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getImageSrc = (foto) => {
    if (!foto || typeof foto !== "string") return "/placeholder-avatar.png";

    // se já é um caminho local válido
    if (foto.startsWith("/")) return foto;

    // se é uma URL https válida (CDN, S3, Cloudflare, Supabase, etc.)
    if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;

    // fallback caso venha só o nome do arquivo
    return "/" + foto;
  };

  /* ========================================================================
     LOAD CLIENTES
  ======================================================================== */
  const load = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/perfis/list?type=clientes", {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // filtra só clientes
      const data = json.data || [];

      setClientes(data);
    } catch (err) {
      toast.error("Erro ao carregar clientes: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  /* ========================================================================
     FILTERED LIST
  ======================================================================== */
  const filtered = useMemo(() => {
    return clientes.filter((p) => {
      if (filters.origem && !p.origem?.toLowerCase().includes(filters.origem.toLowerCase())) {
        return false;
      }

      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (
          !(
            p.nome?.toLowerCase().includes(s) ||
            p.email?.toLowerCase().includes(s) ||
            p.telefone?.toLowerCase().includes(s) ||
            p.cpf_cnpj?.toLowerCase().includes(s)
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [clientes, filters]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-200">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground tracking-tight">
          <User2 size={20} /> Clientes cadastrados
        </h3>

        <Button onClick={() => setOpenForm(true)} className="flex items-center gap-2">
          <Plus size={16} /> Novo Cliente
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="p-5 bg-panel-card border-border shadow-sm rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          {/* SEARCH */}
          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-panel-card">
            <Search size={14} className="text-muted-foreground" />
            <input
              placeholder="Buscar nome, email, telefone ou CPF..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          {/* ORIGEM */}
          <Input
            placeholder="Filtrar por origem"
            value={filters.origem}
            onChange={(e) =>
              setFilters((f) => ({ ...f, origem: e.target.value }))
            }
          />

          {/* RESET */}
          <div className="flex items-center">
            <Button
              variant="secondary"
              className="w-full flex items-center gap-2"
              onClick={() => setFilters({ search: "", origem: "" })}
            >
              <RefreshCcw size={14} /> Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* LISTA */}
      {loading ? (
        <div className="flex justify-center items-center py-14 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground bg-panel-card border-border rounded-xl">
          Nenhum cliente encontrado.
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contato</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {filtered.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-muted/20 transition"
                onClick={() => setOpenDrawer(c.id)}
              >
                {/* FOTO + NOME */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9">
                      <Image
                        src={getImageSrc(c.foto)}
                        alt={c.nome}
                        fill
                        className="rounded-full object-cover border border-border"
                        sizes="36px"
                      />
                    </div>
                    <span>{c.nome}</span>
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {c.email || "-"}
                </TableCell>

                <TableCell>{c.telefone || "-"}</TableCell>

                {/* BADGE DE ORIGEM */}
                <TableCell>
                  <Badge status={c.origem || "Manual"} />
                </TableCell>

                <TableCell className="text-right flex justify-end gap-2">

                  {/* EDITAR */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(c);
                      setOpenForm(true);
                    }}
                  >
                    <Edit size={16} />
                  </Button>

                  {/* REMOVER */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(c);
                    }}
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </Button>

                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}

      {/* FORM DE CRIAÇÃO / EDIÇÃO */}
      <Modal
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        title={editing ? "Editar Cliente" : "Novo Cliente"}
      >
        <PerfilFormCliente
          modo={editing ? "edit" : "create"}
          dadosIniciais={editing || {}}
          onSuccess={() => {
            setOpenForm(false);
            setEditing(null);
            load();
          }}
        />
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Cliente"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-1" />
              <div>
                <p>
                  Remover <strong>{deleteTarget.nome}</strong>?
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Origem: {deleteTarget.origem || "Manual"}
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
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Removendo...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>  

      {/* DRAWER */}
      {openDrawer && (
        <PerfisClienteDrawer
          clienteId={openDrawer}
          onClose={() => setOpenDrawer(null)}
          onEdit={(c) => {
            setEditing(c);
            setOpenDrawer(null);
            setOpenForm(true);
          }}
          reload={load}
        />
      )}
    </div>
  );
}
