"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Input, Label, Select } from "@/components/admin/ui/Form";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { MapPin } from "lucide-react";

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
} from "@/lib/mock_enderecos";
import Image from "next/image";

/* ============================================================
   ⬇️ COMPONENTE LOCAL: FILTROS
============================================================ */
function ImoveisFilters({ filters, setFilters }) {

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

  const handleChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const tipoOptions = [
    { label: "Todos", value: "all" },
    { label: "Casa", value: "casa" },
    { label: "Apartamento", value: "apartamento" },
    { label: "Terreno", value: "terreno" },
    { label: "Sítio", value: "sitio" },
    { label: "Fazenda", value: "fazenda" },
    { label: "Comercial", value: "comercial" },
    { label: "Lote", value: "lote" },
    { label: "Galpão", value: "galpao" },
    { label: "Cobertura Duplex", value: "cobertura_duplex" },
    { label: "Kitnet / Studio", value: "kitnet" },


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

  const clearFilters = () => {
    setFilters({
      codigo_ref: "",
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
  };

  return (
      <Card className="flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-[180px]">
        <Label>Código</Label>
        <Input
          value={filters.codigo_ref}
          onChange={(e) => handleChange("codigo_ref", e.target.value)}
          placeholder="Ex: 1023"
        />
      </div>
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

  const [corretores, setCorretores] = useState([]);
  const [proprietarios, setProprietarios] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/perfis/list?type=equipe&mode=select");
        const { data } = await res.json();
        setCorretores(data || []);
      } catch {
        setCorretores([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/perfis/list?type=personas&mode=select");
        const { data } = await res.json();
        setProprietarios(data || []);
      } catch {
        setProprietarios([]);
      }
    })();
  }, []);

  if (!data.length) {
    return (
      <p className="p-4 text-center text-muted-foreground">
        Nenhum imóvel encontrado.
      </p>
    );
  }

  const getCorretorNome = (id) => {
    const c = corretores.find((c) => c.value === String(id));
    return c?.label || "—";
  };

  const getProprietario = (id) => {
    return proprietarios.find((p) => p.value === String(id)) || null;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Imóvel</TableHead>
          <TableHead>Endereço</TableHead>
          <TableHead>Corretor</TableHead>
          <TableHead>Venda</TableHead>
          <TableHead>Locação</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Detalhes</TableHead>
        </TableRow>
      </TableHeader>

      <tbody>
       {data.map((i) => {

        const proprietario = getProprietario(i.proprietario_id)

        return (
          <TableRow key={i.id}>

          {/* IMÓVEL */}
          <TableCell>
            <div className="flex-col items-center gap-3">
        
              <Image
                src={i.imagem_principal || "/1Imovel_placehold.png"}
                alt="foto imóvel"
                className="min-w-[176px] rounded-xl h-32 md:w-32 md:h-32 object-cover border"
                width={160}
                height={160}  
              />
        
              <div className="text-x1 mt-2 text-muted-foreground font-bold">
                #{i.codigo_ref || "—"}
              </div>
        
            </div>
          </TableCell>
        
          {/* ENDEREÇO */}
          <TableCell>
            <div className="flex items-start gap-2 text-sm">
        
              <MapPin
                size={16}
                className="text-muted-foreground mt-[2px]"
              />
        
              <div className="leading-tight space-y-[2px]">

                <div className="font-medium">
                  {i.endereco_logradouro || "—"}
                </div>

                <div className="text-xs text-muted-foreground">
                  {i.endereco_cidade || ""}
                </div>

                <div className="text-xs text-muted-foreground">
                  {i.endereco_bairro || ""}
                </div>

                <div className="text-xs text-muted-foreground">
                  Proprietário: {proprietario?.label || "—"}
                </div>

                <div className="text-xs text-muted-foreground">
                  Contato: {proprietario?.telefone || "—"}
                </div>

              </div>
        
            </div>
          </TableCell>
        
          {/* CORRETOR */}
          <TableCell>
            <span className="text-sm">
            {getCorretorNome(i.corretor_id)}
            </span>
          </TableCell>
        
          {/* VENDA */}
          <TableCell className="font-medium">
            {i.preco_venda
              ? `R$ ${Number(i.preco_venda).toLocaleString("pt-BR")}`
              : "—"}
          </TableCell>
        
          {/* LOCAÇÃO */}
          <TableCell className="font-medium">
            {i.preco_locacao
              ? `R$ ${Number(i.preco_locacao).toLocaleString("pt-BR")}`
              : "—"}
          </TableCell>
        
          {/* STATUS */}
          <TableCell>
            <Badge status={i.status} />
          </TableCell>
        
          {/* DETALHES */}
          <TableCell className="text-right">
            <Button
              size="sm"
              onClick={() =>
                router.push(`/admin/imoveis/${i.id}`)
              }
            >
              Ver detalhes
            </Button>
          </TableCell>
        
        </TableRow>
        )
        })}
      </tbody>
    </Table>
  );
}

/* ============================================================
   ⬇️ PAINEL PRINCIPAL
============================================================ */
export default function ImoveisPanel() {
  
  const { imoveis, loading } = useImoveisQuery();
  const topRef = useRef(null);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  const [filters, setFilters] = useState({
    codigo_ref: "",
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

  const normalize = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acento
    .replace(/[^\w\s]/gi, "") // remove pontuação
    .toLowerCase()
    .trim();

  const filteredImoveis = useMemo(() => {
    return imoveis.filter((i) => {

      if (filters.codigo_ref &&
          !String(i.codigo_ref || "")
          .toLowerCase()
          .includes(filters.codigo_ref.toLowerCase()))
        return false;

      if (filters.tipo !== "all" && i.tipo !== filters.tipo)
        return false;

      if (filters.status !== "all" && i.status !== filters.status)
        return false;

      if (filters.cidade &&
          i.endereco_cidade !== filters.cidade)
        return false;

      if (filters.bairro &&
          i.endereco_bairro !== filters.bairro)
        return false;

      if (filters.rua &&
          !normalize(i.endereco_logradouro)
          .includes(normalize(filters.rua)))
        return false;

      if (filters.corretor_id &&
        i.corretor_id !== filters.corretor_id)
        return false;
                  
      if (filters.preco_min &&
          Number(i.preco_venda || 0) < Number(filters.preco_min))
        return false;

      if (filters.preco_max &&
          Number(i.preco_venda || 0) > Number(filters.preco_max))
        return false;

      return true;
    });
  }, [imoveis, filters]);

  const totalPages = Math.ceil(filteredImoveis.length / itemsPerPage);

  const paginatedImoveis = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    return filteredImoveis.slice(start, end);
  }, [filteredImoveis, page, itemsPerPage]);

  useEffect(() => {
    topRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [page]);

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
    <div ref={topRef} className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI title="Disponíveis" value={stats.disponivel} />
        <KPI title="Reservados" value={stats.reservado} />
        <KPI title="Alugados" value={stats.alugado} />
        <KPI title="Inativos" value={stats.inativo} />
      </div>

      <Card className="p-4 space-y-4">
        <ImoveisFilters
          filters={filters}
          setFilters={setFilters}
        />

        {loading ? (
          <p className="p-4 text-center text-muted-foreground">
            Carregando imóveis...
          </p>
        ) : (
          <ImoveisTable data={paginatedImoveis} />
        )}
        <div className="flex items-center justify-between pt-4">

          <div className="flex items-center gap-2">
            <span className="text-sm">Mostrar:</span>

            <Select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="w-[100px]"
            >
              <option value={10}>10</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
              <option value={100}>100</option>
            </Select>

            <span className="text-sm">imóveis</span>
          </div>

        </div>
        <div className="flex items-center justify-center gap-4 pt-4">

          <Button
            variant="secondary"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </Button>

          <span className="text-sm">
            Página {page} de {totalPages}
          </span>

          <Button
            variant="secondary"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima →
          </Button>

        </div>
      </Card>
    </div>
  );
}
