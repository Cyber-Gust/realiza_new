"use client";

import { useState, useCallback, useMemo } from "react";
import { Input, Label } from "@/components/admin/ui/Form";
import { Button } from "@/components/admin/ui/Button";
import { Search } from "lucide-react";

export default function ImoveisFilters({ onFilter }) {
  const [filters, setFilters] = useState({
    tipo: "all",
    status: "all",
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

  const applyFilters = () => {
    const payload = {
      tipo: filters.tipo,
      status: filters.status,
      cidade: filters.cidade.trim(),
      preco_min: filters.preco_min ? Number(filters.preco_min) : "",
      preco_max: filters.preco_max ? Number(filters.preco_max) : "",
    };

    onFilter && onFilter(payload);
  };

  const clearFilters = () => {
    const reset = {
      tipo: "all",
      status: "all",
      cidade: "",
      preco_min: "",
      preco_max: "",
    };

    setFilters(reset);
    onFilter && onFilter({});
  };

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-panel-card rounded-lg border border-border">
      {/* Tipo */}
      <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[180px]">
        <Label>Tipo</Label>
        <select
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
          value={filters.tipo}
          onChange={(e) => handleChange("tipo", e.target.value)}
        >
          {tipoOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[180px]">
        <Label>Status</Label>
        <select
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:ring-2 focus:ring-ring"
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Cidade */}
      <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[180px]">
        <Label>Cidade</Label>
        <Input
          value={filters.cidade}
          onChange={(e) => handleChange("cidade", e.target.value)}
        />
      </div>

      {/* Preço mínimo */}
      <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[150px]">
        <Label>Preço Mín.</Label>
        <Input
          type="number"
          value={filters.preco_min}
          onChange={(e) => handleChange("preco_min", e.target.value)}
        />
      </div>

      {/* Preço máximo */}
      <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[150px]">
        <Label>Preço Máx.</Label>
        <Input
          type="number"
          value={filters.preco_max}
          onChange={(e) => handleChange("preco_max", e.target.value)}
        />
      </div>

      {/* Botões */}
      <div className="flex gap-2 mt-2 sm:mt-0">
        <Button
          onClick={applyFilters}
          className="flex items-center gap-2 px-4"
        >
          <Search size={18} /> Filtrar
        </Button>

        <Button
          variant="secondary"
          onClick={clearFilters}
          className="px-4"
        >
          Limpar
        </Button>
      </div>
    </div>
  );
}
