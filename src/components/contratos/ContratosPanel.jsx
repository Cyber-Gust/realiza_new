"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Plus,
  Loader2,
  Edit,
  Trash2,
  Search,
  RefreshCcw,
} from "lucide-react";

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

import SearchableSelect from "@/components/admin/ui/SearchableSelect";
import { useToast } from "@/contexts/ToastContext";

export default function CRMContratosPanel({
  onOpenForm,
  onOpenDelete,
  onOpenDrawer,
}) {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [statusList, setStatusList] = useState([]);


  const [filters, setFilters] = useState({
    search: "",
    tipo: "",
    status: "",
    imovel_id: "",
    pessoa_id: "",
  });

  /* ===========================================
     LOAD DATA
  ============================================ */
  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, iRes, pRes] = await Promise.all([
        fetch("/api/contratos", { cache: "no-store" }),
        fetch("/api/imoveis", { cache: "no-store" }),
        fetch("/api/perfis/list?type=personas", { cache: "no-store" }),
      ]);

      const [cJson, iJson, pJson] = await Promise.all([
        cRes.json(),
        iRes.json(),
        pRes.json(),
      ]);

      if (!cRes.ok) throw new Error(cJson.error);
      if (!iRes.ok) throw new Error(iJson.error);
      if (!pRes.ok) throw new Error(pJson.error);

      setContratos(cJson.data || []);
      setStatusList(cJson.status_enum || []);
      setImoveis(iJson.data || []);
      setPessoas(pJson.data || []);
    } catch (err) {
      toast.error(`Erro ao carregar contratos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ===========================================
     FILTROS ➝ SUPER OTIMIZADOS
  ============================================ */
  const filtered = useMemo(() => {
    return contratos.filter((c) => {
      if (filters.tipo && c.tipo !== filters.tipo) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.imovel_id && c.imovel_id !== filters.imovel_id) return false;

      if (
        filters.pessoa_id &&
        ![c.proprietario_id, c.inquilino_id].includes(filters.pessoa_id)
      )
        return false;

      if (filters.search) {
        const s = filters.search.toLowerCase();
        const match =
          c.imoveis?.titulo?.toLowerCase().includes(s) ||
          c.proprietario?.nome?.toLowerCase().includes(s) ||
          c.inquilino?.nome?.toLowerCase().includes(s);

        if (!match) return false;
      }

      return true;
    });
  }, [contratos, filters]);

  /* ===========================================
     UI
  ============================================ */
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-150">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h3 className="text-xl font-semibold flex items-center gap-2 tracking-tight">
          <FileText size={20} /> Contratos
        </h3>

        <Button
          onClick={() => onOpenForm?.(null)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Novo Contrato
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="p-5 bg-panel-card rounded-xl border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">

          {/* Buscar */}
          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2">
            <Search size={14} className="text-muted-foreground" />
            <input
              placeholder="Buscar contrato..."
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
            <option value="locacao">Locação</option>
            <option value="venda">Venda</option>
            <option value="administracao">Administração</option>
          </Select>

          {/* Status */}
          <Select
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="">Status</option>

            {statusList.map((st) => (
              <option key={st} value={st}>
                {st.replaceAll("_", " ")}
              </option>
            ))}
          </Select>

          {/* Imóvel */}
          <SearchableSelect
            value={filters.imovel_id}
            onChange={(val) =>
              setFilters((f) => ({ ...f, imovel_id: val }))
            }
            options={imoveis.map((i) => ({
              value: i.id,
              label: i.titulo,
            }))}
            placeholder="Imóvel"
          />

          {/* Pessoa */}
          <SearchableSelect
            value={filters.pessoa_id}
            onChange={(val) =>
              setFilters((f) => ({ ...f, pessoa_id: val }))
            }
            options={pessoas.map((p) => ({
              value: p.id,
              label: p.nome,
            }))}
            placeholder="Pessoa"
          />

          {/* Reset */}
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={() =>
              setFilters({
                search: "",
                tipo: "",
                status: "",
                imovel_id: "",
                pessoa_id: "",
              })
            }
          >
            <RefreshCcw size={14} /> Reset
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
          Nenhum contrato encontrado.
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imóvel</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Proprietário</TableHead>
              <TableHead>Inquilino</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {filtered.map((c) => (
              <TableRow
                key={c.id}
                className="cursor-pointer hover:bg-muted/20 transition"
                onClick={() => onOpenDrawer?.(c.id)}
              >
                <TableCell>{c.imoveis?.titulo || "-"}</TableCell>

                <TableCell className="capitalize">
                  {c.tipo?.replace("_", " ")}
                </TableCell>

                <TableCell>{c.proprietario?.nome || "-"}</TableCell>
                <TableCell>{c.inquilino?.nome || "-"}</TableCell>

                <TableCell>
                  R$ {Number(c.valor_acordado).toFixed(2)}
                </TableCell>

                <TableCell>
                  <Badge status={c.status} className="capitalize">
                    {c.status.replace("_", " ")}
                  </Badge>
                </TableCell>

                <TableCell className="text-right flex justify-end gap-2">

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenForm?.(c);
                    }}
                  >
                    <Edit size={16} />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDelete?.(c);
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
