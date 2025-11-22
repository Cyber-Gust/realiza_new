"use client";

import { useState } from "react";
import { Card } from "@/components/admin/ui/Card";

import CRMContratosPanel from "@/components/contratos/ContratosPanel";
import CRMContratoForm from "@/components/contratos/ContratoForm";
import CRMContratoDetailDrawer from "@/components/contratos/ContratoDetailDrawer";

import Modal from "@/components/admin/ui/Modal";
import { Button } from "@/components/admin/ui/Button";

export default function ContratosPage() {
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(null);

  return (
    <div className="space-y-8 min-h-screen">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="text-muted-foreground">
            Gerenciamento completo dos contratos do CRM
          </p>
        </div>
      </div>

      {/* CARD DO PAINEL */}
      <Card className="p-6 space-y-4">
        <CRMContratosPanel
          onOpenForm={(c) => {
            setEditing(c || null);
            setOpenForm(true);
          }}
          onOpenDelete={(c) => setDeleteTarget(c)}
          onOpenDrawer={(id) => setOpenDrawer(id)}
        />
      </Card>

      {/* MODAL FORM */}
      <Modal
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        title={editing ? "Editar Contrato" : "Novo Contrato"}
      >
        <CRMContratoForm
          contrato={editing}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          onSaved={() => window.location.reload()}
        />
      </Modal>

      {/* MODAL DELETE */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Contrato"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <p>
              Tem certeza que deseja remover o contrato do imóvel{" "}
              <strong>{deleteTarget.imoveis?.titulo}</strong>?
            </p>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </Button>

              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={async () => {
                  await fetch(`/api/contratos?id=${deleteTarget.id}`, {
                    method: "DELETE",
                  });

                  window.location.reload();
                }}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* DRAWER DETALHES */}
      {openDrawer && (
        <CRMContratoDetailDrawer
          contratoId={openDrawer}
          onClose={() => setOpenDrawer(null)}
          onUpdated={() => window.location.reload()}
        />
      )}
    </div>
  );
}
