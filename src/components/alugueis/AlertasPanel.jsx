"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  BellRing, 
  RefreshCcw, 
  Clock, 
  TrendingUp, 
  Wrench, 
  CalendarCheck,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Button } from "@/components/admin/ui/Button";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

const INITIAL_STATE = {
  contratos_vencendo: [],
  reajustes_proximos: [],
  os_pendentes: [],
  vistorias_programadas: [],
};

export default function AlertasPanel() {
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState(INITIAL_STATE);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alugueis?view=alertas", { cache: "no-store" });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || "Erro ao carregar alertas");
      
      setAlertas(json.data || INITIAL_STATE);
    } catch (err) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState />;

  // Calculando total de alertas para exibir no header
  const totalAlertas = 
    alertas.contratos_vencendo.length + 
    alertas.reajustes_proximos.length + 
    alertas.os_pendentes.length + 
    alertas.vistorias_programadas.length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border/50 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <BellRing size={22} />
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Central de Alertas</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Você tem <strong>{totalAlertas} itens</strong> requerendo atenção nos próximos dias.
          </p>
        </div>

        <Button 
          variant="outline" 
          onClick={load} 
          className="gap-2 shadow-sm"
        >
          <RefreshCcw size={16} className={cn(loading && "animate-spin")} />
          Atualizar Painel
        </Button>
      </div>

      {/* GRID DE ALERTA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Vencimentos (Crítico) */}
        <AlertSection
          title="Contratos a Vencer"
          description="Expiram nos próximos 90 dias"
          icon={Clock}
          items={alertas.contratos_vencendo}
          variant="danger"
          renderItem={(item) => (
            <AlertItem
              key={item.id}
              variant="danger"
              title={item.imoveis?.titulo}
              badgeLabel="Vencimento"
              meta={`Vence em: ${new Date(item.data_fim).toLocaleDateString('pt-BR')}`}
            />
          )}
        />

        {/* 2. Reajustes (Financeiro) */}
        <AlertSection
          title="Próximos Reajustes"
          description="Correção de valores anual"
          icon={TrendingUp}
          items={alertas.reajustes_proximos}
          variant="info"
          renderItem={(item) => (
            <AlertItem
              key={item.id}
              variant="info"
              title={item.imoveis?.titulo}
              badgeLabel={item.indice_reajuste || "IGP-M"}
              meta="Aguardando aplicação de índice"
            />
          )}
        />

        {/* 3. Manutenção (Operacional) */}
        <AlertSection
          title="Ordens de Serviço"
          description="Pendências de manutenção"
          icon={Wrench}
          items={alertas.os_pendentes}
          variant="warning"
          renderItem={(item) => (
            <AlertItem
              key={item.id}
              variant="warning"
              title={item.imoveis?.titulo}
              badgeLabel={item.status.replace('_', ' ')}
              meta={`Solicitado por: ${item.solicitante || "Inquilino"}`}
            />
          )}
        />

        {/* 4. Vistorias (Agenda) */}
        <AlertSection
          title="Vistorias Agendadas"
          description="Próximas visitas técnicas"
          icon={CalendarCheck}
          items={alertas.vistorias_programadas}
          variant="success"
          renderItem={(item) => (
            <AlertItem
              key={item.id}
              variant="success"
              title={item.imoveis?.titulo}
              badgeLabel={item.tipo}
              meta={`Data: ${new Date(item.data_vistoria).toLocaleDateString('pt-BR')} às ${item.horario || '09:00'}`}
            />
          )}
        />

      </div>
    </div>
  );
}

/* ===========================================
    SUB-COMPONENTES
============================================ */

// 1. Seção Wrapper
function AlertSection({ title, description, icon: Icon, items, variant, renderItem }) {
  const hasItems = items && items.length > 0;
  
  const colors = {
    danger: "text-red-600 bg-red-50",
    info: "text-blue-600 bg-blue-50",
    warning: "text-orange-600 bg-orange-50",
    success: "text-emerald-600 bg-emerald-50",
  };

  return (
    <Card className="flex flex-col h-full border-border shadow-sm overflow-hidden bg-card rounded-xl">
      <div className="p-5 border-b border-border/50 flex items-start gap-3 bg-muted/20">
        <div className={cn("p-2.5 rounded-lg shrink-0", colors[variant])}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-base text-foreground flex items-center gap-2">
            {title}
            {hasItems && (
              <span className="bg-foreground/5 text-foreground/70 text-[10px] px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1 bg-panel-card/50">
        {hasItems ? (
          items.map(renderItem)
        ) : (
          <div className="h-full min-h-[120px] flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-xl bg-muted/10 p-4 text-center">
             <CheckCircle2 className="w-8 h-8 text-muted-foreground/30 mb-2" />
             <p className="text-sm font-medium text-muted-foreground/60">Tudo limpo por aqui</p>
          </div>
        )}
      </div>
    </Card>
  );
}

// 2. Card do Item Individual
function AlertItem({ title, badgeLabel, meta, variant }) {
  const variants = {
    danger: "border-l-red-500 hover:bg-red-50/50",
    info: "border-l-blue-500 hover:bg-blue-50/50",
    warning: "border-l-orange-500 hover:bg-orange-50/50",
    success: "border-l-emerald-500 hover:bg-emerald-50/50",
  };

  const badgeVariants = {
    danger: "bg-red-100 text-red-700 border-red-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
    warning: "bg-orange-100 text-orange-700 border-orange-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  return (
    <div className={cn(
      "group relative flex items-center justify-between p-3.5 bg-card border border-border rounded-xl shadow-sm transition-all duration-200 hover:shadow-md border-l-[3px]",
      variants[variant]
    )}>
      <div className="space-y-1.5 overflow-hidden">
        <div className="flex items-center gap-2">
           <Badge className={cn("px-1.5 py-0 text-[9px] font-bold uppercase shadow-none border h-5", badgeVariants[variant])}>
             {badgeLabel}
           </Badge>
           <h5 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
             {title || "Imóvel Sem Título"}
           </h5>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1 pl-0.5">
           {meta}
        </p>
      </div>

      <button className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
          <div className="space-y-2">
             <Skeleton className="h-8 w-48" />
             <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}