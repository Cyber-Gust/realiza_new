// components/admin/financeiro/InadimplenciaPanel.jsx
"use client";

import { useEffect, useState } from "react";
import { RotateCcw, MailWarning, AlertTriangle } from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/admin/ui/Table";

import { useToast } from "@/contexts/ToastContext";
import { formatCurrency } from "@/utils/formatters";

export default function InadimplenciaPanel() {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const carregar = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/financeiro?type=inadimplencia", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setDados(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar inadimplência", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const total = dados.reduce((acc, t) => acc + Number(t.valor || 0), 0);

  return (
    <div className="space-y-4">

      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle size={18} />
          Inadimplência
        </h3>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={carregar} disabled={loading}>
            <RotateCcw size={16} />
            Atualizar
          </Button>

          <Button className="bg-red-600 hover:bg-red-700 text-white">
            <MailWarning size={16} />
            Notificar
          </Button>
        </div>
      </div>

      {/* Resumo */}
      <Card className="p-4 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Total em atraso
        </span>
        <span className="text-lg font-bold text-red-600">
          {formatCurrency(total)}
        </span>
      </Card>

      {/* Tabela */}
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imóvel</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 animate-pulse">
                  Carregando inadimplência...
                </TableCell>
              </TableRow>
            )}

            {!loading && dados.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  Nenhum aluguel em atraso.
                </TableCell>
              </TableRow>
            )}

            {dados.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  {t.imovel?.titulo || "-"}
                </TableCell>

                <TableCell>
                  {t.contrato?.id
                    ? `Contrato ${t.contrato.id.slice(0, 8)}`
                    : "-"}
                </TableCell>

                <TableCell>
                  <Badge status={t.status} />
                </TableCell>

                <TableCell className="text-red-600 font-medium">
                  {formatCurrency(t.valor)}
                </TableCell>

                <TableCell>
                  {t.data_vencimento}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
