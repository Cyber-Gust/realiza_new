"use client";

import { useEffect, useState } from "react";

// UI
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import { Button } from "@/components/admin/ui/Button";

// Toast Context
import { useToast } from "@/contexts/ToastContext";

import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

import VistoriaForm from "./VistoriaForm";
import VistoriaDetailDrawer from "./VistoriaDetailDrawer";

export default function VistoriasPanel() {
  const [vistorias, setVistorias] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const toast = useToast();

  const loadVistorias = async () => {
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
  };

  useEffect(() => {
    loadVistorias();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget?.id) {
      toast.error("ID inválido!");
      return;
    }

    try {
      const res = await fetch("/api/manutencao/vistorias", {
        method: "DELETE",
        body: JSON.stringify({ id: deleteTarget.id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Vistoria removida com sucesso!", "");

      setDeleteTarget(null);
      loadVistorias();
    } catch (err) {
      toast.error("Erro ao remover vistoria", err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ClipboardList size={18} /> Vistorias
        </h3>

        <Button
          onClick={() => setOpenForm(true)}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Nova Vistoria
        </Button>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : vistorias.length === 0 ? (
        <p className="p-4 text-center text-muted-foreground">
          Nenhuma vistoria cadastrada.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {vistorias.map((v) => (
            <Card
              key={v.id}
              className="p-4 space-y-2 hover:shadow-lg transition cursor-pointer"
              onClick={() => setSelected(v.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground">{v.tipo}</h4>
                  <p className="text-sm text-muted-foreground">
                    {v.imovel?.titulo || "Imóvel não informado"}
                  </p>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(v);
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
                      setDeleteTarget(v);
                    }}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {v.data_vistoria
                    ? new Date(v.data_vistoria).toLocaleDateString("pt-BR")
                    : "--"}
                </span>

                {v.documento_laudo_url ? (
                  <span className="text-emerald-600 font-medium">Com Laudo</span>
                ) : (
                  <span className="text-yellow-600 font-medium">Sem Laudo</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL FORM */}
      <Modal
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        title={editing ? "Editar Vistoria" : "Nova Vistoria"}
      >
        <VistoriaForm
          vistoria={editing}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          onSaved={loadVistorias}
        />
      </Modal>

      {/* MODAL EXCLUSÃO */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Vistoria"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-foreground">
              <AlertTriangle className="text-red-500 mt-1" />
              <p>
                Deseja remover a vistoria do imóvel{" "}
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

      {/* DRAWER DETALHES */}
      {selected && (
        <VistoriaDetailDrawer
          vistoriaId={selected}
          onClose={() => setSelected(null)}
          onUpdated={loadVistorias}
        />
      )}
    </div>
  );
}
