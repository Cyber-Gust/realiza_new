"use client";
import { useAgenda } from "@/hooks/useAgenda";
import Card from "@/components/admin/ui/Card";
import { CalendarDays } from "lucide-react";

export default function AgendaCalendar() {
  const { eventos, loading } = useAgenda();

  return (
    <Card title="Agenda de Visitas e Reuniões" className="space-y-4">
      {loading ? (
        <p className="text-center text-muted-foreground py-6">Carregando...</p>
      ) : eventos.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">Nenhum evento agendado.</p>
      ) : (
        <ul className="divide-y divide-border">
          {eventos.map((e) => (
            <li key={e.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <CalendarDays size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{e.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.data_inicio).toLocaleString("pt-BR")} → {new Date(e.data_fim).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{e.tipo}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
