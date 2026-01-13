"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  UsersRound,
  Plus,
  Loader2,
  Search,
  RefreshCcw,
} from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";

import { Select } from "@/components/admin/ui/Form";
import { Table, TableHead, TableHeader, TableRow, TableCell } from "@/components/admin/ui/Table";

import { useToast } from "@/contexts/ToastContext";

import PerfilFormPersonas from "./PerfilFormPersonas";
import PerfisPersonasDrawer from "./PerfisPersonasDrawer";
import Badge from "../../admin/ui/Badge";
import Image from "next/image";

const PERSONA_TIPOS = ["proprietario", "inquilino"];

export default function PerfisPersonasPanel() {
  const toast = useToast();

  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);

  const [openDrawer, setOpenDrawer] = useState(null);


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

  const load = useCallback(async () => {
      try {
          setLoading(true);
          const res = await fetch("/api/perfis/list?type=personas", {
              cache: "no-store",
          });

          const json = await res.json();
          if (!res.ok) throw new Error(json.error);

          const lista = (json.data || []).filter((p) =>
              ["proprietario", "inquilino"].includes(p.tipo)
          );

          setPersonas(lista);
      } catch (err) {
          toast.error("Erro ao carregar pessoas: " + err.message);
      } finally {
          setLoading(false);
      }
  }, [toast]); // Array vazio se setLoading e setPersonas forem estáveis (padrão do useState)

  useEffect(() => {
      load();
  }, [load]);

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
  }, [personas, filters])

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
        }}
        title={"Novo Cadastro"}
      >
        <PerfilFormPersonas
          modo={"create"}
          onSuccess={() => {
            setOpenForm(false);
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
            setOpenDrawer(null);
            setOpenForm(true);
          }}
          reload={load}
        />
      )}

    </div>
  );
}
