"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import "./calendar.css"; // Certifique-se que o arquivo CSS está na mesma pasta
import {
  CalendarDays,
  Loader2,
  Plus,
  AlertTriangle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import Modal from "@/components/admin/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import CRMAgendaForm from "./CRMAgendaForm";
import Badge from "@/components/admin/ui/Badge";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

/* Badge Inline Helper */
function BadgeInline({ status }) {
  const normalized = (status || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll(" ", "_");

  return <Badge status={normalized} />;
}

export default function CRMAgendaPanel() {
  const toast = useToast();
  const calendarRef = useRef(null);

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDateTitle, setCurrentDateTitle] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* Load Data */
  const loadEventos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/crm/agenda", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEventos(json.data || []);
    } catch (err) {
      toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadEventos();
  }, [loadEventos]);

  /* ============================================================
     🎨 Renderização do Evento (Estilo "Pill" Arredondado)
     ============================================================ */
  const renderEventContent = (eventInfo) => {
    const { title, extendedProps } = eventInfo.event;
    
    // Classes Base usando seu 'accent' (Verde) e arredondamento forte
    // Nota: Tailwind precisa reconhecer 'accent' no config, 
    // ou usamos arbitrary values baseados nas variáveis CSS que você passou.
    
    // Padrão (Seu Verde)
    let containerClass = "bg-[hsl(var(--accent))]/10 border-l-[hsl(var(--accent))] text-[hsl(var(--accent))]";
    
    // Se quiser diferenciar por tipo (Opcional - mas mantendo na paleta)
    // Ex: Visita = Verde, Reunião = Um tom mais escuro ou roxo se preferir
    if (extendedProps.tipo === "REUNIAO") {
       // Exemplo: Se quiser variar, pode usar secondary, mas o verde é sua marca forte.
       // Vamos manter o verde como padrão para consistência com seu tema.
    }

    return (
      <div className={`
        w-full overflow-hidden px-2.5 py-1.5 mb-1.5 mx-0.5
        rounded-lg border-l-[3px] shadow-sm
        hover:brightness-95 hover:translate-y-[-1px] transition-all cursor-pointer
        ${containerClass}
      `}>
        <div className="flex flex-col">
          <span className="text-xs font-bold truncate leading-snug">
            {title}
          </span>
          <div className="flex items-center gap-1 text-[10px] opacity-80 font-medium mt-0.5">
             <Clock size={10} />
             {new Date(eventInfo.event.start).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  };

  /* Ações do Calendário */
  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/agenda?id=${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao deletar");
      toast.success("Evento removido!");
      setDeleteTarget(null);
      loadEventos();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleControl = (action) => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (action === 'prev') api.prev();
    if (action === 'next') api.next();
    if (action === 'today') api.today();
    setCurrentDateTitle(api.view.title);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h3 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              {/* Ícone usando sua cor accent */}
              <CalendarDays className="text-[hsl(var(--accent))]" size={26} /> 
              Agenda
            </h3>
            <p className="text-muted-foreground text-sm">Gerencie seus compromissos e visitas.</p>
        </div>
        <Button
          onClick={() => { setEditing(null); setOpenForm(true); }}
          className="flex items-center gap-2 rounded-full px-6 shadow-md bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
        >
          <Plus size={18} /> Novo Evento
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        
        {/* CALENDÁRIO */}
        <div className="flex flex-col gap-4">
            
            {/* Toolbar Customizada Arredondada */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-panel-card p-2 rounded-2xl border border-border shadow-sm gap-3">
                
                {/* Navegação */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-background hover:text-[hsl(var(--accent))]" onClick={() => handleControl('prev')}>
                        <ChevronLeft size={18} />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 px-4 text-xs font-bold uppercase tracking-wider rounded-lg" onClick={() => handleControl('today')}>
                        Hoje
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-background hover:text-[hsl(var(--accent))]" onClick={() => handleControl('next')}>
                        <ChevronRight size={18} />
                    </Button>
                </div>

                {/* Título do Mês */}
                <h2 className="text-lg font-bold capitalize text-foreground tracking-tight">
                    {currentDateTitle || "Carregando..."}
                </h2>

                {/* Switch View */}
                <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
                     <button 
                        onClick={() => calendarRef.current?.getApi().changeView('dayGridMonth')} 
                        className="text-xs font-medium px-4 py-2 rounded-lg bg-panel-card shadow-sm border border-border/50 text-foreground transition-all hover:text-[hsl(var(--accent))]"
                     >
                        Mês
                     </button>
                     <button 
                        onClick={() => calendarRef.current?.getApi().changeView('timeGridWeek')} 
                        className="text-xs font-medium px-4 py-2 rounded-lg text-muted-foreground hover:bg-background hover:text-[hsl(var(--accent))] transition-all"
                     >
                        Semana
                     </button>
                </div>
            </div>

            {/* Container do FullCalendar - AQUI ESTÁ A MÁGICA DAS BORDAS */}
            <div className="shadow-sm rounded-2xl border border-border bg-panel-card p-5 overflow-hidden relative">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    height="auto"
                    selectable={true}
                    editable={false}
                    locale="pt-br"
                    headerToolbar={false} // Header nativo desligado
                    dayMaxEvents={3}
                    
                    /* Renderização Customizada */
                    eventContent={renderEventContent}
                    datesSet={(arg) => setCurrentDateTitle(arg.view.title)}
                    
                    /* Dados */
                    events={eventos.map((ev) => ({
                        id: ev.id,
                        title: ev.titulo,
                        start: ev.data_inicio,
                        end: ev.data_fim,
                        extendedProps: ev,
                    }))}

                    /* Interações */
                    dateClick={(info) => {
                        setEditing({ data_inicio: info.dateStr, data_fim: info.dateStr });
                        setOpenForm(true);
                    }}
                    eventClick={(info) => {
                        setEditing(info.event.extendedProps);
                        setOpenForm(true);
                    }}
                />
            </div>
        </div>

        {/* SIDEBAR (Lista Rápida) */}
        <div className="flex flex-col gap-4">
            <div className="bg-panel-card rounded-2xl border border-border p-5 h-full">
                <h4 className="font-bold text-sm text-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">
                    Próximos Compromissos
                </h4>
                
                {loading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : eventos.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
                        Nenhum evento agendado.
                    </div>
                ) : (
                    <div className="space-y-3 custom-scrollbar overflow-y-auto max-h-[600px] pr-1">
                        {eventos
                          .filter((ev) => {
                            const hoje = new Date();
                            const data = new Date(ev.data_inicio);
                            const diff = (data - hoje) / (1000 * 60 * 60 * 24);
                            return diff >= 0 && diff <= 30; // Só próximos 30 dias
                          })
                          .slice(0, 6)
                          .map((ev) => (
                            <div
                                key={ev.id}
                                onClick={() => { setEditing(ev); setOpenForm(true); }}
                                className="group p-3 rounded-xl bg-muted/30 border border-transparent hover:border-[hsl(var(--accent))/50] hover:bg-[hsl(var(--accent))/5] hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-sm text-foreground group-hover:text-[hsl(var(--accent))] transition-colors line-clamp-1">
                                        {ev.titulo}
                                    </h4>
                                    <BadgeInline status={ev.tipo} />
                                </div>
                                
                                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]"></span>
                                    {new Date(ev.data_inicio).toLocaleDateString('pt-BR')}
                                    <span className="text-[10px] opacity-70">
                                        ({new Date(ev.data_inicio).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})})
                                    </span>
                                </div>

                                {ev.local && (
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 mt-1">
                                        <MapPin size={10} /> <span className="truncate">{ev.local}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* MODAL FORM */}
      <Modal
        isOpen={openForm}
        onClose={() => { setOpenForm(false); setEditing(null); }}
        title={editing ? "Editar Evento" : "Novo Evento"}
      >
        <CRMAgendaForm
          evento={editing}
          onSaved={() => { setOpenForm(false); setEditing(null); loadEventos(); }}
          onClose={() => { setOpenForm(false); setEditing(null); }}
        />
      </Modal>

      {/* MODAL DELETE */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remover Evento">
        {deleteTarget && (
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl flex items-start gap-3 border border-red-100 dark:border-red-900/50">
              <AlertTriangle className="text-red-500 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-medium text-red-900 dark:text-red-200">
                  Tem certeza que deseja remover <strong>{deleteTarget.titulo}</strong>?
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  Essa ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="animate-spin" size={16} /> : "Excluir"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}