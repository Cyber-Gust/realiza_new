"use client";

import { useEffect, useState } from "react";
import { RotateCcw, MailWarning, AlertTriangle } from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/ui/Table";

import { useToast } from "@/contexts/ToastContext";
import { formatBRL, formatDateBR } from "@/utils/currency";

/* ======================================================
   INADIMPLÊNCIA — RECEITAS EM ATRASO
====================================================== */

export default function InadimplenciaPanel() {
  const toast = useToast();

  /* =========================
     STATES
  ========================== */
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOADERS
  ========================== */
  const carregar = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/financeiro/inadimplencia", {
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

  /* =========================
     HELPERS
  ========================== */
  const totalEmAtraso = dados.reduce(
    (acc, r) => acc + Number(r.valor || 0),
    0
  );

  const notificar = (r) => {
    const contrato = r.contrato;

    const email =
      contrato?.inquilino?.email ||
      contrato?.proprietario?.email;

    if (!email) {
      toast.error("Contato sem e-mail", "Não foi possível notificar.");
      return;
    }

    const subject = encodeURIComponent("Aluguel em atraso");
    const body = encodeURIComponent(
      `Olá,\n\nIdentificamos um aluguel em atraso referente ao imóvel "${r.imovel?.titulo}".\n\nPor favor, entre em contato para regularização.\n\nAtenciosamente,`
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-600" />
          Inadimplência
        </h3>

        <Button variant="secondary" onClick={carregar} disabled={loading}>
          <RotateCcw size={16} className="mr-1" />
          Atualizar
        </Button>
      </div>

      {/* RESUMO */}
      <Card className="p-4 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">
          Total em atraso
        </span>
        <span className="text-lg font-bold text-red-600">
          {formatBRL(totalEmAtraso)}
        </span>
      </Card>

      {/* TABELA */}
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Imóvel</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  Carregando inadimplência...
                </TableCell>
              </TableRow>
            ) : dados.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  Nenhuma receita em atraso.
                </TableCell>
              </TableRow>
            ) : (
              dados.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    {r.imovel?.titulo || "—"}
                  </TableCell>

                  <TableCell>
                    {r.contrato?.id
                      ? `Contrato ${r.contrato.id.slice(0, 8)}`
                      : "—"}
                  </TableCell>

                  <TableCell>
                    <Badge status={r.status}>Atrasado</Badge>
                  </TableCell>

                  <TableCell className="font-medium text-red-600">
                    {formatBRL(r.valor)}
                  </TableCell>

                  <TableCell>{formatDateBR(r.data_vencimento)}</TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => notificar(r)}
                    >
                      <MailWarning size={14} className="mr-1" />
                      Notificar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
