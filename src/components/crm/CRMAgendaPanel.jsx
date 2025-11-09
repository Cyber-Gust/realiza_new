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
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import Toast from "@/components/admin/ui/Toast";
import CRMAgendaForm from "./CRMAgendaForm";

/** 🔹 Badge interna sólida com texto branco */
function BadgeInline({ status }) {
  const value = (status || "")
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll(" ", "_");

  const colorMap = {
    visita_presencial: "bg-emerald-600 text-white",
    visita_virtual: "bg-sky-600 text-white",
    reuniao: "bg-blue-600 text-white",
    follow_up: "bg-amber-600 text-white",
    tecnico: "bg-orange-600 text-white",
    administrativo: "bg-gray-600 text-white",
    outro: "bg-purple-600 text-white",
  };

  const colorClass = colorMap[value] || "bg-gray-600 text-white";

  return (
    <span
      className={`inline-flex items-center mb-2 justify-center rounded-full text-xs font-semibold px-3 py-[3px] capitalize w-fit ${colorClass}`}
    >
      {status}
    </span>
  );
}

export default function CRMAgendaPanel() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
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
      Toast.error("Erro ao carregar eventos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventos();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget?.id) return Toast.error("ID inválido!");
    setDeleting(true);
    try {
      const res = await fetch(`/api/crm/agenda/delete?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      Toast.success("Evento removido com sucesso!");
      setDeleteTarget(null);
      loadEventos();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <CalendarDays size={18} /> Agenda de Compromissos
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

      {/* LISTA */}
      {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : eventos.length === 0 ? (
        <p className="p-4 text-center text-muted-foreground">
          Nenhum evento agendado.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {eventos.map((ev) => (
            <Card
              key={ev.id}
              className="p-4 space-y-2 relative hover:shadow-lg transition cursor-pointer border border-border bg-panel-card"
            >
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-foreground leading-tight">
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

              {/* BADGE */}
              <BadgeInline status={ev.tipo?.replaceAll("_", " ") || "sem tipo"} />

              <p className="text-xs text-muted-foreground italic">
                {new Date(ev.data_inicio).toLocaleString("pt-BR")} →{" "}
                {new Date(ev.data_fim).toLocaleString("pt-BR")}
              </p>

              {ev.participante && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <User size={14} className="text-foreground/70" />
                  <span>{ev.participante}</span>
                </div>
              )}

              {ev.imoveis?.titulo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Home size={14} className="text-foreground/70" />
                  <span>
                    {ev.imoveis.titulo}{" "}
                    {ev.imoveis.endereco_bairro && (
                      <span className="text-xs text-muted-foreground/70">
                        — {ev.imoveis.endereco_bairro}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {ev.local && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={14} className="text-foreground/70" />
                  <span>{ev.local}</span>
                </div>
              )}

              {ev.observacoes && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1">
                  <FileText size={14} className="text-foreground/70 mt-[2px]" />
                  <p className="whitespace-pre-wrap text-sm leading-snug">
                    {ev.observacoes}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* FORM */}
      <Modal
        open={openForm}
        onOpenChange={(val) => {
          setOpenForm(val);
          if (!val) setEditing(null);
        }}
        title={editing ? "Editar Evento" : "Novo Evento"}
      >
        <CRMAgendaForm
          evento={editing}
          onClose={() => {
            setOpenForm(false);
            setEditing(null);
          }}
          onSaved={loadEventos}
        />
      </Modal>

      {/* DELETE */}
      <Modal
        open={!!deleteTarget}
        onOpenChange={(val) => !val && setDeleteTarget(null)}
        title="Remover Evento"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-foreground">
              <AlertTriangle className="text-red-500 mt-1" />
              <div>
                <p>
                  Tem certeza que deseja remover o evento{" "}
                  <strong>{deleteTarget.titulo}</strong>?
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(deleteTarget.data_inicio).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="w-1/2"
                variant="secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </Button>
              <Button
                className="w-1/2 bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Removendo..." : "Confirmar Remoção"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
