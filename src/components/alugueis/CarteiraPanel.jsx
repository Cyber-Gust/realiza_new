"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  RefreshCcw, 
  Home, 
  User2, 
  MapPin, 
  Calendar, 
  DollarSign,
  ArrowUpRight,
  Search,
  FilterX
} from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Select } from "@/components/admin/ui/Form"; // Assumindo que você tem esse componente base
import { Skeleton } from "@/components/admin/ui/Skeleton";
import ContratoLocacaoDrawer from "./ContratoLocacaoDrawer";
import SearchableSelect from "@/components/admin/ui/SearchableSelect"; // Do seu exemplo
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

export default function CarteiraPanel() {
  const { error: toastError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [carteira, setCarteira] = useState([]);
  const [selectedContratoId, setSelectedContratoId] = useState(null);
  const [openDrawer, setOpenDrawer] = useState(false);

  const handleOpenDrawer = (contratoId) => {
    setSelectedContratoId(contratoId);
    setOpenDrawer(true);
  };

  const handleCloseDrawer = () => {
    setOpenDrawer(false);
    setSelectedContratoId(null);
  };

  // Estado dos filtros (igual ao padrão do CRM)
  const [filters, setFilters] = useState({
    search: "",
    status_financeiro: "",
    dia_vencimento: "",
    inquilino_id: "", // Usaremos o nome ou ID se disponível
  });

  /* ===========================================
      LOAD DATA
  ============================================ */
  const loadCarteira = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alugueis?view=carteira", { cache: "no-store" });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || "Erro ao carregar carteira");
      
      setCarteira(json.data || []);
    } catch (err) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { loadCarteira(); }, [loadCarteira]);

  /* ===========================================
      FILTROS (Lógica)
  ============================================ */
  // Extrair opções únicas para os selects baseado nos dados carregados
  const uniqueInquilinos = useMemo(() => {
    const map = new Map();
    carteira.forEach(c => {
      if (c.inquilino?.id) map.set(c.inquilino.id, c.inquilino.nome);
    });
    return Array.from(map.entries()).map(([id, nome]) => ({ value: id, label: nome }));
  }, [carteira]);

  const uniqueDias = useMemo(() => {
    const dias = new Set(carteira.map(c => c.dia_vencimento_aluguel).filter(Boolean));
    return Array.from(dias).sort((a, b) => a - b);
  }, [carteira]);

  const filtered = useMemo(() => {
    return carteira.filter((c) => {
      // Filtro de Texto (Busca Geral)
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const match = 
          c.imoveis?.titulo?.toLowerCase().includes(s) ||
          c.inquilino?.nome?.toLowerCase().includes(s);
        if (!match) return false;
      }

      // Filtro de Status
      if (filters.status_financeiro && c.status_financeiro !== filters.status_financeiro) {
        return false;
      }

      // Filtro de Inquilino (Select)
      if (filters.inquilino_id && c.inquilino?.id !== filters.inquilino_id) {
        return false;
      }

      // Filtro de Dia de Vencimento
      if (filters.dia_vencimento && String(c.dia_vencimento_aluguel) !== filters.dia_vencimento) {
        return false;
      }

      return true;
    });
  }, [carteira, filters]);

  /* ===========================================
      UI
  ============================================ */
  if (loading) return <LoadingState />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Home size={22} />
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Carteira de Locações</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Gerencie o fluxo financeiro de <strong>{carteira.length} contratos ativos</strong>.
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={loadCarteira} 
          className="gap-2 shadow-sm"
        >
          <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
          Sincronizar
        </Button>
      </div>

      {/* ÁREA DE FILTROS (Estilo CRM) */}
      <Card className="p-5 bg-panel-card rounded-xl border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Busca Texto */}
          <div className="md:col-span-4 flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-background/50 focus-within:ring-1 focus-within:ring-primary transition-all">
            <Search size={16} className="text-muted-foreground" />
            <input
              placeholder="Buscar imóvel ou inquilino..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground/70"
            />
          </div>

          {/* Select Status */}
          <div className="md:col-span-3">
            <Select
              value={filters.status_financeiro}
              onChange={(e) => setFilters(f => ({ ...f, status_financeiro: e.target.value }))}
              className="w-full"
            >
              <option value="">Status Financeiro</option>
              <option value="regular">Regular (Em dia)</option>
              <option value="pendente">Pendente (A vencer)</option>
              <option value="atrasado">Atrasado</option>
            </Select>
          </div>

          {/* Select Inquilino (Searchable) */}
          <div className="md:col-span-3">
             <SearchableSelect
                value={filters.inquilino_id}
                onChange={(val) => setFilters(f => ({ ...f, inquilino_id: val }))}
                options={uniqueInquilinos}
                placeholder="Filtrar Inquilino"
             />
          </div>

           {/* Select Dia Vencimento */}
           <div className="md:col-span-2">
            <Select
              value={filters.dia_vencimento}
              onChange={(e) => setFilters(f => ({ ...f, dia_vencimento: e.target.value }))}
            >
              <option value="">Dia Venc.</option>
              {uniqueDias.map(d => (
                <option key={d} value={d}>Dia {d}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* Botão de Limpar Filtros (só aparece se houver filtro ativo) */}
        {Object.values(filters).some(Boolean) && (
          <div className="mt-3 flex justify-end">
             <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-muted-foreground hover:text-destructive gap-1 h-8"
                onClick={() => setFilters({ search: "", status_financeiro: "", dia_vencimento: "", inquilino_id: "" })}
             >
               <FilterX size={12} /> Limpar Filtros
             </Button>
          </div>
        )}
      </Card>

      {/* GRID DE RESULTADOS */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed rounded-xl bg-muted/10">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Search className="text-muted-foreground w-8 h-8" />
          </div>
          <h4 className="text-lg font-medium text-foreground">Nenhum contrato encontrado</h4>
          <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros acima.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((c) => (
           <ContratoCard key={c.id} data={c} onOpen={handleOpenDrawer} />
          ))}
        </div>
      )}

      {openDrawer && selectedContratoId && (
        <ContratoLocacaoDrawer
          contratoId={selectedContratoId}
          onClose={handleCloseDrawer}
        />
      )}
    </div>
  );
}

/* ===========================================
    COMPONENTE: CARD DO CONTRATO
============================================ */
function ContratoCard({ data, onOpen }) {
  const { imoveis, status_financeiro, inquilino, valor_acordado, data_fim, dia_vencimento_aluguel } = data;
  const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  // Cores dinâmicas
  const statusConfig = {
    atrasado: { 
      border: "hover:ring-red-500/40", 
      bgBadge: "bg-red-500/10 text-red-600 border-red-200",
      bar: "bg-red-500" 
    },
    pendente: { 
      border: "hover:ring-amber-500/40", 
      bgBadge: "bg-amber-500/10 text-amber-600 border-amber-200",
      bar: "bg-amber-500" 
    },
    regular: { 
      border: "hover:ring-emerald-500/40", 
      bgBadge: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      bar: "bg-emerald-500" 
    },
  };

  const currentStatus = statusConfig[status_financeiro] || statusConfig.pendente;

  return (
    <Card
      onClick={() => onOpen?.(data.id)}
      className={cn(
        "group relative border-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden rounded-xl cursor-pointer bg-card",
        "hover:ring-1 hover:-translate-y-1",
        currentStatus.border
      )}
    >
      {/* Barra lateral de status */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", currentStatus.bar)} />
      
      <div className="p-5 pl-6 space-y-4">
        {/* Topo */}
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1 overflow-hidden">
            <h4 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors truncate">
              {imoveis?.titulo || "Imóvel sem título"}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">
                {imoveis?.endereco_cidade}/{imoveis?.endereco_estado}
              </span>
            </div>
          </div>
          
          <Badge className={cn("capitalize shadow-none border font-medium px-2 py-0.5 text-[10px]", currentStatus.bgBadge)}>
            {status_financeiro}
          </Badge>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/40 border-dashed">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider">Inquilino</span>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <User2 size={12} />
              </div>
              <span className="truncate">{inquilino?.nome?.split(' ')[0]}</span>
            </div>
          </div>
          
          <div className="space-y-1 text-right">
            <span className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider">Valor Atual</span>
            <div className="text-base font-bold text-foreground tracking-tight">
              {moneyFormatter.format(valor_acordado)}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
          <div className="flex gap-3">
            <span className="flex items-center gap-1.5" title="Data de Vencimento do Contrato">
               <Calendar size={13} /> {new Date(data_fim).toLocaleDateString('pt-BR', { month: '2-digit', year: '2-digit' })}
            </span>
            <span className="flex items-center gap-1.5" title="Dia do vencimento do aluguel">
               <DollarSign size={13} /> Dia {dia_vencimento_aluguel}
            </span>
          </div>

          <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium text-[11px]">
            Ver Detalhes <ArrowUpRight size={12} />
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ===========================================
    LOADING SKELETON
============================================ */
function LoadingState() {
  return (
    <div className="space-y-8 p-1">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-md" />
            <Skeleton className="h-4 w-40 rounded-md" />
        </div>
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
      
      <Skeleton className="h-24 w-full rounded-xl" /> {/* Filtros */}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}