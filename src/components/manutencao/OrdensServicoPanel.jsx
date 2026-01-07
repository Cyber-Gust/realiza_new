"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Wrench,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";

// UI
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Select } from "@/components/admin/ui/Form";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/Table";
import Modal from "@/components/admin/ui/Modal";

// Toast
import { useToast } from "@/contexts/ToastContext";

export default function OrdensServicoPanel({
  onAdd,
  onEdit,
  onDelete,
  onSelect,
}) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [ordens, setOrdens] = useState([]);

  const [filters, setFilters] = useState({
    status: "",
    search: "",
  });

  /* ===============================
      LOAD
  =============================== */

  const loadOrdens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/manutencao/ordens-servico", {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setOrdens(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar OS", err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadOrdens();
  }, [loadOrdens]);

  /* ===============================
      FILTROS
  =============================== */

  const filtered = useMemo(() => {
    return ordens.filter((o) => {
      if (filters.status && o.status !== filters.status) return false;

      if (filters.search) {
        const s = filters.search.toLowerCase();

        const match =
          o.nome?.toLowerCase().includes(s) ||
          o.descricao_problema?.toLowerCase().includes(s) ||
          o.imovel?.titulo?.toLowerCase().includes(s) ||
          o.imovel?.codigo_ref?.toLowerCase().includes(s);

        if (!match) return false;
      }

      return true;
    });
  }, [ordens, filters]);

  /* ===============================
      UI
  =============================== */

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-150">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Wrench size={20} /> Ordens de Serviço
        </h3>

        <Button
          onClick={() => onAdd?.(loadOrdens)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Nova OS
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="p-4 bg-panel-card rounded-xl border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          {/* Buscar */}
          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2">
            <Search size={14} className="text-muted-foreground" />
            <input
              placeholder="Buscar por descrição ou imóvel..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          {/* Status */}
          <Select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="">Status</option>
            <option value="aberta">Aberta</option>
            <option value="orcamento">Orçamento</option>
            <option value="aprovada_pelo_inquilino">
              Aprovada pelo Inquilino
            </option>
            <option value="aprovada_pelo_proprietario">
              Aprovada pelo Proprietário
            </option>
            <option value="em_execucao">Em Execução</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </Select>

          {/* Reset */}
          <Button
            variant="secondary"
            onClick={() =>
              setFilters({
                status: "",
                search: "",
              })
            }
          >
            Limpar filtros
          </Button>
        </div>
      </Card>

      {/* LISTA */}
      {loading ? (
        <div className="flex justify-center items-center py-14 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground bg-panel-card border-border rounded-xl">
          Nenhuma ordem de serviço encontrada.
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Imóvel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {filtered.map((os) => (
              <TableRow
                key={os.id}
                className="cursor-pointer hover:bg-muted/20 transition"
                onClick={() => onSelect?.(os.id, loadOrdens)}
              >
                <TableCell className="font-medium">
                  {os.nome || "—"}
                </TableCell>

                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{os.imovel?.titulo || "Imóvel não informado"}</span>
                    <span className="text-xs text-muted-foreground">
                      Código: {os.imovel?.codigo_ref || "—"}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge status={os.status}>
                    {os.status?.replaceAll("_", " ")}
                  </Badge>
                </TableCell>

                <TableCell>
                  {new Date(os.created_at).toLocaleDateString("pt-BR")}
                </TableCell>

                <TableCell className="text-right flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(os, loadOrdens);
                    }}
                  >
                    <Edit size={16} />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(os, loadOrdens); // 🔥 só isso
                    }}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}

     
    </div>
  );
}
