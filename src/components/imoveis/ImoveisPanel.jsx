"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Input, Label, Select } from "@/components/admin/ui/Form";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { Search } from "lucide-react";
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

// 👉 importa suas listas
import {
  CIDADES_POR_ESTADO,
  BAIRROS_POR_CIDADE,
} from "./ImovelForm";

/* ============================================================
   ⬇️ COMPONENTE LOCAL: FILTROS
============================================================ */
function ImoveisFilters({ onFilter }) {
  const [filters, setFilters] = useState({
    tipo: "all",
    status: "all",
    disponibilidade: "all",

    cidade: "",
    bairro: "",
    rua: "",
    cep: "",

    corretor_id: "",
    proprietario_id: "",

    preco_min: "",
    preco_max: "",
  });

  const [corretores, setCorretores] = useState([]);
  const [proprietarios, setProprietarios] = useState([]);

  /* ============================================================
     LOAD PROPRIETÁRIOS
  ============================================================ */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [resPersonas, resClientes] = await Promise.all([
          fetch("/api/perfis/list?type=personas"),
          fetch("/api/perfis/list?type=clientes"),
        ]);

        const { data: personasData } = await resPersonas.json();
        const { data: clientesData } = await resClientes.json();

        if (!alive) return;

        const list = [
          ...(Array.isArray(personasData) ? personasData : []),
          ...(Array.isArray(clientesData) ? clientesData : []),
        ].map((d) => ({
          label: d.nome || d.email || "Sem nome",
          value: String(d.id),
        }));

        setProprietarios(list);
      } catch {
        setProprietarios([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /* ============================================================
     LOAD CORRETORES
  ============================================================ */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/perfis/list?type=equipe");
        const { data } = await res.json();

        if (!alive) return;

        const list = Array.isArray(data)
          ? data
              .filter((d) => ["corretor", "admin"].includes(d.role))
              .map((d) => ({
                label: d.nome_completo || d.email || "Sem nome",
                value: String(d.id),
              }))
          : [];

        setCorretores(list);
      } catch {
        setCorretores([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const tipoOptions = [
    { label: "Todos", value: "all" },
    { label: "Casa", value: "casa" },
    { label: "Apartamento", value: "apartamento" },
    { label: "Terreno", value: "terreno" },
    { label: "Comercial", value: "comercial" },
    { label: "Rural", value: "rural" },
  ];

  const statusOptions = [
    { label: "Todos", value: "all" },
    { label: "Disponível", value: "disponivel" },
    { label: "Reservado", value: "reservado" },
    { label: "Alugado", value: "alugado" },
    { label: "Vendido", value: "vendido" },
    { label: "Inativo", value: "inativo" },
  ];

  const disponibilidadeOptions = [
    { label: "Todos", value: "all" },
    { label: "Venda", value: "venda" },
    { label: "Locação", value: "locacao" },
    { label: "Ambos", value: "ambos" },
  ];

  const applyFilters = () => {
    onFilter?.({
      tipo: filters.tipo !== "all" ? filters.tipo : undefined,
      status: filters.status !== "all" ? filters.status : undefined,
      disponibilidade:
        filters.disponibilidade !== "all"
          ? filters.disponibilidade
          : undefined,

      cidade: filters.cidade || undefined,
      bairro: filters.bairro || undefined,
      rua: filters.rua || undefined,
      cep: filters.cep || undefined,

      corretor_id: filters.corretor_id || undefined,
      proprietario_id: filters.proprietario_id || undefined,

      preco_min: filters.preco_min || undefined,
      preco_max: filters.preco_max || undefined,
    });
  };

  const clearFilters = () => {
    setFilters({
      tipo: "all",
      status: "all",
      disponibilidade: "all",
      cidade: "",
      bairro: "",
      rua: "",
      cep: "",
      corretor_id: "",
      proprietario_id: "",
      preco_min: "",
      preco_max: "",
    });

    onFilter?.({});
  };

  return (
    <Card className="flex flex-wrap items-end gap-3 p-4">
      {/* Tipo */}
      <div className="min-w-[180px]">
        <Label>Tipo</Label>
        <Select
          value={filters.tipo}
          onChange={(e) => handleChange("tipo", e.target.value)}
        >
          {tipoOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Status */}
      <div className="min-w-[180px]">
        <Label>Status</Label>
        <Select
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Disponibilidade */}
      <div className="min-w-[180px]">
        <Label>Disponibilidade</Label>
        <Select
          value={filters.disponibilidade}
          onChange={(e) =>
            handleChange("disponibilidade", e.target.value)
          }
        >
          {disponibilidadeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Cidade */}
      <div className="min-w-[200px]">
        <Label>Cidade</Label>
        <Select
          value={filters.cidade}
          onChange={(e) => {
            handleChange("cidade", e.target.value);
            handleChange("bairro", "");
          }}
        >
          <option value="">Todas</option>
          {CIDADES_POR_ESTADO.MG.map((cidade) => (
            <option key={cidade} value={cidade}>
              {cidade}
            </option>
          ))}
        </Select>
      </div>

      {/* Bairro */}
      <div className="min-w-[220px]">
        <Label>Bairro</Label>
        <Select
          value={filters.bairro}
          disabled={!filters.cidade}
          onChange={(e) => handleChange("bairro", e.target.value)}
        >
          <option value="">Todos</option>
          {(BAIRROS_POR_CIDADE[filters.cidade] || []).map((bairro) => (
            <option key={bairro} value={bairro}>
              {bairro}
            </option>
          ))}
        </Select>
      </div>

      {/* Rua */}
      <div className="min-w-[180px]">
        <Label>Rua</Label>
        <Input
          value={filters.rua}
          onChange={(e) => handleChange("rua", e.target.value)}
        />
      </div>

      {/* CEP */}
      <div className="min-w-[150px]">
        <Label>CEP</Label>
        <Input
          value={filters.cep}
          onChange={(e) => handleChange("cep", e.target.value)}
        />
      </div>

      {/* Corretor */}
      <div className="min-w-[220px]">
        <Label>Corretor</Label>
        <Select
          value={filters.corretor_id}
          onChange={(e) =>
            handleChange("corretor_id", e.target.value)
          }
        >
          <option value="">Todos</option>
          {corretores.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Proprietário */}
      <div className="min-w-[220px]">
        <Label>Proprietário</Label>
        <Select
          value={filters.proprietario_id}
          onChange={(e) =>
            handleChange("proprietario_id", e.target.value)
          }
        >
          <option value="">Todos</option>
          {proprietarios.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Preços */}
      <div className="min-w-[150px]">
        <Label>Preço mín.</Label>
        <Input
          type="number"
          value={filters.preco_min}
          onChange={(e) =>
            handleChange("preco_min", e.target.value)
          }
        />
      </div>

      <div className="min-w-[150px]">
        <Label>Preço máx.</Label>
        <Input
          type="number"
          value={filters.preco_max}
          onChange={(e) =>
            handleChange("preco_max", e.target.value)
          }
        />
      </div>

      {/* Botões */}
      <div className="flex gap-2">
        <Button onClick={applyFilters}>
          <Search size={16} /> Filtrar
        </Button>
        <Button variant="secondary" onClick={clearFilters}>
          Limpar
        </Button>
      </div>
    </Card>
  );
}

/* ============================================================
   ⬇️ TABELA
============================================================ */
function ImoveisTable({ data = [] }) {
  const router = useRouter();

  if (!data.length) {
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
            <TableCell>{i.titulo || "-"}</TableCell>
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
                  router.push(`/admin/imoveis/${i.id}`)
                }
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
   ⬇️ PAINEL PRINCIPAL
============================================================ */
export default function ImoveisPanel() {
  const { imoveis, applyFilters, loading } = useImoveisQuery();

  const stats = useMemo(() => {
    return imoveis.reduce(
      (acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      },
      { disponivel: 0, reservado: 0, alugado: 0, inativo: 0 }
    );
  }, [imoveis]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI title="Disponíveis" value={stats.disponivel} />
        <KPI title="Reservados" value={stats.reservado} />
        <KPI title="Alugados" value={stats.alugado} />
        <KPI title="Inativos" value={stats.inativo} />
      </div>

      <Card className="p-4 space-y-4">
        <ImoveisFilters onFilter={applyFilters} />

        {loading ? (
          <p className="p-4 text-center text-muted-foreground">
            Carregando imóveis...
          </p>
        ) : (
          <ImoveisTable data={imoveis} />
        )}
      </Card>
    </div>
  );
}
