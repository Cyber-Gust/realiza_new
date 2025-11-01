"use client";
import Input from "@/components/admin/forms/Input";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useMemo } from "react";
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
    // 🔹 Converte filtros para o formato que o hook entende
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
    setFilters({
      tipo: "all",
      status: "all",
      cidade: "",
      preco_min: "",
      preco_max: "",
    });
    onFilter && onFilter({});
  };

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-panel-card rounded-lg border border-border">
      {/* Tipo */}
      <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[180px]">
        <label className="text-sm font-medium text-muted-foreground">Tipo</label>
        <select
          className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
        <label className="text-sm font-medium text-muted-foreground">Status</label>
        <select
          className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
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

      <Input
        label="Cidade"
        value={filters.cidade}
        onChange={(e) => handleChange("cidade", e.target.value)}
      />

      <Input
        label="Preço Mín."
        type="number"
        value={filters.preco_min}
        onChange={(e) => handleChange("preco_min", e.target.value)}
      />

      <Input
        label="Preço Máx."
        type="number"
        value={filters.preco_max}
        onChange={(e) => handleChange("preco_max", e.target.value)}
      />

      <div className="flex gap-2 mt-2 sm:mt-0">
        <Button
          onClick={applyFilters}
          className="bg-accent hover:bg-accent/90 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Search size={18} /> Filtrar
        </Button>

        <Button
          variant="secondary"
          onClick={clearFilters}
          className="px-4 py-2 rounded-md"
        >
          Limpar
        </Button>
      </div>
    </div>
  );
}
