"use client";

import { useAgenda } from "@/hooks/useAgenda";
import Card from "@/components/admin/ui/Card";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const badgeColors = {
  visita: "bg-emerald-500/15 text-emerald-500",
  reunião: "bg-blue-500/15 text-blue-500",
  "follow-up": "bg-amber-500/15 text-amber-600",
  outro: "bg-accent/15 text-accent-foreground",
};

export default function AgendaCalendar() {
  const { eventos, loading } = useAgenda();

  // Agrupa eventos por data
  const grouped = eventos?.reduce((acc, e) => {
    const data = new Date(e.data_inicio).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "short",
    });
    if (!acc[data]) acc[data] = [];
    acc[data].push(e);
    return acc;
  }, {});

  return (
    <Card title="Agenda de Visitas e Reuniões" className="space-y-6 overflow-hidden">
      {loading ? (
        <p className="text-center text-muted-foreground py-8 animate-pulse">Carregando...</p>
      ) : !eventos?.length ? (
        <p className="text-center text-muted-foreground py-8">Nenhum evento agendado.</p>
      ) : (
        <div className="relative space-y-6">
          {/* Linha vertical estilo timeline */}
          <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-border rounded-full" />

          <div className="space-y-6 pl-8">
            <AnimatePresence>
              {Object.entries(grouped).map(([data, lista]) => (
                <motion.div
                  key={data}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  {/* Cabeçalho da data */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <h3 className="text-sm font-semibold capitalize text-foreground">
                      {data.replace("-feira", "")}
                    </h3>
                    <div className="flex-grow border-t border-border/60" />
                  </div>

                  {/* Lista de eventos */}
                  <ul className="space-y-3">
                    {lista.map((e) => (
                      <motion.li
                        key={e.id}
                        whileHover={{ scale: 1.01 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="
                          relative p-4 border border-border bg-panel-card rounded-xl
                          hover:shadow-md transition-all duration-200
                        "
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">{e.titulo}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock size={12} className="opacity-70" />
                              <span>
                                {new Date(e.data_inicio).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                →{" "}
                                {new Date(e.data_fim).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            {e.local && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin size={12} className="opacity-70" />
                                <span>{e.local}</span>
                              </div>
                            )}
                            {e.participantes && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Users size={12} className="opacity-70" />
                                <span>{e.participantes.join(", ")}</span>
                              </div>
                            )}
                          </div>

                          <span
                            className={`
                              text-[11px] font-semibold px-2 py-1 rounded-md capitalize
                              ${badgeColors[e.tipo] || "bg-accent/15 text-accent-foreground"}
                            `}
                          >
                            {e.tipo}
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </Card>
  );
}
