"use client";

import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { CalendarDays, Loader2 } from "lucide-react";

import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import CRMAgendaForm from "./CRMAgendaForm";

/* ============================================================
   🔥 Paleta premium Big-Tech
   ============================================================ */
const EVENT_COLORS = {
  visita_presencial: "#059669",
  visita_virtual: "#0284c7",
  reuniao: "#2563eb",
  follow_up: "#d97706",
  tecnico: "#ea580c",
  administrativo: "#4b5563",
  outro: "#9333ea",
  default: "#6b7280",
};

export default function CRMCalendario() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const [openForm, setOpenForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  /* ============================================================
     🔥 Load eventos
     ============================================================ */
  const loadEventos = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/crm/agenda", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      const formatted = (json.data || []).map((ev) => ({
        id: ev.id,
        title: ev.titulo,
        start: ev.data_inicio,
        end: ev.data_fim,
        backgroundColor: EVENT_COLORS[ev.tipo] || EVENT_COLORS.default,
        borderColor: "transparent",
        textColor: "#fff",
        extendedProps: ev,
      }));

      setEventos(formatted);
    } catch (err) {
      toast.error("Erro ao carregar calendário: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventos();
  }, []);

  /* ============================================================
     🔥 Render
     ============================================================ */
  return (
    <Card className="p-0 border border-border bg-panel-card shadow-sm overflow-hidden rounded-xl relative">

      {/* HEADER */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-panel-card/60 backdrop-blur-sm">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground tracking-tight">
          <CalendarDays size={18} /> Calendário de Eventos
        </h3>
      </div>

      {/* CALENDÁRIO */}
      {loading ? (
        <div className="flex justify-center items-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando calendário...
        </div>
      ) : (
        <div className="rounded-none p-1">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={ptBrLocale}
            height="auto"
            initialView="dayGridMonth"
            events={eventos}
            buttonText={{
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia",
            }}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            dateClick={(info) => {
              setSelectedDate(info.dateStr);
              setOpenForm(true);
            }}
            eventClick={(info) => {
              const ev = info.event.extendedProps;
              toast.info(
                `${ev.titulo}\n📍 ${ev.local || "Sem local"}\n🕓 ${new Date(
                  ev.data_inicio
                ).toLocaleString("pt-BR")}`
              );
            }}
            eventContent={(arg) => (
              <div
                className="text-xs font-semibold px-2 py-[3px] rounded-md tracking-tight glow-event"
                style={{
                  background: arg.event.backgroundColor,
                  color: "#fff",
                }}
              >
                {arg.event.title}
              </div>
            )}
            dayMaxEventRows={3}
          />
        </div>
      )}

      {/* MODAL FORM */}
      <Modal
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          setSelectedDate(null);
        }}
        title={selectedDate ? "Novo Evento" : "Criar Evento"}
      >
        <CRMAgendaForm
          evento={
            selectedDate
              ? { data_inicio: selectedDate, data_fim: selectedDate }
              : null
          }
          onClose={() => {
            setOpenForm(false);
            setSelectedDate(null);
          }}
          onSaved={() => {
            setOpenForm(false);
            setSelectedDate(null);
            loadEventos();
          }}
        />
      </Modal>

      {/* ============================================================
          🔥 CSS PREMIUM INSIDE COMPONENT (styled-jsx)
          ============================================================ */}
      <style jsx global>{`
        .fc {
          --fc-border-color: rgba(255, 255, 255, 0.06);
          --fc-page-bg-color: transparent;
          font-family: var(--font-sans);
        }

        .fc-toolbar {
          padding: 10px 14px;
        }

        .fc-toolbar-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: hsl(var(--foreground));
          letter-spacing: -0.2px;
        }

        .fc-button {
          background: hsl(var(--accent));
          border: none !important;
          border-radius: 8px !important;
          color: hsl(var(--accent-foreground));
          padding: 6px 12px;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .fc-button:hover {
          background: hsl(var(--accent) / 0.85);
        }

        .fc-button-group .fc-button:not(.fc-today-button) {
          background: hsl(var(--secondary));
          color: hsl(var(--secondary-foreground));
        }

        .fc-button-group .fc-button:not(.fc-today-button):hover {
          background: hsl(var(--secondary) / 0.8);
        }

        .fc-col-header-cell {
          padding: 10px 0;
          font-size: 0.8rem;
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
        }

        .fc-daygrid-day {
          transition: background 0.15s;
          cursor: pointer;
        }

        .fc-daygrid-day:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .fc-day-other {
          opacity: 0.35 !important;
        }

        .fc-day-today {
          background: hsl(var(--primary) / 0.1) !important;
          border: 1px solid hsl(var(--primary)) !important;
          border-radius: 10px;
        }

        .fc-daygrid-event {
          border: 0 !important;
          border-radius: 8px !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
        }

        .glow-event {
          border-radius: 8px !important;
        }
      `}</style>
    </Card>
  );
}
