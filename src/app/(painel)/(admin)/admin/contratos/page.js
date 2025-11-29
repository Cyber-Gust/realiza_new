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

    </div>
  );
}
