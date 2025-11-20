"use client";

import { useState, useEffect } from "react";
import Card from "@/components/admin/ui/Card";
import Toast from "@/components/admin/ui/Toast";
import { AlertTriangle, Clock, Wrench, CalendarDays } from "lucide-react";
import { Loader2 } from "lucide-react";

export default function AlertasPanel() {
  const [alertas, setAlertas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alugueis?view=alertas", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAlertas(json.data);
    } catch (err) {
      Toast.error("Erro ao carregar alertas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" /> Carregando alertas...
      </div>
    );

  if (!alertas)
    return (
      <p className="text-center text-muted-foreground">
        Não foi possível carregar os alertas.
      </p>
    );

  return (
    <div className="space-y-6">
      {/* =========================================
          🔶 1. Contratos vencendo
      ========================================== */}
      <Section
        title="Contratos vencendo (próximos 90 dias)"
        icon={<Clock size={18} />}
        emptyText="Nenhum contrato com vencimento próximo."
      >
        {alertas.contratos_vencendo.map((c) => (
          <AlertaCard
            key={c.id}
            title={c.imoveis?.titulo || "Imóvel sem título"}
            subtitle={`Vencimento: ${c.data_fim}`}
            tag="Contrato"
            tagColor="bg-amber-600"
          />
        ))}
      </Section>

      {/* =========================================
          🔷 2. Reajustes próximos (aniversário)
      ========================================== */}
      <Section
        title="Reajustes previstos"
        icon={<AlertTriangle size={18} />}
        emptyText="Nenhum reajuste próximo."
      >
        {alertas.reajustes_proximos.map((c) => (
          <AlertaCard
            key={c.id}
            title={c.imoveis?.titulo || "Imóvel sem título"}
            subtitle={`Índice: ${c.indice_reajuste || "IGP-M"}`}
            tag="Reajuste"
            tagColor="bg-blue-600"
          />
        ))}
      </Section>

      {/* =========================================
          🛠 3. Ordens de Serviço pendentes
      ========================================== */}
      <Section
        title="Ordens de Serviço pendentes"
        icon={<Wrench size={18} />}
        emptyText="Não há OS pendentes."
      >
        {alertas.os_pendentes.map((o) => (
          <AlertaCard
            key={o.id}
            title={o.imoveis?.titulo || "Imóvel sem título"}
            subtitle={`Status: ${o.status}`}
            tag="OS"
            tagColor="bg-rose-600"
          />
        ))}
      </Section>

      {/* =========================================
          📅 4. Vistorias programadas
      ========================================== */}
      <Section
        title="Vistorias programadas"
        icon={<CalendarDays size={18} />}
        emptyText="Nenhuma vistoria programada."
      >
        {alertas.vistorias_programadas.map((v) => (
          <AlertaCard
            key={v.id}
            title={v.imoveis?.titulo || "Imóvel sem título"}
            subtitle={`Data: ${v.data_vistoria}`}
            tag={v.tipo || "Vistoria"}
            tagColor="bg-emerald-600"
          />
        ))}
      </Section>
    </div>
  );
}

/* ===========================================================
   🔹 COMPONENTE: Section (wrapper reutilizável)
=========================================================== */
function Section({ title, icon, children, emptyText }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
        {icon} {title}
      </h3>

      {Array.isArray(children) && children.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">{children}</div>
      ) : (
        <p className="text-muted-foreground text-sm">{emptyText}</p>
      )}
    </div>
  );
}

/* ===========================================================
   🔹 COMPONENTE: AlertaCard (visual padrão)
=========================================================== */
function AlertaCard({ title, subtitle, tag, tagColor = "bg-muted" }) {
  return (
    <Card className="p-4 space-y-2 hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-foreground">{title}</h4>
        <span
          className={`px-2 py-0.5 rounded-full text-xs text-white ${tagColor}`}
        >
          {tag}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </Card>
  );
}
