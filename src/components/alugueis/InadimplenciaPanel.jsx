"use client";

import { useState, useEffect } from "react";

import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/ui/Table";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";

import { Wallet, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";

export default function InadimplenciaPanel() {
  const [data, setData] = useState([]);
  const [filterStatus, setFilterStatus] = useState("todos");
  const [loading, setLoading] = useState(true);

  const { error: toastError } = useToast();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/alugueis?view=inadimplencia", {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setData(json.data || []);
    } catch (err) {
      toastError("Erro ao carregar inadimplência: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = data.filter((item) =>
    filterStatus === "todos" ? true : item.status === filterStatus
  );

  if (loading) return <LoadingState />;

  if (!data.length)
    return (
      <p className="text-muted-foreground text-center py-6">
        Nenhum lançamento pendente ou atrasado.
      </p>
    );

  return (
    <div className="space-y-6 animate-in fade-in-10 duration-200">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-muted-foreground" />
          <h3 className="text-lg font-semibold tracking-tight">
            Inadimplência Geral
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={cn(
              "border border-border rounded-md bg-card",
              "text-sm px-3 py-2",
              "focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="atrasado">Atrasados</option>
          </select>

          <Button
            variant="ghost"
            onClick={load}
            className={cn(
              "flex items-center gap-2",
              "border border-border bg-transparent hover:bg-muted"
            )}
          >
            <RefreshCcw size={15} /> Atualizar
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <Card className="p-0 overflow-hidden border border-border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imóvel</TableHead>
              <TableHead>Inquilino</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.contratos?.imoveis?.titulo || "-"}
                </TableCell>

                <TableCell>
                  {item.contratos?.inquilino?.nome || "-"}
                </TableCell>

                <TableCell>
                  <Badge
                    className={cn(
                      "text-xs capitalize px-2 py-0.5",
                      colorMap[item.status] ??
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    {item.status}
                  </Badge>
                </TableCell>

                <TableCell>{item.data_vencimento}</TableCell>

                <TableCell>
                  <span className="font-medium text-red-600">
                    {formatCurrency(item.valor)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

/* ===========================================================
   🔹 LOADING — Skeleton Premium
=========================================================== */
function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-40 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-md" />
      </div>

      <Card className="p-4">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full rounded-md" />
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ===========================================================
   🔹 STATUS COLORS
=========================================================== */
const colorMap = {
  atrasado: "bg-red-600 text-white",
  pendente: "bg-yellow-600 text-white",
};
