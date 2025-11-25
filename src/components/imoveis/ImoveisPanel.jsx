"use client";

import { useState, useCallback, useMemo } from "react";
import { Input, Label, Select } from "@/components/admin/ui/Form";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Search, Plus } from "lucide-react";
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
    <div className="overflow-x-auto rounded-xl border border-border bg-panel-card shadow-sm">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-muted/60 text-muted-foreground sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Título</th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Cidade</th>
            <th className="px-4 py-3">Venda (R$)</th>
            <th className="px-4 py-3">Locação (R$)</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {data.map((i) => (
            <tr key={i.id} className="border-t border-border hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">{i.codigo_ref || "-"}</td>
              <td className="px-4 py-3 truncate max-w-[200px]">{i.titulo || "-"}</td>
              <td className="px-4 py-3 capitalize">{i.tipo}</td>
              <td className="px-4 py-3">{i.endereco_cidade}</td>

              <td className="px-4 py-3">
                {i.preco_venda ? `R$ ${Number(i.preco_venda).toLocaleString("pt-BR")}` : "—"}
              </td>

              <td className="px-4 py-3">
                {i.preco_locacao ? `R$ ${Number(i.preco_locacao).toLocaleString("pt-BR")}` : "—"}
              </td>

              <td className="px-4 py-3">
                <Badge status={i.status} />
              </td>

              <td className="px-4 py-3 text-right">
                <Button
                  size="sm"
                  onClick={() =>
                    onSelect ? onSelect(i) : router.push(`/admin/imoveis/${i.id}`)
                  }
                >
                  Ver Detalhes
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
