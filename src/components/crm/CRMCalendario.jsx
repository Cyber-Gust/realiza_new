"use client";
import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { CalendarDays, Loader2, Plus } from "lucide-react";

import Card from "@/components/admin/ui/Card";
import { Button } from "@/components/ui/button";
import Modal from "@/components/admin/ui/Modal";
import Toast from "@/components/admin/ui/Toast";
import CRMAgendaForm from "./CRMAgendaForm";

/* ======================================
   🔹 Mapa de cores Big-Tech
   ====================================== */
const EVENT_COLORS = {
  visita_presencial: "#059669",
  visita_virtual: "#0284c7",
  reuniao: "#2563eb",
  follow_up: "#d97706",
  tecnico: "#ea580c",
  administrativo: "#4b5563",
  outro: "#9333ea",
};

export default function CRMCalendario() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  /* ======================================
     🔹 Carrega eventos
     ====================================== */
  const loadEventos = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/crm/agenda", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      // Formatação FullCalendar
      const formatted = (json.data || []).map((ev) => ({
        id: ev.id,
        title: ev.titulo,
        start: ev.data_inicio,
        end: ev.data_fim,
        backgroundColor: EVENT_COLORS[ev.tipo] || "#6b7280",
        borderColor: "transparent",
        textColor: "#fff",
        extendedProps: ev,
      }));

      setEventos(formatted);
    } catch (err) {
      Toast.error("Erro ao carregar calendário: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventos();
  }, []);

  /* ======================================
     🔹 Render
     ====================================== */
  return (
    <Card className="p-0 border border-border bg-panel-card shadow-sm overflow-hidden">

      {/* HEADER PREMIUM */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-panel-card/70">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <CalendarDays size={18} /> Calendário de Eventos
        </h3>

        <Button
          className="flex items-center gap-2"
          onClick={() => {
            setSelectedDate(null);
            setOpenForm(true);
          }}
        >
          <Plus size={16} /> Novo Evento
        </Button>
      </div>

      {/* CORPO */}
      {loading ? (
        <div className="flex justify-center items-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando calendário...
        </div>
      ) : (
        <div className="rounded-none">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={ptBrLocale}
            height="auto"
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
              Toast.info(
                `${ev.titulo}\n📍 ${ev.local || "Sem local"}\n🕓 ${new Date(
                  ev.data_inicio
                ).toLocaleString("pt-BR")}`
              );
            }}
            eventContent={(arg) => (
              <div
                className="px-1 py-[2px] rounded text-xs font-medium"
                style={{
                  background: arg.event.backgroundColor,
                  color: "#fff",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  borderRadius: "4px",
                  padding: "2px 4px",
                }}
              >
                {arg.event.title}
              </div>
            )}
            dayMaxEventRows={3}
            themeSystem="standard"
          />
        </div>
      )}

      {/* MODAL FORM */}
      <Modal
        open={openForm}
        onOpenChange={setOpenForm}
        title={selectedDate ? "Novo Evento" : "Criar Evento"}
      >
        <CRMAgendaForm
          evento={selectedDate ? { data_inicio: selectedDate } : null}
          onClose={() => setOpenForm(false)}
          onSaved={() => {
            setOpenForm(false);
            loadEventos();
          }}
        />
      </Modal>
    </Card>
  );
}
