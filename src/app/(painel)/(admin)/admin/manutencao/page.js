"use client";

import { useState } from "react";

import { Card } from "@/components/admin/ui/Card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/admin/ui/Tabs";

import Modal from "@/components/admin/ui/Modal";
import OrdemServicoForm from "@/components/manutencao/OrdemServicoForm";
import OrdemServicoDetailDrawer from "@/components/manutencao/OrdemServicoDetailDrawer";

import VistoriaForm from "@/components/manutencao/VistoriaForm";
import VistoriaDetailDrawer from "@/components/manutencao/VistoriaDetailDrawer";

import OrdensServicoPanel from "@/components/manutencao/OrdensServicoPanel";
import VistoriasPanel from "@/components/manutencao/VistoriasPanel";
import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/contexts/ToastContext";

export default function ManutencaoPage() {
  const [tab, setTab] = useState("ordens");

  // estados centrais
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reloadFn, setReloadFn] = useState(null);

  const toast = useToast();

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Módulo de Manutenção</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie ordens de serviço, vistorias e histórico técnico dos imóveis.
        </p>
      </div>

      {/* TABS */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted p-1 flex gap-2">
          <TabsTrigger value="ordens">Ordens de Serviço</TabsTrigger>
          <TabsTrigger value="vistorias">Vistorias</TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">

          {/* ORDENS */}
          <TabsContent value="ordens">
            <Card className="p-6">
              <OrdensServicoPanel
                onAdd={(reload) => {
                  setEditing(null);
                  setReloadFn(() => reload);
                  setOpenForm(true);
                }}
                onEdit={(os, reload) => {
                  setEditing(os);
                  setReloadFn(() => reload);
                  setOpenForm(true);
                }}
                onSelect={(id) => setSelected({ type: "ordem", id })}
                onDelete={(os, reload) =>
                  setDeleteTarget({ type: "ordem", data: os, reload })
                }
              />
            </Card>
          </TabsContent>

          {/* VISTORIAS */}
          <TabsContent value="vistorias">
            <Card className="p-6">
              <VistoriasPanel
                onAdd={(reload) => {
                  setEditing(null);
                  setReloadFn(() => reload);
                  setOpenForm(true);
                }}
                onEdit={(v, reload) => {
                  setEditing(v);
                  setReloadFn(() => reload);
                  setOpenForm(true);
                }}
                onSelect={(id) => setSelected({ type: "vistoria", id })}
                onDelete={(v, reload) =>
                  setDeleteTarget({ type: "vistoria", data: v, reload })
                }
              />
            </Card>
          </TabsContent>

        </div>
      </Tabs>

      {/* FORM ORDEM */}
      {tab === "ordens" && (
        <OrdemServicoForm
          open={openForm}
          editingOS={editing}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          reload={() => reloadFn?.()}
        />
      )}

      {/* FORM VISTORIA */}
      {tab === "vistorias" && (
        <VistoriaForm
          open={openForm}
          editingVistoria={editing}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          reload={() => reloadFn?.()}
        />
      )}

      {/* MODAL DELETE */}
      {deleteTarget && (
        <Modal
          isOpen
          onClose={() => setDeleteTarget(null)}
          title="Confirmar Remoção"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Remover a{" "}
              <strong>
                {deleteTarget.type === "ordem"
                  ? "ordem de serviço"
                  : "vistoria"}
              </strong>{" "}
              do imóvel{" "}
              <strong>{deleteTarget.data.imovel?.titulo}</strong>?
            </p>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="w-1/2"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </Button>

              <Button
                className="w-1/2 bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  try {
                    const endpoint =
                      deleteTarget.type === "ordem"
                        ? "/api/manutencao/ordens-servico"
                        : "/api/manutencao/vistorias";

                    const res = await fetch(endpoint, {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: deleteTarget.data.id,
                      }),
                    });

                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error);

                    toast.success("Removido com sucesso");
                    deleteTarget.reload?.();
                    setDeleteTarget(null);

                  } catch (err) {
                    toast.error("Erro ao remover", err.message);
                  }
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DRAWER */}
      {selected && (
        selected.type === "ordem" ? (
          <OrdemServicoDetailDrawer
            ordemId={selected.id}
            onClose={() => setSelected(null)}
          />
        ) : (
          <VistoriaDetailDrawer
            vistoriaId={selected.id}
            onClose={() => setSelected(null)}
          />
        )
      )}
    </div>
  );
}
