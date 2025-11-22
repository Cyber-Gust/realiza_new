"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

import {
  AlertTriangle,
  Clock,
  Wrench,
  CalendarDays,
} from "lucide-react";

export default function AlertasPanel() {
  const [alertas, setAlertas] = useState(null);
  const [loading, setLoading] = useState(true);

  const { error: toastError } = useToast();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alugueis?view=alertas", {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setAlertas(json.data);
    } catch (err) {
      toastError("Erro ao carregar alertas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState />;

  if (!alertas)
    return (
      <p className="text-center text-muted-foreground">
        Não foi possível carregar os alertas.
      </p>
    );

  return (
    <div className="space-y-8 animate-in fade-in-10 duration-200">
      <Section
        title="Contratos vencendo (próximos 90 dias)"
        icon={Clock}
        emptyText="Nenhum contrato com vencimento próximo."
        data={alertas.contratos_vencendo}
        render={(c) => (
          <AlertaCard
            key={c.id}
            title={c.imoveis?.titulo || "Imóvel sem título"}
            subtitle={`Vencimento: ${c.data_fim}`}
            tag="Contrato"
            tagColor="amber"
          />
        )}
      />

      <Section
        title="Reajustes previstos"
        icon={AlertTriangle}
        emptyText="Nenhum reajuste próximo."
        data={alertas.reajustes_proximos}
        render={(c) => (
          <AlertaCard
            key={c.id}
            title={c.imoveis?.titulo || "Imóvel sem título"}
            subtitle={`Índice: ${c.indice_reajuste || "IGP-M"}`}
            tag="Reajuste"
            tagColor="blue"
          />
        )}
      />

      <Section
        title="Ordens de Serviço pendentes"
        icon={Wrench}
        emptyText="Não há OS pendentes."
        data={alertas.os_pendentes}
        render={(o) => (
          <AlertaCard
            key={o.id}
            title={o.imoveis?.titulo || "Imóvel sem título"}
            subtitle={`Status: ${o.status}`}
            tag="OS"
            tagColor="rose"
          />
        )}
      />

      <Section
        title="Vistorias programadas"
        icon={CalendarDays}
        emptyText="Nenhuma vistoria programada."
        data={alertas.vistorias_programadas}
        render={(v) => (
          <AlertaCard
            key={v.id}
            title={v.imoveis?.titulo || "Imóvel sem título"}
            subtitle={`Data: ${v.data_vistoria}`}
            tag={v.tipo || "Vistoria"}
            tagColor="emerald"
          />
        )}
      />
    </div>
  );
}

/* ===========================================================
   🔹 LOADING STATE
=========================================================== */
function LoadingState() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 py-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-lg" />
      ))}
    </div>
  );
}

/* ===========================================================
   🔹 SECTION
=========================================================== */
function Section({ title, icon: Icon, emptyText, data, render }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={18} className="text-muted-foreground" />
        <h3 className="text-md font-semibold tracking-tight">{title}</h3>
      </div>

      {hasData ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map(render)}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

/* ===========================================================
   🔹 ALERTA CARD
=========================================================== */
function AlertaCard({ title, subtitle, tag, tagColor }) {
  return (
    <Card
      className={cn(
        "p-4 space-y-2 border border-border rounded-lg shadow-sm",
        "hover:shadow-md transition-all duration-150 hover:-translate-y-[1px]",
        "bg-card"
      )}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-medium leading-tight">{title}</h4>

        <Badge
          className={cn(
            "text-xs capitalize px-2 py-0.5",
            colorMap[tagColor] ?? "bg-muted text-muted-foreground"
          )}
        >
          {tag}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </Card>
  );
}

/* ===========================================================
   🔹 COLOR MAP — para o Badge
=========================================================== */
const colorMap = {
  amber: "bg-amber-600 text-white",
  blue: "bg-blue-600 text-white",
  rose: "bg-rose-600 text-white",
  emerald: "bg-emerald-600 text-white",
};
