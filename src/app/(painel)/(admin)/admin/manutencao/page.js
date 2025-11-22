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

export default function ManutencaoPage() {
  const [tab, setTab] = useState("ordens");

  // ESTADOS CENTRALIZADOS
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Módulo de Manutenção</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie ordens de serviço, orçamentos, vistorias e histórico técnico dos imóveis.
        </p>
      </div>

      {/* TABS */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted p-1 flex gap-2">
          <TabsTrigger value="ordens">Ordens de Serviço</TabsTrigger>
          <TabsTrigger value="vistorias">Vistorias</TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">

          {/* ORDENS */}
          <TabsContent value="ordens">
            <Card className="p-6 space-y-4">
              <OrdensServicoPanel
                onAdd={() => setOpenForm(true)}
                onEdit={(os) => {
                  setEditing(os);
                  setOpenForm(true);
                }}
                onSelect={(id) => setSelected({ type: "ordem", id })}
                onDelete={(os) => setDeleteTarget({ type: "ordem", data: os })}
              />
            </Card>
          </TabsContent>

          {/* VISTORIAS */}
          <TabsContent value="vistorias">
            <Card className="p-6 space-y-4">
              <VistoriasPanel
                onAdd={() => setOpenForm(true)}
                onEdit={(v) => {
                  setEditing(v);
                  setOpenForm(true);
                }}
                onSelect={(id) => setSelected({ type: "vistoria", id })}
                onDelete={(v) => setDeleteTarget({ type: "vistoria", data: v })}
              />
            </Card>
          </TabsContent>

        </div>
      </Tabs>

      {/* ----------------------------- */}
      {/*  MODAIS NO TOPO  */}
      {/* ----------------------------- */}

      {/* MODAL FORM */}
      {openForm && (
        <Modal
          isOpen={openForm}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          title={editing ? "Editar Registro" : "Novo Registro"}
        >
          {tab === "ordens" ? (
            <OrdemServicoForm
              ordem={editing}
              onClose={() => {
                setOpenForm(false);
                setEditing(null);
              }}
            />
          ) : (
            <VistoriaForm
              vistoria={editing}
              onClose={() => {
                setOpenForm(false);
                setEditing(null);
              }}
            />
          )}
        </Modal>
      )}

      {/* MODAL CONFIRMAÇÃO */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Confirmar Remoção"
        >
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover?
          </p>
          {/* Aqui você pluga o handler real */}
        </Modal>
      )}

      {/* DRAWER DETALHES */}
      {selected && (
        <>
          {selected.type === "ordem" ? (
            <OrdemServicoDetailDrawer
              ordemId={selected.id}
              onClose={() => setSelected(null)}
            />
          ) : (
            <VistoriaDetailDrawer
              vistoriaId={selected.id}
              onClose={() => setSelected(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
