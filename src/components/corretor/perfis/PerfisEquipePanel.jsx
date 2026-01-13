"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  UserCog,
  Loader2,
  Search,
  RefreshCcw,
} from "lucide-react";

import Image from "next/image";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";

import { Select } from "@/components/admin/ui/Form";
import { Table, TableHead, TableHeader, TableRow, TableCell } from "@/components/admin/ui/Table";

import { useToast } from "@/contexts/ToastContext";

import PerfisEquipeDrawer from "./PerfisEquipeDrawer";
import Badge from "../../admin/ui/Badge";

export default function PerfisEquipePanel() {
  const toast = useToast();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drawer
  const [openDrawer, setOpenDrawer] = useState(null);

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

  const load = useCallback(async () => {
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
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

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
     RENDER
  ======================================================================== */

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-200">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground tracking-tight">
          <UserCog size={20} /> Equipe cadastrada
        </h3>
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

              </TableRow>
            ))}
          </tbody>
        </Table>
      )}

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
    </div>
  );
}
