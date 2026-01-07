"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

// UI
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Select } from "@/components/admin/ui/Form";
import Badge from "@/components/admin/ui/Badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/Table";

// Toast
import { useToast } from "@/contexts/ToastContext";

export default function VistoriasPanel({
  onAdd,
  onEdit,
  onDelete,
  onSelect,
}) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [vistorias, setVistorias] = useState([]);

  const [filters, setFilters] = useState({
    tipo: "",
    status: "",
    search: "",
  });

  /* ===============================
      LOAD
  =============================== */
  const loadVistorias = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/manutencao/vistorias", {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setVistorias(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar vistorias", err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadVistorias();
  }, [loadVistorias]);

  /* ===============================
      FILTROS
  =============================== */
  const filtered = useMemo(() => {
    return vistorias.filter((v) => {
      if (filters.tipo && v.tipo !== filters.tipo) return false;
      if (filters.status && v.status !== filters.status) return false;

      if (filters.search) {
        const s = filters.search.toLowerCase();
        const match =
          v.imovel?.titulo?.toLowerCase().includes(s) ||
          v.tipo?.toLowerCase().includes(s);

        if (!match) return false;
      }

      return true;
    });
  }, [vistorias, filters]);

  /* ===============================
      UI
  =============================== */
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-150">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <ClipboardList size={20} /> Vistorias
        </h3>

        <Button
          onClick={() => onAdd?.(loadVistorias)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Nova Vistoria
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="p-4 bg-panel-card rounded-xl border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">

          {/* Buscar */}
          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2">
            <Search size={14} className="text-muted-foreground" />
            <input
              placeholder="Buscar por imóvel ou tipo..."
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          {/* Tipo */}
          <Select
            value={filters.tipo}
            onChange={(e) =>
              setFilters((f) => ({ ...f, tipo: e.target.value }))
            }
          >
            <option value="">Tipo</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="preventiva">Preventiva</option>
            <option value="outra">Outra</option>
          </Select>

          {/* Status */}
          <Select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="">Status</option>
            <option value="pendente">Pendente</option>
            <option value="incompleta">Incompleta</option>
            <option value="realizada">Realizada</option>
            <option value="cancelada">Cancelada</option>
          </Select>

          <Button
            variant="secondary"
            onClick={() =>
              setFilters({
                tipo: "",
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
          Nenhuma vistoria encontrada.
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Imóvel</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Evidências</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {filtered.map((v) => (
              <TableRow
                key={v.id}
                className="cursor-pointer hover:bg-muted/20 transition"
                onClick={() => onSelect?.(v.id)}
              >
                <TableCell className="capitalize font-medium">
                  {v.tipo}
                </TableCell>

                <TableCell>
                  {v.imovel?.titulo || "Imóvel não informado"}
                </TableCell>

                <TableCell>
                  {v.data_vistoria
                    ? new Date(v.data_vistoria).toLocaleDateString("pt-BR")
                    : "—"}
                </TableCell>

                <TableCell>
                  <Badge status={v.status} />
                </TableCell>

                {/* EVIDÊNCIAS */}
                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    {v.documento_laudo_url && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <FileText size={14} /> Laudo
                      </span>
                    )}
                    {v.fotos_json?.length > 0 && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <ImageIcon size={14} /> {v.fotos_json.length}
                      </span>
                    )}
                    {!v.documento_laudo_url &&
                      (!v.fotos_json || v.fotos_json.length === 0) && (
                        <span className="text-yellow-600">
                          Nenhuma
                        </span>
                      )}
                  </div>
                </TableCell>

                {/* AÇÕES */}
                <TableCell className="text-right flex justify-end gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(v, loadVistorias);
                    }}
                  >
                    <Edit size={16} />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(v, loadVistorias);
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
