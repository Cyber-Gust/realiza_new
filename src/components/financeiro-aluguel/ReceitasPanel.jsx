"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Plus,
  RotateCcw,
  Lock,
  ArrowUpRight,
  Edit,
  Trash2,
  CheckCircle,
  ChevronDown,
  ChevronRight,
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

const MODULO = "ALUGUEL";

// ✅ Receita manual aqui vai ser tipo "serviço/avulsa"
// (você pode ajustar nomes depois se quiser)
const TIPOS_RECEITA_MANUAL = [
  { value: "outros", label: "Receita Avulsa (Serviço / Taxa)" },
];

function getLastDayOfCurrentMonthISO() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return end.toISOString().split("T")[0];
}

function getYYYYMMFromISO(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 7);
}

export default function ReceitasPanel() {
  const toast = useToast();

  /* =========================
     STATES
  ========================== */
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    status: "",
    origem: "",
    dataInicio: "",
    dataFim: "",
  });

  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [isAutomatica, setIsAutomatica] = useState(false);

  const [expandido, setExpandido] = useState({});

  const [form, setForm] = useState({
    tipo: "taxa_contrato",
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

      const [resReceitas, resDespesas] = await Promise.all([
        fetch(`/api/financeiro/receitas?modulo=${MODULO}`, { cache: "no-store" }),
        fetch(`/api/financeiro/despesas?modulo=${MODULO}`, { cache: "no-store" }),
      ]);

      const jsonReceitas = await resReceitas.json();
      const jsonDespesas = await resDespesas.json();

      if (!resReceitas.ok) throw new Error(jsonReceitas.error);
      if (!resDespesas.ok) throw new Error(jsonDespesas.error);

      const receitas = (jsonReceitas.data || []).map((x) => ({
        ...x,
        natureza: "entrada",
      }));

      const despesas = (jsonDespesas.data || [])
        // ✅ só despesas acopladas ao aluguel base
        .filter((x) => !!x.aluguel_base_id)
        // ❌ tira repasse do proprietário (não faz sentido no bruto do aluguel)
        .filter((x) => x.tipo !== "repasse_proprietario")
        .map((x) => ({
          ...x,
          natureza: "saida",
        }));

      // ✅ junta tudo
      setDados([...receitas, ...despesas]);
    } catch (err) {
      toast.error("Erro ao carregar receitas", err.message);
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
      tipo: "taxa_contrato",
      valor: "",
      data_vencimento: "",
      descricao: "",
      origem: "manual",
    });

    setEditingId(null);
    setIsAutomatica(false);
  };

  const badgeTipo = (tipo) => {
    // ✅ aluguel base / itens vinculados
    if (
      tipo === "receita_aluguel" ||
      tipo === "multa" ||
      tipo === "juros" ||
      tipo === "correcao_monetaria" ||
      tipo === "taxa_contrato"
    ) {
      return (
        <Badge status={tipo}>
          <ArrowUpRight size={12} className="mr-1" />
          {labelTipo(tipo) || "Receita"}
        </Badge>
      );
    }

    // fallback
    return (
      <Badge status="receita_servico">
        <ArrowUpRight size={12} className="mr-1" /> Receita
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

  const isBaseAluguel = (r) =>
    r.tipo === "receita_aluguel" && (r.aluguel_base_id == null || r.aluguel_base_id === "");

  const getOrigem = (r) => r?.dados_cobranca_json?.origem || "manual";

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
        valor: parseCurrencyToNumber(form.valor),
        data_vencimento: form.data_vencimento,
        descricao: form.descricao || "Receita Avulsa",
        natureza: "entrada",
        dados_cobranca_json: {
          origem: "manual",
        },
      };

      const res = await fetch("/api/financeiro/receitas", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
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
      const res = await fetch("/api/financeiro/receitas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: r.id,
          status: "pago",
          data_pagamento: new Date().toISOString().split("T")[0],
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Receita marcada como paga");
      carregar();
    } catch (err) {
      toast.error("Erro ao confirmar recebimento", err.message);
    }
  };

  const cancelar = async () => {
    try {
      const res = await fetch("/api/financeiro/receitas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: toDelete.id,
          status: "cancelado",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Receita cancelada");
      setToDelete(null);
      carregar();
    } catch (err) {
      toast.error("Erro ao cancelar receita", err.message);
    }
  };

  /* =========================
     REGRAS IMPORTANTES
     ✅ NÃO MOSTRAR FUTURO
  ========================== */
  const fimDoMesAtual = useMemo(() => getLastDayOfCurrentMonthISO(), []);

  /* =========================
     FILTRAGEM BASE (SEM FUTURO)
  ========================== */
  const dadosFiltrados = useMemo(() => {
    return (dados || [])
      .filter((r) => r?.status !== "cancelado")
      .filter((r) => {
        // ✅ corta futuro (só mês vigente pra trás)
        if (r.data_vencimento && r.data_vencimento > fimDoMesAtual) return false;

        if (filters.status && r.status !== filters.status) return false;

        const origem = getOrigem(r);
        if (filters.origem && origem !== filters.origem) return false;

        if (filters.dataInicio && r.data_vencimento < filters.dataInicio) return false;
        if (filters.dataFim && r.data_vencimento > filters.dataFim) return false;

        return true;
      })
      .sort((a, b) => new Date(b.data_vencimento) - new Date(a.data_vencimento));
  }, [dados, filters, fimDoMesAtual]);

  /* =========================
     AGRUPAMENTO POR ALUGUEL BASE
  ========================== */
  const grupos = useMemo(() => {
    const baseMap = new Map();
    const orfas = [];

    for (const r of dadosFiltrados) {
      if (isBaseAluguel(r)) {
        baseMap.set(r.id, {
          aluguelBase: r,
          itens: [],
        });
      }
    }

    for (const r of dadosFiltrados) {
      if (isBaseAluguel(r)) continue;

      if (r.aluguel_base_id && baseMap.has(r.aluguel_base_id)) {
        baseMap.get(r.aluguel_base_id).itens.push(r);
      } else {
        // ✅ órfãs só entram se forem RECEITA (entrada)
        if (r.natureza !== "saida") {
          orfas.push(r);
        }
      }
    }

    const arr = Array.from(baseMap.values());

    // órfãs = receitas manuais avulsas / coisas sem base
    // (vai aparecer como linha "normal")
    for (const o of orfas) {
      arr.push({
        aluguelBase: null,
        itens: [o],
      });
    }

    return arr;
  }, [dadosFiltrados]);

  /* =========================
     FLATTEN PRA TABELA (linhas)
  ========================== */
  const linhas = useMemo(() => {
    const out = [];

    for (const g of grupos) {
      if (g.aluguelBase) {
        out.push({
          type: "ALUGUEL_BASE",
          id: g.aluguelBase.id,
          base: g.aluguelBase,
          itens: (g.itens || []).sort(
            (a, b) => new Date(a.data_vencimento) - new Date(b.data_vencimento)
          ),
        });
      } else {
        // grupo avulso
        const item = g.itens?.[0];
        if (!item) continue;

        out.push({
          type: "AVULSA",
          id: item.id,
          base: item,
          itens: [],
        });
      }
    }

    // ordenar pela data do base
    out.sort((a, b) => {
      const da = a?.base?.data_vencimento ? new Date(a.base.data_vencimento).getTime() : 0;
      const db = b?.base?.data_vencimento ? new Date(b.base.data_vencimento).getTime() : 0;
      return db - da;
    });

    return out;
  }, [grupos]);

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <h3 className="text-lg font-semibold">Receitas (Aluguéis)</h3>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={carregar} disabled={loading}>
            <RotateCcw size={16} /> Atualizar
          </Button>

          <Button
            variant="secondary"
            onClick={() =>
              setFilters({
                status: "",
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Select
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">Status</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
          <option value="atrasado">Atrasado</option>
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
          onChange={(e) => setFilters((f) => ({ ...f, dataInicio: e.target.value }))}
        />

        <Input
          type="date"
          value={filters.dataFim}
          onChange={(e) => setFilters((f) => ({ ...f, dataFim: e.target.value }))}
        />
      </div>

      {/* TABELA */}
      <div className="overflow-hidden rounded-xl border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
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
            ) : linhas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6">
                  Nenhuma receita encontrada.
                </TableCell>
              </TableRow>
            ) : (
              linhas.map((row) => {
                const r = row.base;

                const origem = getOrigem(r);
                const automatica = origem === "automatica";

                const podeReceber = r.status === "pendente" || r.status === "atrasado";
                const isAluguel = row.type === "ALUGUEL_BASE";

                const competencia = getYYYYMMFromISO(r.data_vencimento);

                const contratoCodigo =
                  r?.contrato?.codigo ||
                  "-";

                const imovelCodigo = 
                  r?.imovel?.codigo_ref || 
                  "-";

                const locadorNome =
                  r?.contrato?.proprietario?.nome ||
                  "-";

                const locatarioNome =
                  r?.contrato?.inquilino?.nome ||
                  "-";
                const aluguelBruto = (() => {
                  if (!isAluguel) return Number(r.valor || 0);

                  const itens = row.itens || [];

                  const somaEntradas = itens
                    .filter((it) => it.natureza === "entrada")
                    .reduce((acc, it) => acc + Number(it.valor || 0), 0);

                  const somaSaidas = itens
                    .filter((it) => it.natureza === "saida")
                    .reduce((acc, it) => acc + Number(it.valor || 0), 0);

                  return Number(r.valor || 0) + somaEntradas - somaSaidas;
                })();
                  

                return (
                  <>
                    {/* Linha principal */}
                    <TableRow
                      key={row.id}
                      className={isAluguel ? "cursor-pointer" : ""}
                      onClick={() => {
                        if (!isAluguel) return;
                        setExpandido((prev) => ({
                          ...prev,
                          [row.id]: !prev[row.id],
                        }));
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isAluguel ? (
                            expandido[row.id] ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )
                          ) : null}

                          {isAluguel ? (
                            <Badge status="receita_aluguel">
                              <ArrowUpRight size={12} className="mr-1" />
                              Aluguel {competencia}
                            </Badge>
                          ) : (
                            badgeTipo(r.tipo)
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col leading-tight">
                          {isAluguel ? (
                            <>
                              <span className="text-sm font-semibold">
                                Contrato: {contratoCodigo} | Imóvel: {imovelCodigo}
                              </span>

                              <span className="text-xs text-muted-foreground">
                                Locador: {locadorNome}
                              </span>

                              <span className="text-xs text-muted-foreground">
                                Locatário: {locatarioNome}
                              </span>

                              <span className="text-xs mt-1">
                                <span className="font-medium">Descrição:</span>{" "}
                                {r.descricao || labelTipo(r.tipo) || "-"}
                              </span>

                              {row.itens?.length > 0 ? (
                                <span className="text-xs text-muted-foreground mt-1">
                                  {row.itens.length} item(ns) acoplado(s)
                                </span>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <span className="text-sm font-medium">
                                {r.descricao || "Receita Avulsa"}
                              </span>
                            </>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge status={r.status}>{labelStatus(r.status)}</Badge>
                      </TableCell>

                      <TableCell className="text-right font-medium text-green-600">
                        {formatBRL(isAluguel ? aluguelBruto : r.valor)}
                      </TableCell>

                      <TableCell>{formatDateBR(r.data_vencimento)}</TableCell>

                      <TableCell>{badgeOrigem(origem)}</TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {podeReceber && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                marcarComoPago(r);
                              }}
                            >
                              <CheckCircle size={16} className="mr-1" />
                              Confirmar
                            </Button>
                          )}

                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={automatica}
                            onClick={(e) => {
                              e.stopPropagation();

                              setEditingId(r.id);
                              setIsAutomatica(automatica);

                              setForm({
                                tipo: r.tipo,
                                valor: formatBRL(r.valor),
                                data_vencimento: r.data_vencimento,
                                descricao: r.descricao || "",
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setToDelete(r);
                            }}
                          >
                            <Trash2 size={16} className="text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expandido: itens do aluguel */}
                    {isAluguel && expandido[row.id] && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={7} className="p-0">
                          <div className="p-3 space-y-3">
                            {/* ✅ Resumo do aluguel */}
                            <div className="border border-border rounded-lg p-3 bg-background">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Aluguel base</span>
                                <span className="font-semibold text-green-600">
                                  {formatBRL(row.base?.valor || 0)}
                                </span>
                              </div>
                            </div>

                            {/* ✅ Lista de itens acoplados */}
                            {(row.itens || []).length > 0 ? (
                              <div className="space-y-2">
                                {row.itens.map((it) => (
                                  <div
                                    key={it.id}
                                    className="flex items-center justify-between text-xs border border-border rounded-lg p-2 bg-background"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{labelTipo(it.tipo) || it.tipo}</span>
                                      <span className="text-muted-foreground">
                                        {it.descricao || "-"} • Venc: {formatDateBR(it.data_vencimento)}
                                      </span>
                                    </div>

                                    <div className="text-right">
                                      <div
                                        className={`font-semibold ${
                                          it.natureza === "saida" ? "text-red-600" : "text-green-600"
                                        }`}
                                      >
                                        {it.natureza === "saida" ? "- " : "+ "}
                                        {formatBRL(it.valor)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground text-center py-2">
                                Nenhum item acoplado.
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
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
        title={editingId ? "Editar Receita" : "Nova Receita Manual"}
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
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            >
              {TIPOS_RECEITA_MANUAL.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>

            <p className="text-xs text-muted-foreground mt-1">
              Essa receita é manual e pode ser usada para serviços avulsos (vistoria,
              taxa extra, etc).
            </p>
          </div>

          <div>
            <Label>Valor *</Label>
            <Input
              disabled={isAutomatica}
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
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Ex: Vistoria, Taxa de renovação, Serviço extra..."
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

            <Button className="bg-red-600 hover:bg-red-700" onClick={cancelar}>
              Cancelar Receita
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
