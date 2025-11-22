"use client";

import { useState } from "react";

import { Badge } from "@/components/admin/ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/admin/ui/Table";
import Modal from "@/components/admin/ui/Modal";
import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/contexts/ToastContext";

import { formatCurrency } from "@/utils/formatters";
import { Edit, Trash2 } from "lucide-react";

/* ==========================================
   🔹 STATUS BADGE (usando seu componente real)
=========================================== */
const StatusBadge = ({ status }) => <Badge status={status} />;

/* ==========================================
   🔹 TABELA PRINCIPAL
=========================================== */
export default function FinanceiroTable({ data = [], loading, onReload }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  if (loading)
    return (
      <p className="text-muted-foreground text-center py-6 animate-pulse">
        Carregando lançamentos...
      </p>
    );

  if (data.length === 0)
    return (
      <p className="text-muted-foreground text-center py-6">
        Nenhum lançamento encontrado.
      </p>
    );

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/financeiro?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Sucesso", "Lançamento removido com sucesso!");

      setDeleteTarget(null);
      onReload?.();
    } catch (err) {
      toast.error("Erro ao excluir", err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* ======================= */}
      {/*        TABELA          */}
      {/* ======================= */}
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {data.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.descricao}</TableCell>
                <TableCell className="capitalize">{t.tipo.replace(/_/g, " ")}</TableCell>
                <TableCell><StatusBadge status={t.status} /></TableCell>
                <TableCell>{formatCurrency(t.valor)}</TableCell>
                <TableCell>{t.data_vencimento || "-"}</TableCell>
                <TableCell>{t.data_pagamento || "-"}</TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-muted/50"
                      onClick={() => toast.info("Em breve", "Edição de lançamento")}
                    >
                      <Edit size={16} className="text-blue-600" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-muted/50"
                      onClick={() => setDeleteTarget(t)}
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      {/* ======================================= */}
      {/*       MODAL CONFIRMAR EXCLUSÃO          */}
      {/* ======================================= */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Lançamento"
        footer={
          deleteTarget ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="secondary"
                className="w-1/2"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </Button>

              <Button
                className="w-1/2 bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Removendo..." : "Confirmar Exclusão"}
              </Button>
            </div>
          ) : null
        }
      >
        {deleteTarget && (
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o lançamento{" "}
            <strong>{deleteTarget.descricao}</strong> no valor de{" "}
            <strong>{formatCurrency(deleteTarget.valor)}</strong>?
          </p>
        )}
      </Modal>
    </>
  );
}
