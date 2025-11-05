"use client";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import Modal from "@/components/admin/ui/Modal";
import Input from "@/components/admin/forms/Input";
import DatePicker from "@/components/admin/forms/DatePicker";
import { useAgenda } from "@/hooks/useAgenda";
import AgendaCalendar from "@/components/crm/AgendaCalendar";
import { useState } from "react";

export default function AgendaPage() {
  const { eventos, loading, createEvento, deleteEvento, loadEventos } = useAgenda();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: "",
    tipo: "visita",
    data_inicio: "",
    data_fim: "",
    lead_id: "",
    imovel_id: "",
  });

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    await createEvento(form);
    setForm({ titulo: "", tipo: "visita", data_inicio: "", data_fim: "", lead_id: "", imovel_id: "" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda Comercial"
        description="Gerencie visitas, reuniões e follow-ups agendados."
        rightSection={
          <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
            <CalendarPlus size={16} /> Novo Evento
          </Button>
        }
      />

      <Card>
        {loading ? (
          <p className="p-4 text-center text-muted-foreground">Carregando eventos...</p>
        ) : (
          <AgendaCalendar data={eventos} onReload={loadEventos} />
        )}
      </Card>

      <Modal open={open} onOpenChange={setOpen} title="Novo Evento">
        <div className="space-y-3">
          <Input
            label="Título"
            value={form.titulo}
            onChange={(e) => handleChange("titulo", e.target.value)}
          />
          <Input
            label="Tipo (visita, reunião, follow-up...)"
            value={form.tipo}
            onChange={(e) => handleChange("tipo", e.target.value)}
          />
          <DatePicker
            label="Data de Início"
            value={form.data_inicio}
            onChange={(date) => handleChange("data_inicio", date)}
          />
          <DatePicker
            label="Data de Fim"
            value={form.data_fim}
            onChange={(date) => handleChange("data_fim", date)}
          />
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave}>Salvar Evento</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
