"use client";
import { useState } from "react";
import Table from "@/components/admin/ui/Table";
import Modal from "@/components/admin/ui/Modal";
import Toast from "@/components/admin/ui/Toast";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/formatters";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Edit,
  Trash2,
} from "lucide-react";

/* ==========================================
   🔹 BADGE DE STATUS
========================================== */
const StatusBadge = ({ status }) => {
  const map = {
    pago: "bg-emerald-100 text-emerald-800 border-emerald-200",
    pendente: "bg-amber-100 text-amber-800 border-amber-200",
    atrasado: "bg-rose-100 text-rose-800 border-rose-200",
    cancelado: "bg-gray-200 text-gray-800 border-gray-300",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs rounded border capitalize ${
        map[status] || "bg-muted text-foreground border-border"
      }`}
    >
      {status}
    </span>
  );
};

/* ==========================================
   🔹 TABELA PRINCIPAL
========================================== */
export default function FinanceiroTable({ data = [], loading, onReload }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const columns = [
    { key: "descricao", label: "Descrição" },
    { key: "tipo", label: "Tipo" },
    { key: "status", label: "Status" },
    { key: "valor", label: "Valor" },
    { key: "data_vencimento", label: "Vencimento" },
    { key: "data_pagamento", label: "Pagamento" },
    { key: "acoes", label: "" },
  ];

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
      Toast.success("Lançamento removido com sucesso!");
      setDeleteTarget(null);
      onReload?.();
    } catch (err) {
      Toast.error("Erro ao excluir: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // 🔹 Ajusta visualmente os dados
  const tableData = data.map((t) => ({
    ...t,
    status: <StatusBadge status={t.status} />,
    valor: formatCurrency(t.valor),
    acoes: (
      <div className="flex items-center gap-1 justify-end">
        <Button
          size="icon"
          variant="ghost"
          className="hover:bg-muted/50"
          onClick={() => Toast.info("Em breve: edição de lançamento")}
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
    ),
  }));

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        <Table columns={columns} data={tableData} />
      </div>

      {/* =======================================
          🔹 MODAL DE CONFIRMAÇÃO DE EXCLUSÃO
      ======================================= */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={(val) => {
          if (!val) setDeleteTarget(null);
        }}
        title="Remover Lançamento"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir o lançamento{" "}
              <strong>{deleteTarget.descricao}</strong> no valor de{" "}
              <strong>{formatCurrency(deleteTarget.valor)}</strong>?
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
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Removendo..." : "Confirmar Exclusão"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
