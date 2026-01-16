"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DollarSign,
  Search,
  RefreshCcw,
  Loader2,
  Filter,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Select, Input } from "@/components/admin/ui/Form";
import SearchableSelect from "@/components/admin/ui/SearchableSelect";

import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/Table";

import { useToast } from "@/contexts/ToastContext";

export default function ReceitasLocacaoPanel() {
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState([]);

  const [locadoresOptions, setLocadoresOptions] = useState([]);
  const [locatariosOptions, setLocatariosOptions] = useState([]);
  const [contratosOptions, setContratosOptions] = useState([]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        // ✅ LOCADORES (proprietarios)
        const r1 = await fetch("/api/perfis/list?type=personas", {
          cache: "no-store",
        });
        const j1 = await r1.json();
        if (r1.ok) {
          setLocadoresOptions(
            (j1.data || []).map((p) => ({
              value: p.id,
              label: `${p.nome}`,
            }))
          );
        }

        // ✅ LOCATÁRIOS (inquilinos)
        const r2 = await fetch("/api/perfis/list?type=personas", {
          cache: "no-store",
        });
        const j2 = await r2.json();
        if (r2.ok) {
          setLocatariosOptions(
            (j2.data || []).map((p) => ({
              value: p.id,
              label: `${p.nome}`,
            }))
          );
        }

        // ✅ CONTRATOS (locação)
        const r3 = await fetch("/api/contratos?tipo=locacao", {
          cache: "no-store",
        });
        const j3 = await r3.json();
        if (r3.ok) {
          setContratosOptions(
            (j3.data || []).map((c) => ({
              value: c.id,
              label: `#${c.codigo} • ${c?.imovel?.titulo || "Contrato"}`,
            }))
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar opções de filtro");
      }
    };

    loadOptions();
  }, [toast]);

  // ✅ Estado unificado de filtros
  const [filters, setFilters] = useState({
    contratoId: "",
    periodoInicio: "",
    periodoFim: "",
    tipoTaxa: "",

    controleConta: "",
    categoria: "",
    locador: "",
    locatario: "",

    considerarDataDe: "repasse", // repasse | pagamento | vencimento
    statusBaixa: "baixadas", // baixadas | nao_baixadas | ambas
  });

  /* ===========================================
      LOAD DATA
  ============================================ */
  const carregar = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetch(
        `/api/alugueis/receitas-locacao?${params.toString()}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Erro ao buscar receitas");

      setDados(json.data || []);
    } catch (err) {
      console.error(err);
      toast.error(`Erro ao carregar receitas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===========================================
      HELPERS
  ============================================ */
  const total = useMemo(() => {
    return dados.reduce(
      (acc, item) => acc + Number(item?.valorImobiliaria || 0),
      0
    );
  }, [dados]);

  const formatMoney = (v) => {
    return Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString("pt-BR");
  };

  const getTipoLabel = (tipo) => {
    const map = {
      receita_aluguel: "Aluguel",
      taxa_adm_imobiliaria: "Taxa Adm",
      multa: "Multa",
      juros: "Juros",
      correcao_monetaria: "Correção",
      taxa_contrato: "Taxa Contrato",
      repasse_proprietario: "Repasse",
    };
    return map[tipo] || tipo || "-";
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      contratoId: "",
      periodoInicio: "",
      periodoFim: "",
      tipoTaxa: "",
      controleConta: "",
      categoria: "",
      locador: "",
      locatario: "",
      considerarDataDe: "repasse",
      statusBaixa: "baixadas",
    });
  };

  /* ===========================================
      UI
  ============================================ */
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-150">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <h3 className="text-xl font-semibold flex items-center gap-2 tracking-tight">
          <DollarSign size={20} /> Receitas de Locação (Imobiliária)
        </h3>

        <Card className="px-4 py-2">
          <span className="text-sm font-semibold text-muted-foreground">
            Total Imobiliária:
          </span>
          <span className="text-lg text-primary"> {formatMoney(total)}</span>
        </Card>
      </div>

      {/* FILTROS */}
      <Card className="p-5 bg-panel-card rounded-xl border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={16} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Filtros de Pesquisa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {/* Contrato */}
          <div>
            <SearchableSelect
              value={filters.contratoId}
              onChange={(val) => handleFilterChange("contratoId", val)}
              options={contratosOptions}
              placeholder="Contrato (Código)"
            />
          </div>

          {/* Período início */}
          <div>
            <Input
              type="date"
              title="Data Início"
              value={filters.periodoInicio}
              onChange={(e) =>
                handleFilterChange("periodoInicio", e.target.value)
              }
              className="bg-transparent outline-none text-sm w-full text-muted-foreground"
            />
          </div>

          {/* Período fim */}
          <div>
            <Input
              type="date"
              title="Data Fim"
              value={filters.periodoFim}
              onChange={(e) => handleFilterChange("periodoFim", e.target.value)}
              className="bg-transparent outline-none text-sm w-full text-muted-foreground"
            />
          </div>

          {/* Tipo de taxa */}
          <Select
            value={filters.tipoTaxa}
            onChange={(e) => handleFilterChange("tipoTaxa", e.target.value)}
          >
            <option value="">Todas as receitas</option>
            <option value="taxa_adm_imobiliaria">Taxa Administrativa</option>
            <option value="multa">Multa</option>
            <option value="juros">Juros</option>
            <option value="correcao_monetaria">Correção Monetária</option>
            <option value="taxa_contrato">Taxa de Contrato</option>
          </Select>

          {/* Categoria */}
          <Input
            placeholder="Categoria"
            value={filters.categoria}
            onChange={(e) => handleFilterChange("categoria", e.target.value)}
            className="bg-transparent outline-none text-sm w-full"
          />

          {/* Locador */}
          <SearchableSelect
            value={filters.locador}
            onChange={(val) => handleFilterChange("locador", val)}
            options={locadoresOptions}
            placeholder="Locador (Proprietário)"
          />

          {/* Locatário */}
          <SearchableSelect
            value={filters.locatario}
            onChange={(val) => handleFilterChange("locatario", val)}
            options={locatariosOptions}
            placeholder="Locatário (Inquilino)"
          />

          {/* Considerar data de */}
          <Select
            value={filters.considerarDataDe}
            onChange={(e) =>
              handleFilterChange("considerarDataDe", e.target.value)
            }
          >
            <option value="repasse">Data: Repasse</option>
            <option value="pagamento">Data: Pagamento</option>
            <option value="vencimento">Data: Vencimento</option>
          </Select>

          {/* Status baixa */}
          <Select
            value={filters.statusBaixa}
            onChange={(e) => handleFilterChange("statusBaixa", e.target.value)}
          >
            <option value="baixadas">Apenas Baixadas</option>
            <option value="nao_baixadas">Não Baixadas</option>
            <option value="ambas">Todas (Baixadas/Não)</option>
          </Select>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-2 border-t border-border/50">
          <Button
            variant="secondary"
            className="flex items-center gap-2"
            onClick={resetFilters}
          >
            <RefreshCcw size={14} /> Limpar
          </Button>

          <Button
            onClick={carregar}
            className="flex items-center gap-2 min-w-[140px]"
            disabled={loading}
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

      {/* LISTA */}
      {loading ? (
        <div className="flex justify-center items-center py-14 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando receitas...
        </div>
      ) : dados.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground bg-panel-card border-border rounded-xl">
          Nenhuma receita encontrada com os filtros atuais.
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Repasse</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Total Imobiliária</TableHead>
            </TableRow>
          </TableHeader>

          <tbody>
            {dados.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/20 transition">
                {/* TIPO */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {item.baixado ? (
                      <CheckCircle2 size={16} className="text-green-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span className="font-medium text-foreground">
                      {getTipoLabel(item.tipo)}
                    </span>
                  </div>
                </TableCell>

                {/* VENCIMENTO */}
                <TableCell>{formatDate(item.dataVencimento)}</TableCell>

                {/* PAGAMENTO */}
                <TableCell>
                  <div className="flex flex-col">
                    <span>{formatDate(item.dataPagamento)}</span>
                    {item?.baixado && (
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">
                        Baixado
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* REPASSE */}
                <TableCell>
                  <div className="flex flex-col">
                    <span>{formatDate(item.dataRepasse)}</span>

                    {item?.repasseBaixado ? (
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-wide">
                        Repasse OK
                      </span>
                    ) : item?.dataRepasse ? (
                      <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-wide">
                        Repasse pendente
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                        Sem repasse
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* CONTRATO */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {item?.contrato?.codigo || item?.contrato?.id || "-"}
                      </Badge>
                    </div>

                    <div className="flex flex-col text-xs text-muted-foreground">
                      {item?.contrato?.locadorNome && (
                        <span>Locador: {item.contrato.locadorNome}</span>
                      )}
                      {item?.contrato?.locatarioNome && (
                        <span>Locatário: {item.contrato.locatarioNome}</span>
                      )}
                      {item?.contrato?.imovelResumo && (
                        <span className="italic">
                          {item.contrato.imovelResumo}
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* DESCRIÇÃO */}
                <TableCell
                  className="max-w-[260px] truncate text-muted-foreground"
                  title={item.descricao}
                >
                  {item.descricao || "-"}
                </TableCell>

                {/* VALOR */}
                <TableCell className="text-right font-medium text-foreground">
                  {formatMoney(item.valor)}
                </TableCell>

                {/* TOTAL IMOBILIÁRIA */}
                <TableCell className="text-right font-bold text-foreground">
                  {formatMoney(item.valorImobiliaria)}
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
