"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus,
  RotateCcw,
  Lock,
  ArrowDownRight,
  Edit,
  Trash2,
  CheckCircle,
  Wrench,
  Shield,
  KeyRound,
  ClipboardList,
  Droplets,
  Zap,
  Building2,
} from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
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

const MODULO = "ALUGUEL";

/**
 * ✅ Tipos manuais possíveis (só exemplos práticos)
 * PS: aqui a gente PRECISA respeitar teu ENUM do banco.
 * Como você já tem esses tipos, vou usar só os existentes.
 */
const TIPOS_DESPESA_MANUAL = [
  { value: "despesa_manutencao", label: "Manutenção / Reparo", icon: Wrench },
  { value: "seguro_incendio", label: "Seguro Incêndio (Franquia / Taxa)", icon: Shield },
  { value: "pagamento_condominio", label: "Condomínio (Avulso)", icon: Building2 },
  { value: "pagamento_iptu", label: "IPTU (Avulso)", icon: ClipboardList },
  { value: "consumo_agua", label: "Água (Avulso)", icon: Droplets },
  { value: "consumo_luz", label: "Energia (Avulso)", icon: Zap },
  { value: "taxa", label: "Taxa / Serviço Avulso", icon: KeyRound },
  { value: "outros", label: "Outros", icon: Wrench },
];

export default function DespesasPanel() {
  const toast = useToast();

  /* =========================
     STATES
  ========================== */
  const [dados, setDados] = useState([]);
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
  const [isPaga, setIsPaga] = useState(false);

  const [form, setForm] = useState({
    tipo: "despesa_manutencao",
    valor: "",
    data_vencimento: "",
    descricao: "",
    origem: "manual",
  });

  /* =========================
     LOADERS
  ========================== */
  const carregar = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/financeiro/despesas?modulo=${MODULO}`, {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setDados(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar despesas", err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /* =========================
     HELPERS
  ========================== */
  const resetForm = () => {
    setForm({
      tipo: "despesa_manutencao",
      valor: "",
      data_vencimento: "",
      descricao: "",
      origem: "manual",
    });

    setEditingId(null);
    setIsAutomatica(false);
    setIsPaga(false);
  };

  const getOrigem = (d) => d?.dados_cobranca_json?.origem || "manual";

  const badgeOrigem = (origem) => {
    if (origem === "automatica") {
      return (
        <Badge status="automatica">
          <Lock size={12} className="mr-1" /> Automática
        </Badge>
      );
    }
    return <Badge status="manual">Manual</Badge>;
  };

  const badgeTipo = (tipo) => {
    if (tipo === "repasse_proprietario") {
      return (
        <Badge status="repasse_proprietario">
          <ArrowDownRight size={12} className="mr-1" />
          Repasse
        </Badge>
      );
    }

    // fallback para despesas gerais
    return (
      <Badge status={tipo || "despesa_manutencao"}>
        <Wrench size={12} className="mr-1" />
        {labelTipo(tipo) || "Despesa"}
      </Badge>
    );
  };

  const getPessoaContrato = (d) => {
    // seu select lá da rota despesas é:
    // contrato:contratos(
    //   id,
    //   proprietario:proprietario_id(nome),
    //   inquilino:inquilino_id(nome)
    // )
    const locador = d?.contrato?.proprietario?.nome || "-";
    const locatario = d?.contrato?.inquilino?.nome || "-";
    return { locador, locatario };
  };

  /* =========================
     ACTIONS
  ========================== */
  const handleSave = async () => {
    try {
      if (!form.tipo || !form.valor || !form.data_vencimento) {
        toast.error("Campos obrigatórios", "Preencha Tipo, Valor e Vencimento.");
        return;
      }

      const payload = {
        tipo: form.tipo,
        modulo_financeiro: MODULO,
        natureza: "saida",
        valor: parseCurrencyToNumber(form.valor),
        data_vencimento: form.data_vencimento,
        descricao: form.descricao || labelTipo(form.tipo) || "Despesa manual",
        dados_cobranca_json: {
          origem: "manual",
        },
      };

      const res = await fetch("/api/financeiro/despesas", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(editingId ? "Despesa atualizada" : "Despesa criada");
      setOpenForm(false);
      resetForm();
      carregar();
    } catch (err) {
      toast.error("Erro ao salvar", err.message);
    }
  };

  const marcarComoPago = async (d) => {
    try {
      const res = await fetch("/api/financeiro/despesas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: d.id,
          status: "pago",
          data_pagamento: new Date().toISOString().split("T")[0],
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Despesa marcada como paga");
      carregar();
    } catch (err) {
      toast.error("Erro ao confirmar pagamento", err.message);
    }
  };

  const cancelar = async () => {
    try {
      const res = await fetch("/api/financeiro/despesas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: toDelete.id, status: "cancelado" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Despesa cancelada");
      setToDelete(null);
      carregar();
    } catch (err) {
      toast.error("Erro ao cancelar despesa", err.message);
    }
  };

  /* =========================
     FILTERED DATA
  ========================== */
  const dadosFiltrados = useMemo(() => {
    return (dados || [])
      .filter((d) => d?.natureza === "saida")
      .filter((d) => d?.status !== "cancelado")
      .filter((d) => !d.aluguel_base_id) // ✅ AGORA só avulsas (não ligadas ao aluguel)
      .filter((d) => {
        if (filters.status && d.status !== filters.status) return false;
        if (filters.tipo && d.tipo !== filters.tipo) return false;

        const origem = getOrigem(d);
        if (filters.origem && origem !== filters.origem) return false;

        if (filters.dataInicio && d.data_vencimento < filters.dataInicio) return false;
        if (filters.dataFim && d.data_vencimento > filters.dataFim) return false;

        return true;
      })
      .sort((a, b) => new Date(b.data_vencimento) - new Date(a.data_vencimento));
  }, [dados, filters]);

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h3 className="text-lg font-semibold">Despesas (Aluguéis)</h3>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={carregar} disabled={loading}>
            <RotateCcw size={16} />
            Atualizar
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
            <Plus size={16} /> Nova Despesa
          </Button>
        </div>
      </div>

      {/* FILTROS */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">Status</option>
            <option value="pendente">Pendente</option>
            <option value="pago">Pago</option>
            <option value="atrasado">Atrasado</option>
            <option value="cancelado">Cancelado</option>
          </Select>

          

          <Select
            value={filters.origem}
            onChange={(e) => setFilters((f) => ({ ...f, origem: e.target.value }))}
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
            onChange={(e) => setFilters((f) => ({ ...f, dataFim: e.target.value }))}
          />
        </div>
      </Card>

      {/* TABELA */}
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>ID Imóvel</TableHead>
              <TableHead>ID Contrato</TableHead>
              <TableHead>Locador</TableHead>
              <TableHead>Locatário</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  Carregando despesas...
                </TableCell>
              </TableRow>
            ) : dadosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                  Nenhuma despesa encontrada com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              dadosFiltrados.map((d) => {
                const origem = getOrigem(d);
                const automatica = origem === "automatica";
                const paga = d.status === "pago";
                

                const { locador, locatario } = getPessoaContrato(d);

                const podePagar = d.status === "pendente" || d.status === "atrasado";

                return (
                  <TableRow key={d.id}>
                    <TableCell>{badgeTipo(d.tipo)}</TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {d.imovel?.codigo_ref || "—"}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {d.contrato?.codigo || "—"}
                    </TableCell>

                    <TableCell className="text-sm">{locador}</TableCell>

                    <TableCell className="text-sm">{locatario}</TableCell>

                    <TableCell className="text-right font-medium text-red-600">
                      {formatBRL(d.valor)}
                    </TableCell>

                    <TableCell>{formatDateBR(d.data_vencimento)}</TableCell>

                    <TableCell>{badgeOrigem(origem)}</TableCell>

                    <TableCell>
                      <Badge status={d.status}>{labelStatus(d.status)}</Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {d.descricao || labelTipo(d.tipo) || "-"}
                        </span>
                        {d.imovel?.codigo_ref ? (
                          <span className="text-xs text-muted-foreground">
                            {d.imovel.codigo_ref}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {podePagar && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => marcarComoPago(d)}
                          >
                            <CheckCircle size={16} className="mr-1" />
                            Pagar
                          </Button>
                        )}

                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={automatica || paga}
                          onClick={() => {
                            setEditingId(d.id);
                            setIsAutomatica(automatica);
                            setIsPaga(paga);

                            setForm({
                              tipo: d.tipo || "despesa_manutencao",
                              valor: formatBRL(d.valor),
                              data_vencimento: (d.data_vencimento || "").slice(0, 10),
                              descricao: d.descricao || "",
                              origem: origem || "manual",
                            });

                            setOpenForm(true);
                          }}
                        >
                          <Edit size={16} />
                        </Button>

                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={paga || automatica}
                          onClick={() => setToDelete(d)}
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
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
        title={editingId ? "Editar Despesa" : "Nova Despesa Manual"}
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
              disabled={isAutomatica || isPaga}
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              {TIPOS_DESPESA_MANUAL.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>

            <p className="text-xs text-muted-foreground mt-1">
              Aqui entra despesa manual avulsa do módulo de Aluguéis (ex: franquia do seguro,
              manutenção, taxa extra).
            </p>
          </div>

          <div>
            <Label>Valor *</Label>
            <Input
              disabled={isAutomatica || isPaga}
              value={form.valor}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  valor: formatBRL(parseCurrencyToNumber(e.target.value)),
                }))
              }
            />
          </div>

          <div>
            <Label>Data de Vencimento *</Label>
            <Input
              type="date"
              disabled={isPaga}
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
              disabled={isPaga}
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Ex: Franquia do seguro incêndio, chaveiro, manutenção urgente..."
            />
          </div>
        </div>
      </Modal>

      {/* MODAL CANCELAR */}
      <Modal
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Cancelar Despesa"
      >
        <div className="space-y-4">
          <p>
            Deseja realmente <strong>cancelar</strong> esta despesa de{" "}
            <strong>{formatBRL(toDelete?.valor)}</strong>?
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Voltar
            </Button>

            <Button className="bg-red-600 hover:bg-red-700" onClick={cancelar}>
              Cancelar Despesa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
