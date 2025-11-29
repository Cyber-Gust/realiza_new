"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Plus,
  Loader2,
  Edit,
  Trash2,
  AlertTriangle,
  Search,
  RefreshCcw,
} from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import Badge from "@/components/admin/ui/Badge";
import { Input, Select } from "@/components/admin/ui/Form";

import ContratoForm from "./ContratoForm";
import ContratoDetailDrawer from "./ContratoDetailDrawer";

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/Table";
import SearchableSelect from "../admin/ui/SearchableSelect";

export default function CRMContratosPanel() {
  const [contratos, setContratos] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [pessoas, setPessoas] = useState([]);

  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [openDrawer, setOpenDrawer] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  const [filters, setFilters] = useState({
    search: "",
    tipo: "",
    status: "",
    imovel_id: "",
    pessoa_id: "",
  });

  /* ============================================================
     LOAD
  ============================================================ */
  const loadData = async () => {
    try {
      setLoading(true);

      const [contratosRes, imoveisRes, pessoasRes] = await Promise.all([
        fetch("/api/contratos", { cache: "no-store" }),
        fetch("/api/imoveis", { cache: "no-store" }),
        fetch("/api/perfis/list?type=personas", { cache: "no-store" }),
      ]);

      const [contJson, imvJson, pplJson] = await Promise.all([
        contratosRes.json(),
        imoveisRes.json(),
        pessoasRes.json(),
      ]);

      if (!contratosRes.ok) throw new Error(contJson.error);
      if (!imoveisRes.ok) throw new Error(imvJson.error);
      if (!pessoasRes.ok) throw new Error(pplJson.error);

      setContratos(contJson.data || []);
      setImoveis(imvJson.data || []);
      setPessoas(pplJson.data || []);
    } catch (err) {
      toast.error("Erro ao carregar contratos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ============================================================
     FILTRAGEM
  ============================================================ */
  const filtered = useMemo(() => {
    return contratos.filter((c) => {
      if (filters.tipo && c.tipo !== filters.tipo) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.imovel_id && c.imovel_id !== filters.imovel_id) return false;
      if (filters.pessoa_id && ![c.proprietario_id, c.inquilino_id].includes(filters.pessoa_id)) return false;

      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (
          !(
            c.imoveis?.titulo?.toLowerCase().includes(s) ||
            c.proprietario?.nome_completo?.toLowerCase().includes(s) ||
            c.inquilino?.nome_completo?.toLowerCase().includes(s)
          )
        )
          return false;
      }

      return true;
    });
  }, [contratos, filters]);

  /* ============================================================
     DELETE
  ============================================================ */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/contratos?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(`Contrato removido com sucesso!`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  /* ============================================================
     UI
  ============================================================ */
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-200">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between gap-3 md:items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2 tracking-tight">
          <FileText size={20} /> Contratos
        </h3>

        <Button onClick={() => setOpenForm(true)} className="flex items-center gap-2">
          <Plus size={16} /> Novo Contrato
        </Button>
      </div>

      {/* FILTROS */}
      <Card className="p-5 bg-panel-card border-border shadow-sm z-[999] rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">

          {/* SEARCH */}
          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-panel-card">
            <Search size={14} className="text-muted-foreground" />
            <input
              placeholder="Buscar contrato..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <Select
            value={filters.tipo}
            onChange={(e) => setFilters((f) => ({ ...f, tipo: e.target.value }))}
          >
            <option value="">Tipo</option>
            <option value="locacao">Locação</option>
            <option value="venda">Venda</option>
            <option value="administracao">Administração</option>
          </Select>

          <Select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">Status</option>
            <option value="em_elaboracao">Em Elaboração</option>
            <option value="aguardando_assinatura">Aguardando Assinatura</option>
            <option value="assinado">Assinado</option>
            <option value="vigente">Vigente</option>
            <option value="reajuste_pendente">Reajuste Pendente</option>
            <option value="renovacao_pendente">Renovação Pendente</option>
            <option value="encerrado">Encerrado</option>
          </Select>

          <SearchableSelect
            value={filters.imovel_id}
            onChange={(val) =>
              setFilters((f) => ({ ...f, imovel_id: val }))
            }
            options={imoveis.map((i) => ({
              value: i.id,
              label: i.titulo
            }))}
            placeholder="Imóvel"
          />

          <SearchableSelect
            value={filters.pessoa_id}
            onChange={(val) =>
              setFilters((f) => ({ ...f, pessoa_id: val }))
            }
            options={pessoas.map((p) => ({
              value: p.id,
              label: p.nome
            }))}
            placeholder="Pessoa"
          />

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

      {/* LISTAGEM */}
      {loading ? (
        <div className="flex justify-center items-center z-0 py-14 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground z-0 bg-panel-card border-border rounded-xl">
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
                onClick={() => setOpenDrawer(c.id)}
              >
                <TableCell>{c.imoveis?.titulo || "-"}</TableCell>
                <TableCell className="capitalize">{c.tipo}</TableCell>
                <TableCell>{c.proprietario?.nome_completo || "-"}</TableCell>
                <TableCell>{c.inquilino?.nome_completo || "-"}</TableCell>
                <TableCell>R$ {Number(c.valor_acordado).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge status={c.status} className="capitalize">{c.status}</Badge>
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

                  {/* DELETAR */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(c);
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

      {/* FORM */}
      <Modal
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        title={editing ? "Editar Contrato" : "Novo Contrato"}
      >
        <ContratoForm
          contrato={editing}
          onSaved={loadData}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
        />
      </Modal>

      {/* CONFIRMAR DELETE */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Contrato"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-1" />
              <div>
                <p>
                  Remover o contrato do imóvel{" "}
                  <strong>{deleteTarget.imoveis?.titulo}</strong>?
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="w-1/2" onClick={() => setDeleteTarget(null)}>
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
        <ContratoDetailDrawer
          contratoId={openDrawer}
          onClose={() => setOpenDrawer(null)}
          onEdit={(c) => {
            setEditing(c);
            setOpenDrawer(null);
            setOpenForm(true);
          }}
        />
      )}
    </div>
  );
}
