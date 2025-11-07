"use client";

import { useState } from "react";
import Card from "@/components/admin/ui/Card";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import Modal from "@/components/admin/ui/Modal";
import Input from "@/components/admin/forms/Input";
import DatePicker from "@/components/admin/forms/DatePicker";
import { useAgenda } from "@/hooks/useAgenda";
import AgendaCalendar from "@/components/crm/AgendaCalendar";

export default function AgendaPanel() {
  const { eventos, loading, createEvento, loadEventos } = useAgenda();
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
    setForm({
      titulo: "",
      tipo: "visita",
      data_inicio: "",
      data_fim: "",
      lead_id: "",
      imovel_id: "",
    });
    setOpen(false);
    loadEventos();
  };

  return (
    <section className="space-y-6 animate-fadeIn">
      {/* Cabeçalho de ações */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Agenda</h2>
        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 font-medium transition-all hover:scale-[1.02]"
        >
          <CalendarPlus size={16} /> Novo Evento
        </Button>
      </div>

      {/* Listagem */}
      <Card className="overflow-hidden border border-border rounded-xl shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-muted-foreground animate-pulse">Carregando eventos...</p>
        ) : (
          <AgendaCalendar data={eventos} />
        )}
      </Card>

      {/* Modal de Criação */}
      <Modal open={open} onOpenChange={setOpen} title="Novo Evento">
        <div className="space-y-4">
          <Input
            label="Título"
            placeholder="Ex: Visita ao apartamento do Centro"
            value={form.titulo}
            onChange={(e) => handleChange("titulo", e.target.value)}
          />
          <Input
            label="Tipo"
            placeholder="Ex: visita, reunião, follow-up..."
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
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} className="min-w-[120px]">
              Salvar Evento
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
