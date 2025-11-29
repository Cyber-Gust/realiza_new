"use client";

import { useEffect, useState, useMemo } from "react";
import {
  UserCog,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Search,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";

import Image from "next/image";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";

import { Input, Select } from "@/components/admin/ui/Form";
import { Table, TableHead, TableHeader, TableRow, TableCell } from "@/components/admin/ui/Table";

import { useToast } from "@/contexts/ToastContext";

import PerfilFormEquipe from "./PerfilFormEquipe";
import PerfisEquipeDrawer from "./PerfisEquipeDrawer";
import Badge from "../admin/ui/Badge";

export default function PerfisEquipePanel() {
  const toast = useToast();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  // Drawer
  const [openDrawer, setOpenDrawer] = useState(null);

  // Modal delete
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Filtros
  const [filters, setFilters] = useState({
    search: "",
    role: "",
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

      const res = await fetch("/api/perfis/list?type=equipe", {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setProfiles(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar equipe: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ========================================================================
     FILTRAGEM
  ======================================================================== */
  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      if (filters.role && p.role !== filters.role) return false;

      if (filters.search) {
        const s = filters.search.toLowerCase();

        if (
          !(
            p.nome_completo?.toLowerCase().includes(s) ||
            p.email?.toLowerCase().includes(s) ||
            p.telefone?.toLowerCase().includes(s)
          )
        )
          return false;
      }

      return true;
    });
  }, [profiles, filters]);

  /* ========================================================================
     HANDLER DELETE
  ======================================================================== */

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);

      const res = await fetch("/api/perfis/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deleteTarget.id,
          type: "equipe",
        }),
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Perfil removido com sucesso!");

      setDeleteTarget(null);
      load(); // recarregar lista
    } catch (err) {
      toast.error("Erro ao remover: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  /* ========================================================================
     RENDER
  ======================================================================== */

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-200">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground tracking-tight">
          <UserCog size={20} /> Equipe cadastrada
        </h3>

        <Button
          onClick={() => setOpenForm(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Novo membro
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="p-5 bg-panel-card border-border shadow-sm rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-panel-card">
            <Search size={14} className="text-muted-foreground" />
            <input
              placeholder="Buscar por nome, email ou telefone…"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <Select
            value={filters.role}
            onChange={(e) =>
              setFilters((f) => ({ ...f, role: e.target.value }))
            }
          >
            <option value="">Todos os cargos</option>
            <option value="admin">Admin</option>
            <option value="corretor">Corretor</option>
          </Select>

          <div className="flex items-center">
            <Button
              variant="secondary"
              className="w-full flex items-center gap-2"
              onClick={() => setFilters({ search: "", role: "" })}
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
          Nenhum membro encontrado com os filtros aplicados.
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membro</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cargo</TableHead>
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
        
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-9">
                      <Image
                        src={getImageSrc(p.avatar_url)}
                        alt={p.nome || p.nome_completo}
                        fill
                        className="rounded-full object-cover border border-border"
                        sizes="36px"
                      />
                    </div>
                    <span>{p.nome || p.nome_completo}</span>
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground">
                  {p.email}
                </TableCell>

                <TableCell>{p.telefone || "-"}</TableCell>

                <TableCell>
                  <Badge status={p.role} />
                </TableCell>

                {/* AÇÕES */}
                <TableCell className="text-right flex justify-end gap-2">

                  {/* Admin NÃO tem ações */}
                  {p.role !== "admin" && (
                    <>

                      {/* EDITAR */}
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

                      {/* REMOVER */}
                      {p.role === "corretor" && (
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
                      )}

                    </>
                  )}

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
        title={editing ? "Editar membro da equipe" : "Novo membro da equipe"}
      >
        <PerfilFormEquipe
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
        <PerfisEquipeDrawer
          profileId={openDrawer}
          onClose={() => setOpenDrawer(null)}
          onEdit={(p) => {
            setEditing(p);
            setOpenDrawer(null);
            setOpenForm(true);
          }}
          reload={load}
        />
      )}

      {/* MODAL CONFIRMAR DELETE */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover membro"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-1" />
              <div>
                <p>
                  Remover o membro <strong>{deleteTarget.nome_completo}</strong>?
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cargo: {deleteTarget.role}
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
