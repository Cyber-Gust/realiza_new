"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, RefreshCcw, Loader2, Filter } from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Input, Label } from "@/components/admin/ui/Form";

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/Table";

import SearchableSelect from "@/components/admin/ui/SearchableSelect";
import { useToast } from "@/contexts/ToastContext";
import { formatDateBR } from "@/utils/currency";

/* ================================
   TIPOS DE GARANTIA
================================ */
const TIPOS_GARANTIA = [
  { value: "pessoa_fisica", label: "Pessoa Física" },
  { value: "pessoa_juridica", label: "Jurídica" },
  { value: "fiador", label: "Fiador" },
  { value: "seguro_fianca", label: "Seguro Fiança" },
  { value: "deposito_caucao", label: "Depósito Caução" },
  { value: "titulo_capitalizacao", label: "Título de Capitalização" },
  { value: "sem_garantias", label: "Sem Garantias" },
  { value: "carta_fianca_bancaria", label: "Carta Fiança Bancária" },
  { value: "garantia_real", label: "Garantia Real" },
  { value: "carta_fianca_empresa", label: "Carta Fiança Empresa" },
  { value: "caucao_imovel", label: "Caução de Imóvel" },
  { value: "locador_solidario", label: "Locador Solidário" },
  { value: "locatario_solidario", label: "Locatário Solidário" },
  { value: "fianca_digital", label: "Fiança Digital" },
  { value: "seguro_gratuito", label: "Seguro Gratuito" },
  { value: "carta_fianca_estado", label: "Carta Fiança do Estado" },
];

export default function GarantiasLocaticias() {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState([]);
  const [pessoas, setPessoas] = useState([]);

  const [filters, setFilters] = useState({
    tipoGarantia: "",
    contrato: "",
    locador_id: "",
    locatario_id: "",
    dataInicio: "",
    dataFim: "",
  });

  /* ================================
      LOAD PESSOAS (igual CRM)
  ================================ */
  useEffect(() => {
    const loadPessoas = async () => {
      try {
        const res = await fetch("/api/perfis/list?type=personas", {
          cache: "no-store",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setPessoas(json.data || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadPessoas();
  }, []);

  const pessoasOptions = useMemo(
    () =>
      pessoas.map((p) => ({
        value: p.id,
        label: p.nome,
      })),
    [pessoas]
  );

  /* ================================
      LOAD DATA
  ================================ */
  const carregar = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (filters.tipoGarantia)
        params.append("tipo_garantia", filters.tipoGarantia);
      if (filters.contrato) params.append("contrato", filters.contrato);
      if (filters.locador_id)
        params.append("locador_id", filters.locador_id);
      if (filters.locatario_id)
        params.append("locatario_id", filters.locatario_id);
      if (filters.dataInicio)
        params.append("data_inicio", filters.dataInicio);
      if (filters.dataFim) params.append("data_fim", filters.dataFim);

      const res = await fetch(
        `/api/alugueis/garantias_locaticias?${params.toString()}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao buscar garantias");

      setDados(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /* ================================
      HELPERS
  ================================ */
  const resetFilters = () => {
    setFilters({
      tipoGarantia: "",
      contrato: "",
      locador_id: "",
      locatario_id: "",
      dataInicio: "",
      dataFim: "",
    });
  };

  const renderGarantia = (tipo, dados) => {
    if (!dados) return "-";

    return (
      <div className="text-xs space-y-1">
        <div className="font-semibold">
          Tipo:
          <Badge variant="outline" className="ml-1">
            {tipo}
          </Badge>
        </div>

        {Object.entries(dados).map(([key, value]) => (
          <div key={key}>
            <span className="text-muted-foreground capitalize">
              {key.replace("_", " ")}:
            </span>{" "}
            {String(value)}
          </div>
        ))}
      </div>
    );
  };

  const linhas = useMemo(
    () =>
      (dados || []).map((item) => ({
        id: item.id,
        contrato: item.contrato,
        dataInicio: item.data_inicio,
        dataFim: item.data_fim,
        garantia: item.garantia,
      })),
    [dados]
  );

  /* ================================
      UI
  ================================ */
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-150">
      {/* HEADER */}
      <h3 className="text-xl font-semibold flex items-center gap-2 tracking-tight">
        <Filter size={18} /> Garantias Locatícias
      </h3>

      {/* FILTROS */}
      <Card className="p-5 bg-panel-card rounded-xl border-border shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          
          {/* TIPO DE GARANTIA */}
          <div>
            <Label className="text-xs font-semibold mb-2 text-muted-foreground block">
              Tipo de garantia
            </Label>
            <select
              className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={filters.tipoGarantia}
              onChange={(e) =>
                setFilters((p) => ({ ...p, tipoGarantia: e.target.value }))
              }
            >
              <option value="">Todas</option>
              {TIPOS_GARANTIA.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* CONTRATO */}
          <div>
            <Label className="text-xs font-semibold mb-2 text-muted-foreground block">
              Contrato
            </Label>
            <Input
              placeholder="Nº ou ID"
              className="h-10"
              value={filters.contrato}
              onChange={(e) =>
                setFilters((p) => ({ ...p, contrato: e.target.value }))
              }
            />
          </div>

          {/* LOCADOR */}
          <div>
            <Label className="text-xs font-semibold mb-2 text-muted-foreground block">
              Locador
            </Label>
            <SearchableSelect
              value={filters.locador_id}
              onChange={(v) =>
                setFilters((p) => ({ ...p, locador_id: v }))
              }
              options={pessoasOptions}
              placeholder="Selecione..."
            />
          </div>

          {/* LOCATÁRIO */}
          <div>
            <Label className="text-xs font-semibold mb-2 text-muted-foreground block">
              Locatário
            </Label>
            <SearchableSelect
              value={filters.locatario_id}
              onChange={(v) =>
                setFilters((p) => ({ ...p, locatario_id: v }))
              }
              options={pessoasOptions}
              placeholder="Selecione..."
            />
          </div>

          {/* DATA INÍCIO */}
          <div>
            <Label className="text-xs font-semibold mb-2 text-muted-foreground block">
              Data Início
            </Label>
            <Input
              type="date"
              className="h-10"
              value={filters.dataInicio}
              onChange={(e) =>
                setFilters((p) => ({ ...p, dataInicio: e.target.value }))
              }
            />
          </div>

          {/* DATA FIM */}
          <div>
            <Label className="text-xs font-semibold mb-2 text-muted-foreground block">
              Data Fim
            </Label>
            <Input
              type="date"
              className="h-10"
              value={filters.dataFim}
              onChange={(e) =>
                setFilters((p) => ({ ...p, dataFim: e.target.value }))
              }
            />
          </div>
        </div>

        {/* BOTÕES */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
          <Button variant="secondary" onClick={resetFilters}>
            <RefreshCcw size={14} className="mr-2" /> Limpar
          </Button>

          <Button onClick={carregar} disabled={loading}>
            {loading ? (
              <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
              <Search size={16} className="mr-2" />
            )}
            {loading ? "Buscando..." : "Pesquisar"}
          </Button>
        </div>
      </Card>

      {/* TABELA */}
      {loading ? (
        <div className="flex justify-center py-14 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : linhas.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          Nenhuma garantia encontrada.
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contrato</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead>Garantia</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {linhas.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {item.contrato.codigo}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {item.contrato.imovel}
                  </div>
                  <div className="text-xs">Locador: {item.contrato.locador}</div>
                  <div className="text-xs">
                    Locatário: {item.contrato.locatario}
                  </div>
                </TableCell>

                <TableCell>{formatDateBR(item.dataInicio)}</TableCell>
                <TableCell>{formatDateBR(item.dataFim)}</TableCell>
                <TableCell>
                  {renderGarantia(
                    item.garantia.tipo,
                    item.garantia.dados
                  )}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
