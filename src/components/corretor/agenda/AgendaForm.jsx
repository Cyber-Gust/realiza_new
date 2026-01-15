"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/admin/ui/Form";
import { useToast } from "@/contexts/ToastContext";
import { Loader2 } from "lucide-react";
import SearchableSelect from "@/components/admin/ui/SearchableSelect";

export default function CRMAgendaForm({ onSaved, onClose, evento = null }) {
  const [leads, setLeads] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  const [form, setForm] = useState({
    titulo: evento?.titulo || "",
    tipo: evento?.tipo || "visita_presencial",
    tipo_participante: evento?.tipo_participante || "lead",
    participante_id: evento?.participante_id || "",
    lead_id: "",
    persona_id: "",
    imovel_id: evento?.imovel_id || "",
    data_inicio: evento?.data_inicio || "",
    data_fim: evento?.data_fim || "",
    local: evento?.local || "",
    observacoes: evento?.observacoes || "",
  });

  const setValue = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ============================================================
      Carregamento inicial
  ============================================================ */
  useEffect(() => {
    (async () => {
      try {
        const [leadsRes, personasRes, imoveisRes] = await Promise.all([
          fetch("/api/crm//leads"),
          fetch("/api/perfis/list?type=personas"),
          fetch("/api/imoveis"),
        ]);

        const [leadsData, personasData, imoveisData] = await Promise.all([
          leadsRes.json(),
          personasRes.json(),
          imoveisRes.json(),
        ]);

        setLeads(leadsData.data || []);
        setPersonas(personasData.data || []);
        setImoveis(imoveisData.data || []);
      } catch (err) {
        toast.error("Erro ao carregar dados", err.message);
      }
    })();
  }, [toast]);

  /* ============================================================
      Filtro de personas por tipo
  ============================================================ */
  const personasFiltradas = personas.filter(
    (p) => p.tipo === form.tipo_participante
  );

  /* ============================================================
      Submit
  ============================================================ */
  const handleSubmit = async () => {
    try {
      setLoading(true);

      const method = evento ? "PATCH" : "POST";
      const url = "/api/crm/agenda";

      const cleanTipo = form.tipo
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replaceAll(" ", "_");

      const payload = {
        ...form,
        tipo: cleanTipo,
        imovel_id: form.imovel_id || null,
        participante_id: form.participante_id || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: evento?.id, ...payload }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(evento ? "Evento atualizado!" : "Evento criado!");
      onSaved?.();
      onClose?.();
    } catch (err) {
      toast.error("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
      UI
  ============================================================ */
  return (
    <div>

      <div className="grid grid-cols-1 gap-4">

        {/* Título */}
        <div>
          <Label>Título</Label>
          <Input
            value={form.titulo}
            onChange={(e) => setValue("titulo", e.target.value)}
          />
        </div>

        {/* Tipo de Evento */}
        <div>
          <Label>Tipo de Evento</Label>
          <Select
            value={form.tipo}
            onChange={(e) => setValue("tipo", e.target.value)}
          >
            <option value="visita_presencial">Visita Presencial</option>
            <option value="visita_virtual">Visita Virtual</option>
            <option value="reuniao">Reunião</option>
            <option value="follow_up">Follow-up</option>
            <option value="administrativo">Administrativo</option>
            <option value="tecnico">Técnico</option>
            <option value="outro">Outro</option>
          </Select>
        </div>

        {/* Tipo de Participante */}
        <div>
          <Label>Tipo de Participante</Label>
          <Select
            value={form.tipo_participante}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                tipo_participante: e.target.value,
                participante_id: "",
                lead_id: "",
                persona_id: "",
              }))
            }
          >
            <option value="lead">Lead</option>
            <option value="proprietario">Proprietário</option>
            <option value="inquilino">Inquilino</option>
            <option value="cliente">Cliente</option>
            <option value="interno">Interno (Equipe)</option>
            <option value="outro">Outro</option>
          </Select>
        </div>

        {/* PARTICIPANTE LEAD */}
        {form.tipo_participante === "lead" && (
          <div>
            <Label>Lead</Label>
            <SearchableSelect
              value={form.lead_id}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  lead_id: v,
                  participante_id: v,
                  persona_id: "",
                }))
              }
              options={leads.map((l) => ({
                value: String(l.id),
                label: l.nome,
              }))}
            />
          </div>
        )}

        {/* PARTICIPANTE PROPRIETÁRIO / INQUILINO / CLIENTE */}
        {(form.tipo_participante === "proprietario" ||
          form.tipo_participante === "inquilino" ||
          form.tipo_participante === "cliente") && (
          <div>
            <Label>Pessoa</Label>
            <SearchableSelect
              value={form.persona_id}
              onChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  persona_id: v,
                  participante_id: v,
                  lead_id: "",
                }))
              }
              options={personasFiltradas.map((p) => ({
                value: String(p.id),
                label: p.nome,
              }))}
            />
          </div>
        )}

        {/* Local */}
        <div>
          <Label>Local / Link</Label>
          <Input
            value={form.local}
            onChange={(e) => setValue("local", e.target.value)}
          />
        </div>

        {/* Imóvel */}
        {(form.tipo === "visita_presencial" ||
          form.tipo === "visita_virtual" ||
          form.tipo === "tecnico") && (
          <div>
            <Label>Imóvel</Label>
            <SearchableSelect
              value={form.imovel_id}
              onChange={(v) => setValue("imovel_id", v)}
              options={imoveis.map((i) => ({
                value: String(i.id),
                label: i.titulo || i.endereco_bairro,
              }))}
            />
          </div>
        )}

        {/* Datas */}
        <div>
          <Label>Início</Label>
          <Input
            type="datetime-local"
            value={form.data_inicio}
            onChange={(e) => setValue("data_inicio", e.target.value)}
          />
        </div>

        <div>
          <Label>Fim</Label>
          <Input
            type="datetime-local"
            value={form.data_fim}
            onChange={(e) => setValue("data_fim", e.target.value)}
          />
        </div>

        {/* Observações */}
        <div>
          <Label>Observações</Label>
          <Textarea
            rows={3}
            value={form.observacoes}
            onChange={(e) => setValue("observacoes", e.target.value)}
          />
        </div>
      </div>

      <Button
        className="w-full h-11 mt-4 text-sm"
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Salvando...
          </span>
        ) : (
          "Salvar Evento"
        )}
      </Button>
    </div>
  );
}
