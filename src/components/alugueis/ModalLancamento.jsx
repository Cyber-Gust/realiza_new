"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Label, Input, Select, Textarea } from "@/components/admin/ui/Form";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { Card } from "@/components/admin/ui/Card";

/* =============================
    HELPERS
============================== */
function pad2(n) {
  return String(n).padStart(2, "0");
}

function toNumberBR(value) {
  if (value == null) return NaN;
  const raw = String(value).trim().replace(".", "").replace(",", ".");
  const n = Number(raw);
  return n;
}

function monthYearToISO(competencia, dia = 5) {
  // "MM/YYYY" -> "YYYY-MM-DD"
  const [mm, yyyy] = String(competencia || "").split("/");
  const month = Number(mm);
  const year = Number(yyyy);

  if (!month || !year) return null;

  const dt = new Date(year, month - 1, dia);
  const iso = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  return iso;
}

function addMonthsISO(isoDate, add) {
  // isoDate "YYYY-MM-DD"
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setMonth(dt.getMonth() + add);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
}

function getMonthYearOptions(rangeYears = 6) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const startYear = currentYear - rangeYears;
  const endYear = currentYear + rangeYears;

  const list = [];
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      list.push(`${pad2(m)}/${y}`);
    }
  }

  return list;
}

/* =============================
    TIPOS (texto, não enum)
============================== */
const LANCAMENTO_TIPOS = [
  { value: "condominio", label: "Condomínio" },
  { value: "consumo_agua", label: "Consumo de água" },
  { value: "consumo_luz", label: "Consumo de luz" },
  { value: "desconto_aluguel", label: "Desconto de aluguel" },
  { value: "fundo_reserva", label: "Fundo de reserva" },
  { value: "gas", label: "Gás" },
  { value: "iptu", label: "IPTU" },
  { value: "manutencao", label: "Manutenção" },
  { value: "outros", label: "Outros" },
  { value: "rescisao", label: "Rescisão" },
  { value: "seguro_fianca", label: "Seguro-fiança" },
  { value: "seguro_incendio", label: "Seguro-incêndio" },
  { value: "taxa", label: "Taxa" },
  { value: "boleto", label: "Boleto" },
];

export default function ModalLancamento({
  open,
  onClose,
  contrato,
  locador,
  onSaved,
}) {
  const toast = useToast();
  const competenciaOptions = useMemo(() => getMonthYearOptions(6), []);

  const defaultCompetencia = useMemo(() => {
    const now = new Date();
    return `${pad2(now.getMonth() + 1)}/${now.getFullYear()}`;
  }, []);

  /* =============================
      FORM STATE
  ============================== */
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    locador_nome: "",
    contrato_codigo: "",

    tipo_lancamento_texto: "",
    natureza_texto: "debito", // debito | credito

    descricao: "",
    valor: "",

    competencia: defaultCompetencia,

    recorrencia: "unico", // unico | fixo | parcelas

    qtd_parcelas: "",
    inicio_parcelas: defaultCompetencia,

    dividir_valor: true,
    valor_cheio_cada_parcela: false,
  });

  const [previewParcelas, setPreviewParcelas] = useState([]);

  /* =============================
      SYNC CONTRATO/LOCADOR
  ============================== */
  useEffect(() => {
    if (!open) return;

    setForm((prev) => ({
      ...prev,
      locador_nome: locador?.nome || "",
      contrato_codigo: String(contrato?.codigo ?? ""),
      competencia: defaultCompetencia,
      inicio_parcelas: defaultCompetencia,
    }));

    setPreviewParcelas([]);
  }, [open, contrato, locador, defaultCompetencia]);

  /* =============================
      HANDLERS
  ============================== */
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  function resetFormSoft() {
    setForm((prev) => ({
      ...prev,
      tipo_lancamento_texto: "",
      natureza_texto: "debito",
      descricao: "",
      valor: "",
      recorrencia: "unico",
      qtd_parcelas: "",
      competencia: defaultCompetencia,
      inicio_parcelas: defaultCompetencia,
      dividir_valor: true,
      valor_cheio_cada_parcela: false,
    }));
    setPreviewParcelas([]);
  }

  function buildParcelas() {
    const totalValor = toNumberBR(form.valor);
    const qtd = Number(form.qtd_parcelas);

    if (!Number.isFinite(totalValor) || totalValor <= 0) return [];
    if (!qtd || qtd < 2) return [];

    const inicioISO = monthYearToISO(form.inicio_parcelas || form.competencia, 5);
    if (!inicioISO) return [];

    const parcelas = [];

    // caso 1: dividir valor
    if (form.dividir_valor) {
      const base = totalValor / qtd;

      for (let i = 0; i < qtd; i++) {
        parcelas.push({
          numero: i + 1,
          data_vencimento: addMonthsISO(inicioISO, i),
          valor: Number(base.toFixed(2)),
        });
      }

      return parcelas;
    }

    // caso 2: valor cheio em cada parcela
    if (form.valor_cheio_cada_parcela) {
      for (let i = 0; i < qtd; i++) {
        parcelas.push({
          numero: i + 1,
          data_vencimento: addMonthsISO(inicioISO, i),
          valor: Number(totalValor.toFixed(2)),
        });
      }
      return parcelas;
    }

    // fallback seguro: se nenhuma opção marcada (não deveria)
    const base = totalValor / qtd;
    for (let i = 0; i < qtd; i++) {
      parcelas.push({
        numero: i + 1,
        data_vencimento: addMonthsISO(inicioISO, i),
        valor: Number(base.toFixed(2)),
      });
    }
    return parcelas;
  }

  function validateForm() {
    // Contrato/locador
    if (!contrato?.id) return toast.error("Contrato inválido (sem ID).");
    if (!locador?.id) return toast.error("Locador inválido (sem ID).");

    // Tipo
    if (!form.tipo_lancamento_texto) return toast.error("Selecione o tipo do lançamento.");

    // Natureza
    if (!["debito", "credito"].includes(form.natureza_texto)) {
      return toast.error("Selecione se é Débito ou Crédito.");
    }

    // Desc
    if (!form.descricao || form.descricao.trim().length < 2) {
      return toast.error("A descrição é obrigatória.");
    }

    // Valor
    const valor = toNumberBR(form.valor);
    if (!Number.isFinite(valor) || valor <= 0) {
      return toast.error("Informe um valor válido.");
    }

    // Competência
    if (!form.competencia) return toast.error("Selecione o mês de vigência.");
    const isoCompetencia = monthYearToISO(form.competencia, 5);
    if (!isoCompetencia) return toast.error("Mês de vigência inválido.");

    // Recorrência
    if (!["unico", "fixo", "parcelas"].includes(form.recorrencia)) {
      return toast.error("Selecione o tipo de recorrência.");
    }

    // Parcelas
    if (form.recorrencia === "parcelas") {
      const qtd = Number(form.qtd_parcelas);
      if (!qtd || qtd < 2) return toast.error("Quantidade de parcelas deve ser no mínimo 2.");
      if (qtd > 120) return toast.error("Quantidade de parcelas muito alta (máx 120).");

      if (!form.inicio_parcelas) return toast.error("Selecione o início das parcelas.");

      const inicioISO = monthYearToISO(form.inicio_parcelas, 5);
      if (!inicioISO) return toast.error("Início das parcelas inválido.");

      const marcouDividir = !!form.dividir_valor;
      const marcouCheio = !!form.valor_cheio_cada_parcela;

      // não pode os dois
      if (marcouDividir && marcouCheio) {
        return toast.error("Escolha apenas UMA opção: dividir ou valor cheio.");
      }

      // tem que ter um deles marcado
      if (!marcouDividir && !marcouCheio) {
        return toast.error("Selecione: dividir valor ou valor cheio em cada parcela.");
      }

      const parcelas = buildParcelas();
      if (!parcelas.length) return toast.error("Não foi possível gerar as parcelas. Verifique os campos.");
    }

    return true;
  }

  async function handlePreview() {
    if (form.recorrencia !== "parcelas") {
      setPreviewParcelas([]);
      return;
    }

    // Preview mais permissivo: só não deixa preview se estiver obviamente quebrado
    const parcelas = buildParcelas();
    if (!parcelas.length) {
      setPreviewParcelas([]);
      toast.error("Preencha valor, início e quantidade de parcelas pra gerar a prévia.");
      return;
    }

    setPreviewParcelas(parcelas);
  }

  async function handleSave() {
    try {
        setSaving(true);

        const ok = validateForm();
        if (ok !== true) return;

        const valorNumerico = toNumberBR(form.valor);

        const payload = {
        contrato_id: contrato.id,
        imovel_id: contrato.imovel_id ?? null,
        locador_id: locador.id,

        tipo_lancamento_texto: form.tipo_lancamento_texto,
        natureza_texto: form.natureza_texto,

        descricao: form.descricao.trim(),
        valor_total: Number(valorNumerico.toFixed(2)),

        competencia: form.competencia,
        recorrencia: form.recorrencia,

        qtd_parcelas: form.recorrencia === "parcelas" ? Number(form.qtd_parcelas) : null,
        inicio_parcelas: form.recorrencia === "parcelas" ? form.inicio_parcelas : null,
        dividir_valor: form.recorrencia === "parcelas" ? !!form.dividir_valor : null,
        valor_cheio_cada_parcela:
            form.recorrencia === "parcelas" ? !!form.valor_cheio_cada_parcela : null,
        };

        const res = await fetch("/api/alugueis/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Erro ao criar lançamento");

        toast.success(`Lançamento criado! (${json?.meta?.total_inseridas || 1} transação(ões))`);

        // opcional: devolve pro componente pai, se você estiver atualizando tabela
        onSaved?.(json.data);

        resetFormSoft();
        onClose?.();
    } catch (err) {
        toast.error(err?.message || "Erro ao criar lançamento");
    } finally {
        setSaving(false);
    }
    }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !saving && onClose?.()}
      />

      {/* modal */}
      <div className="absolute left-1/2 top-1/2 w-[95vw] max-w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Novo lançamento</h3>
            <p className="text-xs text-gray-500">
              Esse lançamento será vinculado ao contrato selecionado.
            </p>
          </div>

          <button
            className="rounded-md p-2 hover:bg-gray-100"
            onClick={() => !saving && onClose?.()}
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-6">
          {/* FIXOS: Locador / Contrato */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Locador">
                <Input value={form.locador_nome} disabled />
              </Field>

              <Field label="Contrato">
                <Input value={form.contrato_codigo} disabled />
              </Field>
            </div>
          </Card>

          {/* DADOS PRINCIPAIS */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Tipo do lançamento">
                <Select
                  value={form.tipo_lancamento_texto}
                  onChange={(e) => updateField("tipo_lancamento_texto", e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {LANCAMENTO_TIPOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Natureza">
                <Select
                  value={form.natureza_texto}
                  onChange={(e) => updateField("natureza_texto", e.target.value)}
                >
                  <option value="debito">Desconto</option>
                  <option value="credito">Acrescimo</option>
                </Select>
              </Field>

              <div className="md:col-span-2">
                <Field label="Descrição">
                  <Textarea
                    value={form.descricao}
                    onChange={(e) => updateField("descricao", e.target.value)}
                    className="min-h-[90px]"
                    placeholder="Ex: Consumo de água do mês..."
                  />
                </Field>
              </div>

              <Field label="Valor (R$)">
                <Input
                  type="text"
                  value={form.valor}
                  onChange={(e) => updateField("valor", e.target.value)}
                  placeholder="Ex: 120,50"
                />
              </Field>

              <Field label="Mês de vigência (competência)">
                <Select
                  value={form.competencia}
                  onChange={(e) => {
                    updateField("competencia", e.target.value);

                    // se estiver em modo unico/fixo, o início das parcelas pode acompanhar
                    if (form.recorrencia !== "parcelas") {
                      updateField("inicio_parcelas", e.target.value);
                    }
                  }}
                >
                  {competenciaOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          {/* RECORRÊNCIA */}
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <Field label="Recorrência">
                <Select
                  value={form.recorrencia}
                  onChange={(e) => {
                    const next = e.target.value;
                    updateField("recorrencia", next);
                    setPreviewParcelas([]);

                    // reset das configs de parcelas quando troca
                    if (next !== "parcelas") {
                      updateField("qtd_parcelas", "");
                      updateField("dividir_valor", true);
                      updateField("valor_cheio_cada_parcela", false);
                      updateField("inicio_parcelas", form.competencia);
                    }
                  }}
                >
                  <option value="unico">Único (avulso)</option>
                  <option value="fixo">Fixo (todo mês)</option>
                  <option value="parcelas">Parcelas</option>
                </Select>
              </Field>

              <div className="md:col-span-2 flex gap-2 justify-end">
                <Button
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={form.recorrencia !== "parcelas"}
                >
                  Prévia parcelas
                </Button>
              </div>
            </div>

            {/* PARCELAS CONFIG */}
            {form.recorrencia === "parcelas" && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Quantidade de parcelas">
                    <Input
                      type="number"
                      value={form.qtd_parcelas}
                      onChange={(e) => updateField("qtd_parcelas", e.target.value)}
                      placeholder="Ex: 3"
                      min={2}
                    />
                  </Field>

                  <Field label="Início das parcelas">
                    <Select
                      value={form.inicio_parcelas}
                      onChange={(e) => updateField("inicio_parcelas", e.target.value)}
                    >
                      {competenciaOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-semibold">Dividir valor entre parcelas</p>
                    <p className="text-xs text-gray-500 mt-1">
                      O valor total será diluído pela quantidade.
                    </p>

                    <div className="mt-3 flex gap-2">
                      <Button
                        variant={form.dividir_valor ? "default" : "secondary"}
                        onClick={() => {
                          updateField("dividir_valor", true);
                          updateField("valor_cheio_cada_parcela", false);
                          setPreviewParcelas([]);
                        }}
                      >
                        Ativar
                      </Button>

                      <Button
                        variant={!form.dividir_valor ? "default" : "secondary"}
                        onClick={() => {
                          updateField("dividir_valor", false);
                          setPreviewParcelas([]);
                        }}
                      >
                        Desativar
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border p-3">
                    <p className="text-sm font-semibold">Valor cheio em cada parcela</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Cobra o valor total em todas as parcelas.
                    </p>

                    <div className="mt-3 flex gap-2">
                      <Button
                        variant={form.valor_cheio_cada_parcela ? "default" : "secondary"}
                        onClick={() => {
                          updateField("valor_cheio_cada_parcela", true);
                          updateField("dividir_valor", false);
                          setPreviewParcelas([]);
                        }}
                      >
                        Ativar
                      </Button>

                      <Button
                        variant={!form.valor_cheio_cada_parcela ? "default" : "secondary"}
                        onClick={() => {
                          updateField("valor_cheio_cada_parcela", false);
                          setPreviewParcelas([]);
                        }}
                      >
                        Desativar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* PREVIEW */}
                {previewParcelas?.length > 0 && (
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Prévia das parcelas</p>
                      <Button variant="secondary" onClick={() => setPreviewParcelas([])}>
                        Limpar
                      </Button>
                    </div>

                    <div className="mt-3 space-y-1 text-sm">
                      {previewParcelas.map((p) => (
                        <div
                          key={`${p.numero}-${p.data_vencimento}`}
                          className="flex items-center justify-between"
                        >
                          <span>
                            Parcela {p.numero} | Venc.: {p.data_vencimento}
                          </span>
                          <span className="font-semibold">
                            R$ {Number(p.valor).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* AÇÕES */}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving && <Loader2 className="animate-spin" size={16} />}
              Salvar lançamento
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================
    FIELD
============================== */
function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs tracking-wide">{label}</Label>
      {children}
    </div>
  );
}
