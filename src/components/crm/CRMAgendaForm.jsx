"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";
import { Loader2 } from "lucide-react";

export default function CRMAgendaForm({ onSaved, onClose, evento = null }) {
  const [leads, setLeads] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [imoveis, setImoveis] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    titulo: evento?.titulo || "",
    tipo: evento?.tipo || "visita_presencial",
    tipo_participante: evento?.tipo_participante || "lead",
    participante_id: evento?.participante_id || "",
    imovel_id: evento?.imovel_id || "",
    data_inicio: evento?.data_inicio || "",
    data_fim: evento?.data_fim || "",
    local: evento?.local || "",
    observacoes: evento?.observacoes || "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [leadsRes, personasRes, imoveisRes] = await Promise.all([
          fetch("/api/perfis/list?type=leads"),
          fetch("/api/perfis/list?type=personas"),
          fetch("/api/crm/agenda/imoveis/list"),
        ]);
        const [leadsData, personasData, imoveisData] = await Promise.all([
          leadsRes.json(),
          personasRes.json(),
          imoveisRes.json(),
        ]);
        setLeads(leadsData.data || []);
        setPersonas(personasData.data || []);
        setImoveis(imoveisData.data || []);
      } catch {
        Toast.error("Erro ao carregar dados de referência.");
      }
    })();
  }, []);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const method = evento ? "PATCH" : "POST";
      const url = evento ? "/api/crm/agenda/update" : "/api/crm/agenda";

      // 🔹 Normaliza o tipo do evento (garante formatação padronizada)
      const cleanTipo = form.tipo
        .toString()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replaceAll(" ", "_");

      // 🔹 Corrige campos UUID vazios → null
      const payload = {
        ...form,
        tipo: cleanTipo,
        imovel_id: form.imovel_id || null,
        participante_id: form.participante_id || null,
        lead_id: form.lead_id || null,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: evento?.id, ...payload }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      Toast.success(evento ? "Evento atualizado!" : "Evento criado!");
      onSaved?.();
      onClose?.();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        placeholder="Título do evento"
        value={form.titulo}
        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card"
      />

      <select
        value={form.tipo}
        onChange={(e) => setForm({ ...form, tipo: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card"
      >
        <option value="visita_presencial">Visita Presencial</option>
        <option value="visita_virtual">Visita Virtual</option>
        <option value="reuniao">Reunião</option>
        <option value="follow_up">Follow-up</option>
        <option value="administrativo">Administrativo</option>
        <option value="tecnico">Técnico</option>
        <option value="outro">Outro</option>
      </select>

      <select
        value={form.tipo_participante}
        onChange={(e) =>
          setForm({
            ...form,
            tipo_participante: e.target.value,
            participante_id: "",
          })
        }
        className="w-full border border-border rounded-md p-2 bg-panel-card"
      >
        <option value="lead">Lead</option>
        <option value="proprietario">Proprietário</option>
        <option value="inquilino">Inquilino</option>
        <option value="interno">Interno (Equipe)</option>
        <option value="outro">Outro</option>
      </select>

      {form.tipo_participante === "lead" && (
        <select
          value={form.participante_id}
          onChange={(e) => setForm({ ...form, participante_id: e.target.value })}
          className="w-full border border-border rounded-md p-2 bg-panel-card"
        >
          <option value="">Selecione o Lead</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.nome} ({lead.telefone})
            </option>
          ))}
        </select>
      )}

      {(form.tipo_participante === "proprietario" ||
        form.tipo_participante === "inquilino") && (
        <select
          value={form.participante_id}
          onChange={(e) => setForm({ ...form, participante_id: e.target.value })}
          className="w-full border border-border rounded-md p-2 bg-panel-card"
        >
          <option value="">Selecione a Pessoa</option>
          {personas
            .filter((p) => p.tipo === form.tipo_participante)
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.telefone})
              </option>
            ))}
        </select>
      )}

      <input
        type="text"
        placeholder="Local ou Link"
        value={form.local}
        onChange={(e) => setForm({ ...form, local: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card"
      />

      {(form.tipo === "visita_presencial" ||
        form.tipo === "visita_virtual" ||
        form.tipo === "tecnico") && (
        <select
          value={form.imovel_id}
          onChange={(e) => setForm({ ...form, imovel_id: e.target.value })}
          className="w-full border border-border rounded-md p-2 bg-panel-card"
        >
          <option value="">Selecione o Imóvel</option>
          {imoveis.map((im) => (
            <option key={im.id} value={im.id}>
              {im.titulo} - {im.endereco_bairro}
            </option>
          ))}
        </select>
      )}

      <input
        type="datetime-local"
        value={form.data_inicio}
        onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card"
      />
      <input
        type="datetime-local"
        value={form.data_fim}
        onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card"
      />

      <textarea
        placeholder="Observações / Pauta"
        value={form.observacoes}
        onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
        className="w-full border border-border rounded-md p-2 bg-panel-card"
        rows={3}
      />

      <Button className="w-full" disabled={loading} onClick={handleSubmit}>
        {loading ? (
          <>
            <Loader2 className="animate-spin mr-2" size={16} /> Salvando...
          </>
        ) : (
          "Salvar Evento"
        )}
      </Button>
    </div>
  );
}
