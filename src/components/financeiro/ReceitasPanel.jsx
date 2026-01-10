"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  RotateCcw,
  Lock,
  Home,
  ArrowUpRight,
  Edit,
  Trash2,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import Modal from "@/components/admin/ui/Modal";
import Badge from "@/components/admin/ui/Badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/ui/Table";
import { Input, Label, Select } from "@/components/admin/ui/Form";

import { useToast } from "@/contexts/ToastContext";
import { formatBRL, formatDateBR, parseCurrencyToNumber } from "@/utils/currency";
import { labelStatus, labelTipo } from "@/utils/financeiro.constants";

export default function ReceitasPanel() {
  const toast = useToast();

  /* =========================
     STATES
  ========================== */
  const [dados, setDados] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    tipo: "",
    origem: "",
    dataInicio: "",
    dataFim: "",
  });


  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [isAutomatica, setIsAutomatica] = useState(false);

  const [form, setForm] = useState({
    tipo: "",
    imovel_id: "",
    contrato_id: "",
    valor: "",
    data_vencimento: "",
    descricao: "",
    competencia: "",
    forma_recebimento: "",
    observacoes: "",
    origem: "manual",
  });

  /* =========================
     LOADERS
  ========================== */
  const carregar = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/financeiro/receitas", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDados(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar receitas", err.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarImoveis = async () => {
    const res = await fetch("/api/imoveis?status=vendido", {
      cache: "no-store",
    });
    const json = await res.json();
    if (res.ok) setImoveis(json.data || []);
  };

  useEffect(() => {
    carregar();
    carregarImoveis();
  }, []);

  /* =========================
     HELPERS
  ========================== */
  const resetForm = () => {
    setForm({
      tipo: "",
      imovel_id: "",
      valor: "",
      data_vencimento: "",
      descricao: "",
      competencia: "",
      forma_recebimento: "",
      observacoes: "",
      origem: "manual",
    });
    setEditingId(null);
    setIsAutomatica(false);
  };

  const badgeTipo = (tipo) => {
    if (tipo === "receita_venda_imovel") {
      return (
        <Badge status="receita_venda_imovel">
          <Home size={12} className="mr-1" /> Venda
        </Badge>
      );
    }

    return (
      <Badge status="receita_aluguel">
        <ArrowUpRight size={12} className="mr-1" /> Aluguel
      </Badge>
    );
  };

  const badgeOrigem = (origem) => {
    if (origem === "automatica") {
      return (
        <Badge status="automatica">
          <Lock size={12} className="mr-1" /> Automático
        </Badge>
      );
    }

    return <Badge status="manual">Manual</Badge>;
  };


  /* =========================
     ACTIONS
  ========================== */
  const handleSave = async () => {
    try {
      if (!form.tipo || !form.valor || !form.data_vencimento) {
        toast.error("Campos obrigatórios", "Preencha os campos principais.");
        return;
      }

      if (form.tipo === "receita_venda_imovel" && !form.imovel_id) {
        toast.error("Imóvel obrigatório para venda.");
        return;
      }

      const payload = {
        tipo: form.tipo,
        imovel_id: form.imovel_id || null,
        contrato_id: form.contrato_id,
        valor: parseCurrencyToNumber(form.valor),
        data_vencimento: form.data_vencimento,
        descricao: form.descricao || labelTipo(form.tipo),
        natureza: "entrada",
        dados_cobranca_json: {
          competencia: form.competencia,
          forma_recebimento: form.forma_recebimento,
          observacoes: form.observacoes,
          origem: form.origem,
        },
      };

      const res = await fetch("/api/financeiro/receitas", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, ...payload } : payload
        ),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(editingId ? "Receita atualizada" : "Receita criada");
      setOpenForm(false);
      resetForm();
      carregar();
    } catch (err) {
      toast.error("Erro ao salvar", err.message);
    }
  };

  const marcarComoPago = async (r) => {
    try {
      await fetch("/api/financeiro/receitas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: r.id,
          status: "pago",
          data_pagamento: new Date().toISOString().split("T")[0],
        }),
      });

      toast.success("Receita marcada como paga");
      carregar();
    } catch {
      toast.error("Erro ao confirmar pagamento");
    }
  };

  const cancelar = async () => {
    try {
      await fetch("/api/financeiro/receitas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: toDelete.id,
          status: "cancelado",
        }),
      });

      toast.success("Receita cancelada");
      setToDelete(null);
      carregar();
    } catch {
      toast.error("Erro ao cancelar receita");
    }
  };

  /* =========================
      FILTERED DATA
  ========================== */
  const dadosFiltrados = dados.filter((r) => {
    if (filters.status && r.status !== filters.status) return false;
    if (filters.tipo && r.tipo !== filters.tipo) return false;

    const origem = r.dados_cobranca_json?.origem;
    if (filters.origem && origem !== filters.origem) return false;

    if (filters.dataInicio && r.data_vencimento < filters.dataInicio)
      return false;

    if (filters.dataFim && r.data_vencimento > filters.dataFim)
      return false;

    return true;
    
  });

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h3 className="text-lg font-semibold">Receitas</h3>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={carregar} disabled={loading}>
            <RotateCcw size={16} /> Atualizar
          </Button>

          <Button
            variant="secondary"
            onClick={() =>
              setFilters({
                status: "",
                tipo: "",
                origem: "",
                dataInicio: "",
                dataFim: "",
              })
            }
          >
            Limpar filtros
          </Button>

          <Button onClick={() => setOpenForm(true)}>
            <Plus size={16} /> Nova Receita
          </Button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <Select
          value={filters.status}
          onChange={(e) =>
            setFilters((f) => ({ ...f, status: e.target.value }))
          }
        >
          <option value="">Status</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="cancelado">Cancelado</option>
          <option value="atrasado">Atrasado</option>
        </Select>

        <Select
          value={filters.tipo}
          onChange={(e) =>
            setFilters((f) => ({ ...f, tipo: e.target.value }))
          }
        >
          <option value="">Tipo</option>
          <option value="receita_venda_imovel">Venda</option>
        </Select>

        <Select
          value={filters.origem}
          onChange={(e) =>
            setFilters((f) => ({ ...f, origem: e.target.value }))
          }
        >
          <option value="">Origem</option>
          <option value="manual">Manual</option>
          <option value="automatica">Automática</option>
        </Select>

        <Input
          type="date"
          value={filters.dataInicio}
          onChange={(e) =>
            setFilters((f) => ({ ...f, dataInicio: e.target.value }))
          }
        />

        <Input
          type="date"
          value={filters.dataFim}
          onChange={(e) =>
            setFilters((f) => ({ ...f, dataFim: e.target.value }))
          }
        />
      </div>

      {/* TABELA */}
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Códico Casa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : dadosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  Nenhuma receita encontrada.
                </TableCell>
              </TableRow>
            ) : (
              dadosFiltrados.map((r) => {
                const origem = r.dados_cobranca_json?.origem;
                const automatica = origem === "automatica";
                const isAluguel = r.tipo === "receita_aluguel";
                const isVenda = r.tipo === "receita_venda_imovel";
                const podeReceber =
                  (r.status === "pendente" || r.status === "atrasado") &&
                  (isAluguel || isVenda);

                return (
                  <TableRow key={r.id}>
                    <TableCell>{badgeTipo(r.tipo)}</TableCell>
                    <TableCell>{r.imovel?.codigo_ref || "-"}</TableCell>
                    <TableCell>
                      <Badge status={r.status}>
                        {labelStatus(r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatBRL(r.valor)}
                    </TableCell>
                    <TableCell>{formatDateBR(r.data_vencimento)}</TableCell>
                    <TableCell>{badgeOrigem(origem)}</TableCell>

                    <TableCell className="text-right flex justify-end gap-2">
                      {podeReceber && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => marcarComoPago(r)}
                        >
                          <CheckCircle size={16} className="mr-1" />
                          {isAluguel ? "Receber aluguel" : "Confirmar recebimento"}
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={automatica}
                        onClick={() => {
                          setEditingId(r.id);
                          setIsAutomatica(automatica);
                          setForm({
                            tipo: r.tipo,
                            imovel_id: r.imovel_id || "",
                            valor: formatBRL(r.valor),
                            data_vencimento: r.data_vencimento,
                            descricao: r.descricao,
                            competencia:
                              r.dados_cobranca_json?.competencia || "",
                            forma_recebimento:
                              r.dados_cobranca_json?.forma_recebimento || "",
                            observacoes:
                              r.dados_cobranca_json?.observacoes || "",
                            origem,
                          });
                          setOpenForm(true);
                        }}
                      >
                        <Edit size={16} />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setToDelete(r)}
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </tbody>
        </Table>
      </div>

      {/* MODAL FORM */}
      <Modal
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          resetForm();
        }}
        title={editingId ? "Editar Receita" : "Nova Receita"}
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="secondary"
              className="w-1/2"
              onClick={() => {
                setOpenForm(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button className="w-1/2" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <Label>Tipo *</Label>
            <Select
              disabled={isAutomatica}
              value={form.tipo}
              onChange={(e) =>
                setForm((f) => ({ ...f, tipo: e.target.value }))
              }
            >
              <option value="">Selecione</option>
              <option value="receita_venda_imovel">Venda de Imóvel</option>
            </Select>
          </div>

          <div>
            <Label>Imóvel</Label>
            <Select
              disabled={isAutomatica}
              value={form.imovel_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, imovel_id: e.target.value }))
              }
            >
              <option value="">Selecione</option>
              {imoveis.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.titulo}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Valor *</Label>
            <Input
              disabled={isAutomatica}
              value={form.valor}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  valor: formatBRL(
                    parseCurrencyToNumber(e.target.value)
                  ),
                }))
              }
            />
          </div>

          <div>
            <Label>Data de Vencimento *</Label>
            <Input
              type="date"
              value={form.data_vencimento}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  data_vencimento: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Input
              value={form.descricao}
              onChange={(e) =>
                setForm((f) => ({ ...f, descricao: e.target.value }))
              }
            />
          </div>
        </div>
      </Modal>

      {/* MODAL CANCELAR */}
      <Modal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Cancelar Receita"
      >
        <div className="space-y-4">
          <p>
            Deseja realmente <strong>cancelar</strong> esta receita de{" "}
            <strong>{formatBRL(toDelete?.valor)}</strong>?
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Voltar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={cancelar}
            >
              Cancelar Receita
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
