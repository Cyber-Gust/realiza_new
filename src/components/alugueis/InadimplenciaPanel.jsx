"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Wallet, 
  RefreshCcw, 
  AlertCircle, 
  ArrowRight, 
  TrendingDown,
  User,
  Building2,
  Search,
  FilterX,
  CalendarX
} from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Select } from "@/components/admin/ui/Form";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
} from "@/components/admin/ui/Table";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

export default function InadimplenciaPanel() {
  const { error: toastError } = useToast();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado dos filtros (Padrão CRM)
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    orderBy: "vencimento_desc" // ordenação padrão
  });

  /* ===========================================
      LOAD DATA
  ============================================ */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alugueis?view=inadimplencia", { cache: "no-store" });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || "Erro desconhecido");
      
      setData(json.data || []);
    } catch (err) {
      toastError("Erro ao carregar inadimplência: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { load(); }, [load]);

  /* ===========================================
      CÁLCULOS & FILTROS
  ============================================ */
  const stats = useMemo(() => {
    const total = data.reduce((acc, curr) => acc + Number(curr.valor), 0);
    const atrasados = data.filter(d => d.status === 'atrasado').length;
    const pendentes = data.filter(d => d.status === 'pendente').length;
    return { total, atrasados, pendentes };
  }, [data]);

  const filtered = useMemo(() => {
    let result = data.filter((item) => {
      // Filtro de Texto
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const match = 
          item.contratos?.imoveis?.titulo?.toLowerCase().includes(s) ||
          item.contratos?.inquilino?.nome?.toLowerCase().includes(s);
        if (!match) return false;
      }

      // Filtro de Status
      if (filters.status && item.status !== filters.status) {
        return false;
      }

      return true;
    });

    // Ordenação
    result.sort((a, b) => {
      if (filters.orderBy === "valor_desc") return b.valor - a.valor;
      if (filters.orderBy === "valor_asc") return a.valor - b.valor;
      if (filters.orderBy === "vencimento_asc") return new Date(a.data_vencimento) - new Date(b.data_vencimento);
      if (filters.orderBy === "vencimento_desc") return new Date(b.data_vencimento) - new Date(a.data_vencimento);
      return 0;
    });

    return result;
  }, [data, filters]);

  /* ===========================================
      UI
  ============================================ */
  if (loading) return <LoadingState />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Wallet size={22} />
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Gestão de Inadimplência</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Visualize e recupere <strong>{filtered.length} cobranças</strong> em aberto.
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={load} 
          className="gap-2 shadow-sm"
        >
          <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
          Atualizar Cobranças
        </Button>
      </div>
      
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard 
          title="Total em Aberto" 
          value={stats.total} 
          isCurrency 
          icon={TrendingDown}
          colorClass="text-red-600 bg-red-50 border-red-100"
        />
        <KPICard 
          title="Faturas Atrasadas" 
          value={stats.atrasados} 
          icon={AlertCircle}
          colorClass="text-amber-600 bg-amber-50 border-amber-100"
        />
        <KPICard 
          title="A Vencer (Pendente)" 
          value={stats.pendentes} 
          icon={CalendarX}
          colorClass="text-blue-600 bg-blue-50 border-blue-100"
        />
      </div>

      {/* ÁREA DE FILTROS (Estilo CRM) */}
      <Card className="p-5 bg-panel-card rounded-xl border-border shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Busca Texto */}
          <div className="md:col-span-5 flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-background/50 focus-within:ring-1 focus-within:ring-primary transition-all">
            <Search size={16} className="text-muted-foreground" />
            <input
              placeholder="Buscar por imóvel ou inquilino..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              className="bg-transparent outline-none text-sm w-full placeholder:text-muted-foreground/70"
            />
          </div>

          {/* Select Status */}
          <div className="md:col-span-3">
            <Select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full"
            >
              <option value="">Status: Todos</option>
              <option value="atrasado">Atrasado</option>
              <option value="pendente">Pendente</option>
            </Select>
          </div>

           {/* Select Ordenação */}
           <div className="md:col-span-3">
            <Select
              value={filters.orderBy}
              onChange={(e) => setFilters(f => ({ ...f, orderBy: e.target.value }))}
              className="w-full"
            >
              <option value="vencimento_desc">Vencimento (Recente)</option>
              <option value="vencimento_asc">Vencimento (Antigo)</option>
              <option value="valor_desc">Valor (Maior)</option>
              <option value="valor_asc">Valor (Menor)</option>
            </Select>
          </div>

          {/* Botão Reset */}
          <div className="md:col-span-1 flex justify-end md:justify-start">
             <Button 
                variant="ghost" 
                size="icon" 
                title="Limpar Filtros"
                onClick={() => setFilters({ search: "", status: "", orderBy: "vencimento_desc" })}
                className="text-muted-foreground hover:text-foreground"
             >
               <FilterX size={18} />
             </Button>
          </div>
        </div>
      </Card>

      {/* LISTAGEM (TABELA) */}
      <Card className="border-border shadow-sm bg-card overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="font-semibold text-muted-foreground py-4 pl-6">Imóvel / Inquilino</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-center">Status</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Vencimento</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right pr-6">Valor Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <div className="p-3 bg-muted rounded-full mb-3">
                        <Search size={24} />
                      </div>
                      <span className="font-medium">Nenhuma pendência encontrada</span>
                      <span className="text-xs opacity-70 mt-1">Tente ajustar os filtros acima</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-colors group border-border cursor-pointer">
                    <TableCell className="py-4 pl-6">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm text-foreground flex items-center gap-2">
                          <Building2 size={14} className="text-primary/70" />
                          {item.contratos?.imoveis?.titulo || "Imóvel desconhecido"}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                          <User size={12} />
                          {item.contratos?.inquilino?.nome || "Inquilino não identificado"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge className={cn("shadow-none border font-bold text-[10px] uppercase px-2 py-0.5", colorMap[item.status])}>
                        {item.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-sm font-medium text-muted-foreground">
                      {new Date(item.data_vencimento).toLocaleDateString('pt-BR')}
                    </TableCell>

                    <TableCell className="text-right pr-6">
                      <span className={cn(
                        "font-bold text-sm",
                        item.status === 'atrasado' ? "text-red-600" : "text-foreground"
                      )}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

/* ===========================================
    SUB-COMPONENTES
============================================ */

function KPICard({ title, value, isCurrency, icon: Icon, colorClass }) {
  return (
    <Card className="p-5 border flex items-center justify-between shadow-sm rounded-xl hover:shadow-md transition-shadow">
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl font-black text-foreground tracking-tight">
          {isCurrency
            ? new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(value)
            : value}
        </h3>
      </div>

      <div className={cn("p-3 rounded-xl border bg-opacity-50", colorClass)}>
        {Icon && <Icon size={22} />}
      </div>
    </Card>
  );
}

const colorMap = {
  atrasado: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  pendente: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
};

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end pb-2">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-md" />
            <Skeleton className="h-4 w-40 rounded-md" />
          </div>
          <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
      
      <Skeleton className="h-24 w-full rounded-xl" /> {/* Filtros */}
      <Skeleton className="h-[400px] w-full rounded-xl" /> {/* Tabela */}
    </div>
  );
}