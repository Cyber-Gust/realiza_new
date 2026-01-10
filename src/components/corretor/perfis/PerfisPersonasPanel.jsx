"use client";

import { useEffect, useState, useMemo } from "react";
import {
  UsersRound,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Search,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";

import { Select } from "@/components/admin/ui/Form";
import { Table, TableHead, TableHeader, TableRow, TableCell } from "@/components/admin/ui/Table";

import { useToast } from "@/contexts/ToastContext";

import PerfilFormPersonas from "./PerfilFormPersonas";
import PerfisPersonasDrawer from "./PerfisPersonasDrawer";
import Badge from "../admin/ui/Badge";
import Image from "next/image";

const PERSONA_TIPOS = ["proprietario", "inquilino"];

export default function PerfisPersonasPanel() {
  const toast = useToast();

  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [openDrawer, setOpenDrawer] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    tipo: "",
  });

  const getImageSrc = (foto) => {
    if (!foto || typeof foto !== "string") return "/placeholder-avatar.png";
    if (foto.startsWith("/")) return foto;
    if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
    return "/" + foto;
  };

  const load = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/perfis/list?type=personas", {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      let lista = (json.data || []).filter((p) =>
        ["proprietario", "inquilino"].includes(p.tipo)
      );

      setPersonas(lista);
    } catch (err) {
      toast.error("Erro ao carregar pessoas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function run() {
      await load();
    }
    run();
  }, []);

  const filtered = useMemo(() => {
    return personas.filter((p) => {
      if (filters.tipo && p.tipo !== filters.tipo) return false;

      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (
          !(
            p.nome?.toLowerCase().includes(s) ||
            p.email?.toLowerCase().includes(s) ||
            p.telefone?.toLowerCase().includes(s) ||
            p.cpf_cnpj?.toLowerCase().includes(s)
          )
        )
          return false;
      }

      return true;
    });
  }, [personas, filters]);

  // DELETE
  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);

      const res = await fetch("/api/perfis/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deleteTarget.id,
          type: "personas",
        }),
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Cadastro removido com sucesso!");

      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error("Erro ao remover: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-x-hidden max-w-full">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground tracking-tight">
          <UsersRound size={20} /> Proprietários & Inquilinos
        </h3>

        <Button onClick={() => setOpenForm(true)} className="flex items-center gap-2">
          <Plus size={16} /> Novo Cadastro
        </Button>
      </div>

      {/* FILTERS */}
      <Card className="p-5 bg-panel-card border-border shadow-sm rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-panel-card">
            <Search size={14} className="text-muted-foreground" />
            <input
              placeholder="Buscar por nome, email, telefone ou CPF..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <Select
            value={filters.tipo}
            onChange={(e) =>
              setFilters((f) => ({ ...f, tipo: e.target.value }))
            }
          >
            <option value="">Todos</option>
            {PERSONA_TIPOS.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </Select>

          <div className="flex items-center">
            <Button
              variant="secondary"
              className="w-full flex items-center gap-2"
              onClick={() => setFilters({ search: "", tipo: "" })}
            >
              <RefreshCcw size={14} /> Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* TABLE */}
      {loading ? (
        <div className="flex justify-center items-center py-14 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground bg-panel-card border-border rounded-xl">
          Nenhum cadastro encontrado.
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {filtered.map((p) => (
              <TableRow
                key={p.id}
                className="cursor-pointer hover:bg-muted/20 transition"
                onClick={() => setOpenDrawer(p.id)}
              >
                {/* USUÁRIO */}
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-9 h-9 shrink-0">
                      <Image
                        src={getImageSrc(p.foto)}
                        alt={p.nome}
                        fill
                        className="rounded-full object-cover border border-border"
                        sizes="36px"
                      />
                    </div>

                    <span className="truncate">{p.nome}</span>
                  </div>
                </TableCell>

                {/* EMAIL */}
                <TableCell className="text-muted-foreground truncate max-w-[180px]">
                  {p.email || "-"}
                </TableCell>

                {/* TELEFONE */}
                <TableCell className="truncate max-w-[130px]">
                  {p.telefone || "-"}
                </TableCell>

                {/* TIPO */}
                <TableCell>
                  <Badge status={p.tipo} />
                </TableCell>

                {/* AÇÕES */}
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(p);
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
                        setDeleteTarget(p);
                      }}
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}


      {/* FORM */}
      <Modal
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        title={editing ? "Editar Pessoa" : "Novo Cadastro"}
      >
        <PerfilFormPersonas
          modo={editing ? "edit" : "create"}
          dadosIniciais={editing || {}}
          onSuccess={() => {
            setOpenForm(false);
            setEditing(null);
            load();
          }}
        />
      </Modal>

      {/* DRAWER */}
      {openDrawer && (
        <PerfisPersonasDrawer
          personaId={openDrawer}
          onClose={() => setOpenDrawer(null)}
          onEdit={(p) => {
            setEditing(p);
            setOpenDrawer(null);
            setOpenForm(true);
          }}
          reload={load}
        />
      )}

      {/* CONFIRM DELETE */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Pessoa"
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
                  Tipo: {deleteTarget.tipo}
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

    </div>
  );
}
