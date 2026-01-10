"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar,
  Wallet,
  Building2,
  User,
  Loader2
} from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
import { Select } from "@/components/admin/ui/Form"; // Assumindo que você tem um Select base, ou use nativo
import Badge from "@/components/admin/ui/Badge";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

export default function TimelinePanel() {
  const { error: toastError } = useToast();
  
  // Estados
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [contratos, setContratos] = useState([]);
  const [selectedContratoId, setSelectedContratoId] = useState("");
  const [timelineData, setTimelineData] = useState([]);

  // 1. Carregar lista de contratos para o Dropdown (usa a view 'carteira' que já retorna o resumo)
  useEffect(() => {
    async function fetchContratos() {
      try {
        const res = await fetch("/api/alugueis?view=carteira", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setContratos(json.data || []);
      } catch (err) {
        toastError("Erro ao carregar lista de contratos");
      } finally {
        setLoadingContracts(false);
      }
    }
    fetchContratos();
  }, [toastError]);

  // 2. Carregar Timeline quando um contrato é selecionado
  const loadTimeline = useCallback(async (id) => {
    if (!id) return;
    try {
      setLoadingTimeline(true);
      const res = await fetch(`/api/alugueis?view=timeline&contrato_id=${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setTimelineData(json.data || []);
    } catch (err) {
      toastError(err.message);
    } finally {
      setLoadingTimeline(false);
    }
  }, [toastError]);

  // Trigger automático ao mudar o select
  useEffect(() => {
    if (selectedContratoId) {
      loadTimeline(selectedContratoId);
    } else {
      setTimelineData([]);
    }
  }, [selectedContratoId, loadTimeline]);

  // Totais para o Header do Extrato
  const stats = useMemo(() => {
    return timelineData.reduce((acc, curr) => {
      const val = Number(curr.valor);
      if (curr.status === 'pago') acc.pago += val;
      if (curr.status === 'pendente') acc.pendente += val;
      if (curr.status === 'atrasado') acc.atrasado += val;
      return acc;
    }, { pago: 0, pendente: 0, atrasado: 0 });
  }, [timelineData]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* HEADER & SELEÇÃO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary ring-1 ring-primary/20">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">Extrato Financeiro</h3>
            <p className="text-sm text-muted-foreground">Histórico completo de pagamentos e cobranças.</p>
          </div>
        </div>

        <div className="w-full md:w-72">
          {loadingContracts ? (
            <Skeleton className="h-10 w-full rounded-md" />
          ) : (
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Select
                value={selectedContratoId}
                onChange={(e) => setSelectedContratoId(e.target.value)}
              >
                <option value="">Selecione um contrato...</option>
                {contratos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.imoveis?.titulo} — {c.inquilino?.nome}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="min-h-[400px]">
        {!selectedContratoId ? (
          // EMPTY STATE (Nenhum contrato selecionado)
          <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-xl bg-muted/10">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Search className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h4 className="text-lg font-medium text-foreground">Selecione um contrato</h4>
            <p className="text-sm text-muted-foreground max-w-xs mt-1">
              Escolha um imóvel na lista acima para visualizar todo o histórico de transações.
            </p>
          </div>
        ) : loadingTimeline ? (
          // LOADING STATE
          <TimelineSkeleton />
        ) : timelineData.length === 0 ? (
          // EMPTY STATE (Sem dados no contrato)
          <div className="text-center py-16 bg-muted/20 rounded-xl border border-border">
            <Wallet className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">Nenhum lançamento financeiro registrado.</p>
          </div>
        ) : (
          // TIMELINE RENDER
          <div className="space-y-6">
            
            {/* Resumo Rápido */}
            <div className="grid grid-cols-3 gap-4 mb-8">
               <StatsBadge label="Total Pago" value={stats.pago} color="text-emerald-600 bg-emerald-50 border-emerald-100" />
               <StatsBadge label="Em Aberto" value={stats.pendente} color="text-blue-600 bg-blue-50 border-blue-100" />
               <StatsBadge label="Em Atraso" value={stats.atrasado} color="text-red-600 bg-red-50 border-red-100" />
            </div>

            <div className="relative space-y-0">
              {/* Linha vertical conectora */}
              <div className="absolute left-[27px] top-4 bottom-4 w-px bg-border z-0" />
              
              {timelineData.map((t, index) => (
                <TimelineItem key={t.id} transaction={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   SUB-COMPONENTES (Para manter o código limpo)
   ========================================================================= */

function TimelineItem({ transaction: t }) {
  const isReceita = t.tipo?.includes('receita') || t.tipo === 'entrada';
  
  const statusConfig = {
    pago: { 
      icon: CheckCircle2, 
      color: "text-emerald-500", 
      dot: "bg-emerald-500 ring-emerald-100",
      bg: "bg-emerald-50/50 hover:bg-emerald-50",
      border: "border-emerald-100"
    },
    atrasado: { 
      icon: AlertCircle, 
      color: "text-red-500", 
      dot: "bg-red-500 ring-red-100",
      bg: "bg-red-50/50 hover:bg-red-50",
      border: "border-red-100"
    },
    pendente: { 
      icon: Clock, 
      color: "text-amber-500", 
      dot: "bg-amber-400 ring-amber-100",
      bg: "bg-card hover:bg-muted/30",
      border: "border-border"
    },
  };

  const config = statusConfig[t.status] || statusConfig.pendente;
  const Icon = config.icon;

  return (
    <div className="relative pl-16 py-2 group">
      {/* Bolinha da Timeline */}
      <div className={cn(
        "absolute left-[22px] top-6 w-3 h-3 rounded-full ring-4 z-10 transition-all duration-300 group-hover:scale-110",
        config.dot
      )} />

      <Card className={cn(
        "p-4 flex flex-col sm:flex-row gap-4 items-start justify-between shadow-sm transition-all duration-200 border",
        config.bg,
        config.border
      )}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isReceita ? (
              <ArrowUpCircle className="text-emerald-500 w-5 h-5" />
            ) : (
              <ArrowDownCircle className="text-rose-500 w-5 h-5" />
            )}
            <span className="font-bold text-sm text-foreground">{t.descricao}</span>
            <Badge className={cn("text-[10px] font-bold uppercase shadow-none border-none px-2 py-0.5 ml-2", 
               t.status === 'pago' ? "bg-emerald-100 text-emerald-700" :
               t.status === 'atrasado' ? "bg-red-100 text-red-700" :
               "bg-amber-100 text-amber-700"
            )}>
              {t.status}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
             <div className="flex items-center gap-1.5">
               <Calendar size={13} />
               Vencimento: <span className="font-medium text-foreground">{new Date(t.data_vencimento).toLocaleDateString('pt-BR')}</span>
             </div>
             {t.data_pagamento && (
               <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                 <CheckCircle2 size={13} />
                 Pago em: {new Date(t.data_pagamento).toLocaleDateString('pt-BR')}
               </div>
             )}
          </div>
        </div>

        <div className="text-right min-w-[100px]">
           <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-0.5">Valor</p>
           <p className={cn("text-lg font-black tracking-tight", isReceita ? "text-foreground" : "text-rose-600")}>
             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.valor)}
           </p>
        </div>
      </Card>
    </div>
  );
}

function StatsBadge({ label, value, color }) {
  return (
    <div className={cn("p-3 rounded-lg border text-center", color)}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-sm font-black mt-0.5">
        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact" }).format(value)}
      </p>
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-6 pt-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-4 pl-4 relative">
          <Skeleton className="h-4 w-4 rounded-full absolute left-[20px] top-6" />
          <Skeleton className="h-24 w-full rounded-xl ml-12" />
        </div>
      ))}
    </div>
  );
}