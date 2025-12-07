"use client";

import { useState } from "react";
import { Card } from "@/components/admin/ui/Card";

import CRMContratosPanel from "@/components/contratos/ContratosPanel";
import CRMContratoForm from "@/components/contratos/ContratoForm";
import CRMContratoDetailDrawer from "@/components/contratos/ContratoDetailDrawer";
import TemplateManager from "@/components/contratos/TemplateManager";


import Modal from "@/components/admin/ui/Modal";
import { Button } from "@/components/admin/ui/Button";

export default function ContratosPage() {
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [openTemplates, setOpenTemplates] = useState(false);


  const [deleteTarget, setDeleteTarget] = useState(null);

  const [openDrawer, setOpenDrawer] = useState(null);

  // 🔄 Atualização do painel quando algo muda (editar, remover, drawer)
  const [reloadKey, setReloadKey] = useState(0);
  const triggerReload = () => setReloadKey((prev) => prev + 1);

  return (
    <div className="space-y-8 min-h-screen">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="text-muted-foreground">Gerenciamento completo dos contratos do CRM</p>
        </div>

        <Button
          variant="secondary"
          onClick={() => setOpenTemplates(true)}
        >
          Templates
        </Button>
      </div>

      {/* PAINEL */}
      <Card className="p-6 space-y-4">
        <CRMContratosPanel
          key={reloadKey}
          onOpenForm={(c) => {
            setEditing(c || null);
            setOpenForm(true);
          }}
          onOpenDelete={(c) => setDeleteTarget(c)}
          onOpenDrawer={(id) => setOpenDrawer(id)}
        />
      </Card>

      {/* ===========================
          MODAL → FORM CONTRATO
      ============================ */}
      <Modal
        isOpen={openForm}
        onClose={() => {
          setEditing(null);
          setOpenForm(false);
        }}
        title={editing ? "Editar Contrato" : "Novo Contrato"}
      >
        <CRMContratoForm
          contrato={editing}
          onClose={() => {
            setEditing(null);
            setOpenForm(false);
          }}
          onSaved={() => {
            triggerReload();
            setEditing(null);
            setOpenForm(false);
          }}
        />
      </Modal>

      {/* ===========================
          MODAL → CONFIRMAÇÃO DELETE
      ============================ */}
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

            <div className="flex gap-2 pt-2">
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
                    const res = await fetch(`/api/contratos?id=${deleteTarget.id}`, {
                      method: "DELETE",
                    });

                    const json = await res.json();
                    if (!res.ok) throw new Error(json.error);

                    triggerReload();
                    setDeleteTarget(null);
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                Remover
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===========================
          MODAL → GERENCIAR TEMPLATES
      ============================ */}  
      <Modal
        isOpen={openTemplates}
        onClose={() => setOpenTemplates(false)}
        title="Gerenciar Templates"
        size="xl" // se o seu Modal suportar tamanhos
      >
        <TemplateManager
          onClose={() => setOpenTemplates(false)}
        />
      </Modal>

      {/* ===========================
          DRAWER → DETALHES DO CONTRATO
      ============================ */}
      {openDrawer && (
        <CRMContratoDetailDrawer
          contratoId={openDrawer}
          onClose={() => setOpenDrawer(null)}
          onUpdated={() => triggerReload()}
        />
      )}
    </div>
  );
}
