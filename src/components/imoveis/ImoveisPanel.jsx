"use client";

import { useState, useCallback, useMemo } from "react";
import { Input, Label, Select } from "@/components/admin/ui/Form";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Search, Plus } from "lucide-react";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/Table";
import Badge from "@/components/admin/ui/Badge";
import KPI from "@/components/admin/ui/KPIWidget";

import { useRouter } from "next/navigation";
import { useImoveisQuery } from "@/hooks/useImoveisQuery";

/* ============================================================
   ⬇️ COMPONENTE LOCAL: FILTROS
============================================================ */
function ImoveisFilters({ onFilter }) {
  const [filters, setFilters] = useState({
    tipo: "all",
    status: "all",
    disponibilidade: "all",
    cidade: "",
    preco_min: "",
    preco_max: "",
  });

  const handleChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const tipoOptions = useMemo(
    () => [
      { label: "Todos", value: "all" },
      { label: "Casa", value: "casa" },
      { label: "Apartamento", value: "apartamento" },
      { label: "Terreno", value: "terreno" },
      { label: "Comercial", value: "comercial" },
      { label: "Rural", value: "rural" },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { label: "Todos", value: "all" },
      { label: "Disponível", value: "disponivel" },
      { label: "Reservado", value: "reservado" },
      { label: "Alugado", value: "alugado" },
      { label: "Vendido", value: "vendido" },
      { label: "Inativo", value: "inativo" },
    ],
    []
  );

  const disponibilidadeOptions = useMemo(
    () => [
      { label: "Todos", value: "all" },
      { label: "Venda", value: "venda" },
      { label: "Locação", value: "locacao" },
      { label: "Ambos", value: "ambos" },
    ],
    []
  );

  const applyFilters = () => {
    const payload = {
      tipo: filters.tipo !== "all" ? filters.tipo : undefined,
      status: filters.status !== "all" ? filters.status : undefined,
      disponibilidade:
        filters.disponibilidade !== "all" ? filters.disponibilidade : undefined,
      cidade: filters.cidade?.trim() || undefined,
      preco_min: filters.preco_min ? Number(filters.preco_min) : undefined,
      preco_max: filters.preco_max ? Number(filters.preco_max) : undefined,
    };

    onFilter?.(payload);
  };

  const clearFilters = () => {
    const reset = {
      tipo: "all",
      status: "all",
      disponibilidade: "all",
      cidade: "",
      preco_min: "",
      preco_max: "",
    };

    setFilters(reset);
    onFilter?.({});
  };

  return (
    <Card className="flex flex-wrap items-end gap-3 p-4 bg-panel-card border border-border">
      {/* Tipo */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <Label>Tipo</Label>
        <Select value={filters.tipo} onChange={(e) => handleChange("tipo", e.target.value)}>
          {tipoOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <Label>Status</Label>
        <Select value={filters.status} onChange={(e) => handleChange("status", e.target.value)}>
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {/* Disponibilidade */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <Label>Disponibilidade</Label>
        <Select value={filters.disponibilidade} onChange={(e) => handleChange("disponibilidade", e.target.value)}>
          {disponibilidadeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>

      {/* Cidade */}
      <div className="flex flex-col gap-1 min-w-[180px]">
        <Label>Cidade</Label>
        <Input value={filters.cidade} onChange={(e) => handleChange("cidade", e.target.value)} />
      </div>

      {/* Preço mínimo */}
      <div className="flex flex-col gap-1 min-w-[150px]">
        <Label>Preço mín.</Label>
        <Input type="number" value={filters.preco_min} onChange={(e) => handleChange("preco_min", e.target.value)} />
      </div>

      {/* Preço máximo */}
      <div className="flex flex-col gap-1 min-w-[150px]">
        <Label>Preço máx.</Label>
        <Input type="number" value={filters.preco_max} onChange={(e) => handleChange("preco_max", e.target.value)} />
      </div>

      {/* Botões */}
      <div className="flex gap-2 mt-2">
        <Button onClick={applyFilters} className="flex items-center gap-2">
          <Search size={18} /> Filtrar
        </Button>

        <Button variant="secondary" onClick={clearFilters}>
          Limpar
        </Button>
      </div>
    </Card>
  );
}

/* ============================================================
   ⬇️ COMPONENTE LOCAL: TABELA
============================================================ */
function ImoveisTable({ data = [], onSelect }) {
  const router = useRouter();

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <p className="p-4 text-center text-muted-foreground">
        Nenhum imóvel encontrado.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código</TableHead>
          <TableHead>Título</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Cidade</TableHead>
          <TableHead>Venda (R$)</TableHead>
          <TableHead>Locação (R$)</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>

      <tbody>
        {data.map((i) => (
          <TableRow key={i.id}>
            <TableCell>{i.codigo_ref || "-"}</TableCell>

            <TableCell className="truncate max-w-[200px]">
              {i.titulo || "-"}
            </TableCell>

            <TableCell className="capitalize">{i.tipo}</TableCell>

            <TableCell>{i.endereco_cidade}</TableCell>

            <TableCell>
              {i.preco_venda
                ? `R$ ${Number(i.preco_venda).toLocaleString("pt-BR")}`
                : "—"}
            </TableCell>

            <TableCell>
              {i.preco_locacao
                ? `R$ ${Number(i.preco_locacao).toLocaleString("pt-BR")}`
                : "—"}
            </TableCell>

            <TableCell>
              <Badge status={i.status} />
            </TableCell>

            <TableCell className="text-right">
              <Button
                size="sm"
                onClick={() =>
                  onSelect ? onSelect(i) : router.push(`/admin/imoveis/${i.id}`)
                }
                className="rounded-lg shadow-sm"
              >
                Ver Detalhes
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}

/* ============================================================
   ⬇️ COMPONENTE PRINCIPAL: PAINEL COMPLETO
============================================================ */
export default function ImoveisPanel() {
  const router = useRouter();
  const { imoveis, applyFilters, loading } = useImoveisQuery();

  const stats = useMemo(() => {
    if (!Array.isArray(imoveis)) {
      return { disponivel: 0, reservado: 0, alugado: 0, inativo: 0 };
    }

    return imoveis.reduce(
      (acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      },
      { disponivel: 0, reservado: 0, alugado: 0, inativo: 0 }
    );
  }, [imoveis]);

  return (
    <div className="space-y-10">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI title="Disponíveis" value={stats.disponivel} />
        <KPI title="Reservados" value={stats.reservado} />
        <KPI title="Alugados" value={stats.alugado} />
        <KPI title="Inativos" value={stats.inativo} />
      </div>

      {/* Filtros + Tabela */}
      <Card className="p-4 space-y-4">
        <ImoveisFilters onFilter={applyFilters} />

        {loading ? (
          <p className="p-4 text-center text-muted-foreground">Carregando imóveis...</p>
        ) : (
          <ImoveisTable data={imoveis} />
        )}
      </Card>
    </div>
  );
}
