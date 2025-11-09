"use client";
import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { CalendarDays, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import Toast from "@/components/admin/ui/Toast";
import CRMAgendaForm from "./CRMAgendaForm";

export default function CRMCalendario() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

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
        backgroundColor: getColor(ev.tipo),
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

  const getColor = (tipo) => {
    const map = {
      visita_presencial: "#059669",
      visita_virtual: "#0284c7",
      reuniao: "#2563eb",
      follow_up: "#d97706",
      tecnico: "#ea580c",
      administrativo: "#4b5563",
      outro: "#9333ea",
    };
    return map[tipo?.toLowerCase()] || "#6b7280";
  };

  return (
    <Card className="p-4 border border-border bg-panel-card shadow-sm">
      {/* Header */}

      {/* Corpo */}
      {loading ? (
        <div className="flex justify-center items-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando calendário...
        </div>
      ) : (
        <div className="rounded-md overflow-hidden border border-border">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={ptBrLocale}
            height="auto"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            buttonText={{
              today: "Hoje",
              month: "Mês",
              week: "Semana",
              day: "Dia",
            }}
            events={eventos}
            dateClick={(info) => {
              setSelectedDate(info.dateStr);
              setOpenForm(true);
            }}
            eventClick={(info) => {
              const ev = info.event.extendedProps;
              Toast.info(
                `${info.event.title}\n📍 ${ev.local || "Sem local"}\n🕓 ${new Date(
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
                }}
              >
                {arg.event.title}
              </div>
            )}
            dayMaxEventRows={2}
            themeSystem="standard"
          />
        </div>
      )}

      {/* Modal de criação/edição */}
      <Modal
        open={openForm}
        onOpenChange={setOpenForm}
        title="Novo Evento"
      >
        <CRMAgendaForm
          evento={selectedDate ? { data_inicio: selectedDate } : null}
          onClose={() => setOpenForm(false)}
          onSaved={loadEventos}
        />
      </Modal>
    </Card>
  );
}
