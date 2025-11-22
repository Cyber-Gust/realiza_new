"use client";

import { useEffect, useState } from "react";

// UI
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import { Button } from "@/components/admin/ui/Button";
import Badge from "@/components/admin/ui/Badge";

// Toast
import { useToast } from "@/contexts/ToastContext";

import {
  Loader2,
  Plus,
  Wrench,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
} from "lucide-react";

import OrdemServicoForm from "./OrdemServicoForm";
import OrdemServicoDetailDrawer from "./OrdemServicoDetailDrawer";

export default function OrdensServicoPanel() {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [filter, setFilter] = useState("todas");

  const toast = useToast();

  const loadOrdens = async () => {
    try {
      setLoading(true);
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
  };

  useEffect(() => {
    loadOrdens();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget?.id) return toast.error("ID inválido!");

    try {
      const res = await fetch("/api/manutencao/ordens-servico", {
        method: "DELETE",
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Ordem de serviço removida!", "");

      setDeleteTarget(null);
      loadOrdens();
    } catch (err) {
      toast.error("Erro ao excluir", err.message);
    }
  };

  const filtered =
    filter === "todas"
      ? ordens
      : ordens.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Wrench size={18} /> Ordens de Serviço
        </h3>

        <div className="flex items-center gap-2">
          {/* Filtro */}
          <select
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="aberta">Abertas</option>
            <option value="orcamento">Orçamento</option>
            <option value="em_execucao">Em Execução</option>
            <option value="concluida">Concluídas</option>
            <option value="cancelada">Canceladas</option>
          </select>

          <Button
            onClick={() => setOpenForm(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} /> Nova OS
          </Button>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <p className="p-4 text-center text-muted-foreground">
          Nenhuma OS encontrada.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((os) => (
            <Card
              key={os.id}
              className="p-4 space-y-2 hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelected(os.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground">
                    {os.imovel?.titulo || "Imóvel não informado"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {os.descricao_problema?.slice(0, 60)}...
                  </p>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(os);
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
                      setDeleteTarget(os);
                    }}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {new Date(os.created_at).toLocaleDateString("pt-BR")}
                </span>

                <Badge status={os.status}>{os.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        title={editing ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
      >
        <OrdemServicoForm
          ordem={editing}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          onSaved={loadOrdens}
        />
      </Modal>

      {/* Modal Exclusão */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Ordem de Serviço"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-foreground">
              <AlertTriangle className="text-red-500 mt-1" />
              <p>
                Tem certeza que deseja remover a OS do imóvel{" "}
                <strong>{deleteTarget.imovel?.titulo}</strong>?
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                className="w-1/2"
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </Button>

              <Button
                className="w-1/2 bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Drawer Detalhes */}
      {selected && (
        <OrdemServicoDetailDrawer
          ordemId={selected}
          onClose={() => setSelected(null)}
          onUpdated={loadOrdens}
        />
      )}
    </div>
  );
}
