"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/admin/ui/Modal";
import { Button } from "@/components/admin/ui/Button";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/Table";
import Badge from "@/components/admin/ui/Badge";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { formatBRL, formatDateBR } from "@/utils/currency";
import { useToast } from "@/contexts/ToastContext";

export default function ContratoRecorrenciasModal({
  isOpen,
  onClose,
  contratoId,
  onNovoLancamento,
   onEditarLancamento = () => {},
}) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [toDelete, setToDelete] = useState(null);

  /* ===========================================
     LOAD — BUSCA LANÇAMENTOS RECORRENTES
  ============================================ */
  useEffect(() => {
    if (!isOpen || !contratoId) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `/api/alugueis/acrescimos?contrato_id=${contratoId}`,
          { cache: "no-store" }
        );

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro ao buscar lançamentos");

        setRows(json.data || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, contratoId, toast]);

  /* ===========================================
     HELPERS
  ============================================ */
  const formatMesAno = (competencia, vencimento) => {
    if (competencia) {
      const [y, m] = competencia.split("-");
      return `${m}/${y}`;
    }
    return formatDateBR(vencimento);
  };

  const podeEditar = (row) => row.status === "pendente";
  const podeExcluir = (row) => row.status === "pendente";

  /* ===========================================
     ACTIONS
  ============================================ */
  const confirmarExclusao = async () => {
    try {
      const res = await fetch(`/api/alugueis/acrescimos?id=${toDelete.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao cancelar lançamento");

      toast.success("Lançamento cancelado");
      setRows((prev) => prev.filter((r) => r.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ===========================================
     UI
  ============================================ */
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        title="± Acréscimos / Decréscimos Recorrentes"
      >
        {loading ? (
          <div className="flex justify-center items-center py-16 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" />
            Carregando lançamentos...
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum lançamento recorrente encontrado.
          </div>
        ) : (
          <>
            {/* TOOLBAR */}
            <div className="flex justify-end mb-3">
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  onClose();
                  onNovoLancamento();
                }}
              >
                <Plus size={14} />
                Novo lançamento
              </Button>
            </div>

            {/* TABELA */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Mês/Ano</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Opção</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <tbody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.tipo}
                    </TableCell>

                    <TableCell>
                      {formatMesAno(
                        row.dados_cobranca_json?.competencia,
                        row.data_vencimento
                      )}
                    </TableCell>

                    <TableCell className="max-w-[260px] break-words text-muted-foreground">
                      {row.descricao}
                    </TableCell>

                    <TableCell>
                      {row.dados_cobranca_json?.recorrencia === "parcelas" && (
                        <Badge variant="outline">Parcelado</Badge>
                      )}
                      {row.dados_cobranca_json?.recorrencia === "fixo" && (
                        <Badge variant="secondary">Fixo</Badge>
                      )}
                      {!row.dados_cobranca_json?.recorrencia && (
                        <Badge variant="ghost">Recorrente</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right font-medium">
                      {formatBRL(row.valor)}
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!podeEditar(row)}
                          title={
                            podeEditar(row)
                              ? "Editar lançamento"
                              : "Lançamento já baixado"
                          }
                          onClick={() => {
                            onEditarLancamento(row);
                          }}
                        >
                          <Pencil size={14} />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!podeExcluir(row)}
                          title={
                            podeExcluir(row)
                              ? "Cancelar lançamento"
                              : "Lançamento já baixado"
                          }
                          onClick={() => setToDelete(row)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Modal>

      {/* MODAL CANCELAR */}
      <Modal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Cancelar lançamento"
      >
        <div className="space-y-4">
          <p>
            Deseja realmente <strong>cancelar</strong> este lançamento no valor
            de <strong>{formatBRL(toDelete?.valor)}</strong>?
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Voltar
            </Button>

            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmarExclusao}
            >
              Cancelar lançamento
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
