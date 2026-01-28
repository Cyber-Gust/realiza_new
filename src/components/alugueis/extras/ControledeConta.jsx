"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCcw,
  Loader2,
  Filter,
  Plus,
  Minus,
} from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Input, Label } from "@/components/admin/ui/Form";
import { MultiSelectCheckbox } from "@/components/admin/ui/MultiSelectCheckbox";


import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/Table";

import { useToast } from "@/contexts/ToastContext";
import { formatDateBR } from "@/utils/currency";

/* ================================
   CONTROLE DE CONTA (ENUM)
================================ */
const CONTAS = [
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

export default function ControledeConta() {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState([]);

  const [filters, setFilters] = useState({
    contas: [],
    periodoInicio: "",
    periodoFim: "",
  });

  /* ================================
      HELPERS
  ================================ */
  const formatMoney = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const resetFilters = () => {
    setFilters({
      contas: [],
      periodoInicio: "",
      periodoFim: "",
    });
  };

  /* ================================
      LOAD DATA
  ================================ */
  const carregar = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/alugueis/controle_conta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipos: filters.contas,
          data_inicio: filters.periodoInicio || null,
          data_fim: filters.periodoFim || null,
        }),
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao buscar lançamentos");

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
  }, [carregar]); // carga inicial

  /* ================================
      TRANSFORM DATA
  ================================ */
  const linhas = useMemo(() => {
    return (dados || []).map((r) => {
      const negativo = r.natureza === "saida";
      const valorFinal = negativo
        ? -Math.abs(Number(r.valor))
        : Number(r.valor);

      return {
        id: r.id,
        tipo: r.tipo,
        natureza: r.natureza,
        valor: valorFinal,
        data: r.data_pagamento || r.data_vencimento,
        descricao: r.descricao,

        contrato: {
          codigo: r?.contratos?.codigo,
          locador: r?.contratos?.proprietario?.nome,
          locatario: r?.contratos?.inquilino?.nome,
          imovelCodigo: r?.contratos?.imoveis?.codigo_ref,
          imovelTitulo: r?.contratos?.imoveis?.titulo,
        },
      };
    });
  }, [dados]);

  /* ================================
      UI
  ================================ */
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-150">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold flex items-center gap-2 tracking-tight">
          <Filter size={18} /> Lançamentos por Controle de Conta
        </h3>
      </div>

      {/* FILTROS */}
      <Card className="p-5 bg-panel-card rounded-xl border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Filtros
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* CONTROLE DE CONTA */}
          <div className="md:col-span-2">
            <p className="text-xs font-semibold mb-2 text-muted-foreground">
              Controle de conta
            </p>

            <MultiSelectCheckbox
              options={CONTAS}
              value={filters.contas}
              onChange={(values) =>
                setFilters((prev) => ({
                  ...prev,
                  contas: values,
                }))
              }
              placeholder="Selecione os tipos de conta"
            />
          </div>


          {/* PERÍODO */}
          <div>
            <Label className="text-xs font-semibold mb-2 text-muted-foreground">
              Início 
            </Label>
            <Input
              type="date"
              value={filters.periodoInicio}
              onChange={(e) =>
                setFilters((p) => ({ ...p, periodoInicio: e.target.value }))
              }
            />
          </div>

          <div>
            <Label className="text-xs font-semibold mb-2 text-muted-foreground">
              Fim 
            </Label>
            <Input
              type="date"
              value={filters.periodoFim}
              onChange={(e) =>
                setFilters((p) => ({ ...p, periodoFim: e.target.value }))
              }
            />
          </div>
        </div>

        {/* BOTÕES */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border/50">
          <Button
            variant="secondary"
            onClick={resetFilters}
            className="flex items-center gap-2"
          >
            <RefreshCcw size={14} /> Limpar
          </Button>

          <Button
            onClick={carregar}
            disabled={loading}
            className="flex items-center gap-2 min-w-[140px]"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            {loading ? "Buscando..." : "Pesquisar"}
          </Button>
        </div>
      </Card>

      {/* TABELA */}
      {loading ? (
        <div className="flex justify-center items-center py-14 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando lançamentos...
        </div>
      ) : linhas.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground bg-panel-card border-border rounded-xl">
          Nenhum lançamento encontrado com os filtros atuais.
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>±</TableHead>
              <TableHead>Conta</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {linhas.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/20 transition">
                {/* + / - */}
                <TableCell>
                  {item.valor < 0 ? (
                    <Minus size={16} className="text-red-500" />
                  ) : (
                    <Plus size={16} className="text-green-600" />
                  )}
                </TableCell>

                {/* CONTA */}
                <TableCell>
                  <Badge variant="outline">{item.tipo}</Badge>
                </TableCell>

                {/* CONTRATO */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className="font-mono w-[20px] text-xs">
                      {item.contrato.codigo || "-"}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {item.contrato.locador && (
                        <span>Locador: {item.contrato.locador}</span>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">  
                      {item.contrato.locatario && (
                        <span>Locatário: {item.contrato.locatario}</span>
                      )}
                      {item.contrato.imovelCodigo && (
                        <div className="italic">
                          {item.contrato.imovelCodigo} —{" "}
                          {item.contrato.imovelTitulo}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* DATA */}
                <TableCell>{formatDateBR(item.data)}</TableCell>

                {/* DESCRIÇÃO */}
                <TableCell className="max-w-[260px] whitespace-normal break-words text-muted-foreground">
                  {item.descricao}
                </TableCell>

                {/* VALOR */}
                <TableCell
                  className={`text-right font-semibold ${
                    item.valor < 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {item.valor < 0 && "- "}
                  {formatMoney(Math.abs(item.valor))}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}