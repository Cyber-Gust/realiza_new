"use client";

import { useState, useEffect } from "react";
import {
  CalendarDays,
  Loader2,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  MapPin,
  User,
  Home,
  FileText,
} from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import { useToast } from "@/contexts/ToastContext";
import CRMAgendaForm from "./CRMAgendaForm";
import CRMCalendario from "./CRMCalendario";
import Badge from "@/components/admin/ui/Badge";

// ------------------------------------------------------
// BadgeInline — adaptada para o Badge REAL do seu sistema
// ------------------------------------------------------
function BadgeInline({ status }) {
  const normalized = (status || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll(" ", "_");

  // Apenas converte nomes → textos coerentes
  return (
    <Badge className="px-3 py-[3px] text-xs font-semibold capitalize">
      {normalized.replaceAll("_", " ")}
    </Badge>
  );
}

export default function CRMAgendaPanel() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const toast = useToast();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadEventos = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/crm/agenda", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setEventos(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar eventos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventos();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget?.id) return toast.error("ID inválido!");

    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/agenda?id=${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Evento removido com sucesso!");
      setDeleteTarget(null);
      loadEventos();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-200">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-xl font-semibold flex items-center gap-2 text-foreground">
          <CalendarDays size={20} /> Agenda de Compromissos
        </h3>

        <Button
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus size={16} /> Novo Evento
        </Button>
      </div>

      {/* Calendário */}
      <CRMCalendario />

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : eventos.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground bg-panel-card border-border">
          Nenhum evento agendado.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {eventos.map((ev) => (
            <Card
              key={ev.id}
              className="p-6 space-y-3 bg-panel-card border border-border hover:border-primary/50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all"
            >
              {/* Título + Ações */}
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-foreground text-base leading-tight">
                  {ev.titulo}
                </h4>

                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(ev);
                      setOpenForm(true);
                    }}
                  >
                    <Edit size={16} />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteTarget(ev)}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Tipo */}
              <BadgeInline status={ev.tipo?.replaceAll("_", " ") || "sem tipo"} />

              {/* Datas */}
              <p className="text-xs text-muted-foreground italic">
                {new Date(ev.data_inicio).toLocaleString("pt-BR")} →{" "}
                {new Date(ev.data_fim).toLocaleString("pt-BR")}
              </p>

              {/* Participante */}
              {ev.participante && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User size={14} className="text-foreground/60" />
                  <span>{ev.participante}</span>
                </div>
              )}

              {/* Imóvel */}
              {ev.imoveis?.titulo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Home size={14} className="text-foreground/60" />
                  <span>
                    {ev.imoveis.titulo}
                    {ev.imoveis.endereco_bairro && (
                      <span className="text-xs text-muted-foreground/70">
                        {" "}
                        — {ev.imoveis.endereco_bairro}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Local */}
              {ev.local && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={14} className="text-foreground/60" />
                  <span>{ev.local}</span>
                </div>
              )}

              {/* Observações */}
              {ev.observacoes && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <FileText size={14} className="text-foreground/60 mt-[1px]" />
                  <p className="whitespace-pre-wrap leading-snug">
                    {ev.observacoes}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={openForm}
        onClose={() => {
          setOpenForm(false);
          setEditing(null);
        }}
        title={editing ? "Editar Evento" : "Novo Evento"}
      >
        <CRMAgendaForm
          evento={editing}
          onSaved={loadEventos}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
        />
      </Modal>

      {/* Modal Delete */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Evento"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-1 shrink-0" />
              <div>
                <p>
                  Tem certeza que deseja remover{" "}
                  <strong>{deleteTarget.titulo}</strong>?
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(deleteTarget.data_inicio).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="w-1/2"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </Button>

              <Button
                className="w-1/2 bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Removendo...
                  </span>
                ) : (
                  "Confirmar Remoção"
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
