"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Input, Textarea, Select, Label } from "@/components/admin/ui/Form";
import { useToast } from "@/contexts/ToastContext";

export default function CRMLeadForm({ onSaved, onClose, lead = null }) {
  const [form, setForm] = useState({
    nome: lead?.nome || "",
    email: lead?.email || "",
    telefone: lead?.telefone || "",
    origem: lead?.origem || "",
    status: lead?.status || "novo",
    corretor_id: lead?.corretor_id || "",

    /* 🆕 Novos campos */
    interesse_tipo: lead?.interesse_tipo || "",
    interesse_disponibilidade: lead?.interesse_disponibilidade || "",
    faixa_preco_min: lead?.faixa_preco_min || "",
    faixa_preco_max: lead?.faixa_preco_max || "",
    quartos: lead?.quartos || "",
    banheiros: lead?.banheiros || "",
    suites: lead?.suites || "",
    vagas: lead?.vagas || "",
    cidade_preferida: lead?.cidade_preferida || "",
    bairro_preferido: lead?.bairro_preferido || "",
    pet_friendly: lead?.pet_friendly ?? "",
    mobiliado: lead?.mobiliado ?? "",
    condominio_max: lead?.condominio_max || "",
    urgencia: lead?.urgencia || "",
    motivo_busca: lead?.motivo_busca || "",
    observacoes: lead?.observacoes || "",
  });

  const [loading, setLoading] = useState(false);
  const [corretores, setCorretores] = useState([]);

  const toast = useToast();

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* ============================================================
     Carrega Corretores
  ============================================================ */
  useEffect(() => {
    const loadCorretores = async () => {
      try {
        const res = await fetch("/api/perfis/list?type=equipe", {
          cache: "no-store",
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        setCorretores(json.data || []);
      } catch (err) {
        toast.error("Erro ao carregar corretores", err.message);
      }
    };

    loadCorretores();
  }, [toast]);

  /* ============================================================
     Limpa Payload
  ============================================================ */
  const cleanPayload = (obj) => {
    const cleaned = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== "" && v !== null && v !== undefined) cleaned[k] = v;
    }
    return cleaned;
  };

  /* ============================================================
     Submit
  ============================================================ */
  const handleSubmit = async () => {
    if (!form.nome || !form.telefone) {
      return toast.error("Erro", "Nome e telefone são obrigatórios!");
    }

    setLoading(true);

    try {
      const isEdit = !!lead?.id;

      const payload = cleanPayload({
        ...form,
        ...(isEdit ? { id: lead.id } : {}),
      });

      const url = "/api/crm/leads";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(
        "Sucesso",
        `Lead ${isEdit ? "atualizado" : "criado"} com sucesso!`
      );

      onSaved?.(json.data);
      onClose?.();
    } catch (err) {
      toast.error("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     Render
  ============================================================ */
  return (
    <div className="space-y-6">

      {/* Informações básicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nome</Label>
          <Input
            value={form.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
          />
        </div>

        <div>
          <Label>Telefone</Label>
          <Input
            value={form.telefone}
            onChange={(e) => handleChange("telefone", e.target.value)}
          />
        </div>

        <div>
          <Label>Email</Label>
          <Input
            value={form.email}
            type="email"
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </div>

        <div>
          <Label>Origem</Label>
          <Input
            value={form.origem}
            onChange={(e) => handleChange("origem", e.target.value)}
          />
        </div>

        <div>
          <Label>Status</Label>
          <Select
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            {[
              "novo",
              "qualificado",
              "visita_agendada",
              "proposta_feita",
              "documentacao",
              "concluido",
              "perdido",
            ].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ").toUpperCase()}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label>Corretor Responsável</Label>
          <Select
            value={form.corretor_id}
            onChange={(e) => handleChange("corretor_id", e.target.value)}
          >
            <option value="">Selecione</option>
            {corretores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome_completo}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Perfil estruturado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div>
          <Label>Tipo do imóvel desejado</Label>
          <Select
            value={form.interesse_tipo || ""}
            onChange={(e) => handleChange("interesse_tipo", e.target.value)}
          >
            <option value="">Selecione</option>
            <option value="apartamento">Apartamento</option>
            <option value="casa">Casa</option>
            <option value="terreno">Terreno</option>
            <option value="comercial">Comercial</option>
            <option value="rural">Rural</option>
          </Select>
        </div>

        <div>
          <Label>Disponibilidade</Label>
          <Select
            value={form.interesse_disponibilidade || ""}
            onChange={(e) =>
              handleChange("interesse_disponibilidade", e.target.value)
            }
          >
            <option value="">Selecione</option>
            <option value="venda">Venda</option>
            <option value="locacao">Locação</option>
            <option value="ambos">Ambos</option>
          </Select>
        </div>

        <div>
          <Label>Preço Mínimo</Label>
          <Input
            type="number"
            value={form.faixa_preco_min}
            onChange={(e) =>
              handleChange("faixa_preco_min", Number(e.target.value))
            }
          />
        </div>

        <div>
          <Label>Preço Máximo</Label>
          <Input
            type="number"
            value={form.faixa_preco_max}
            onChange={(e) =>
              handleChange("faixa_preco_max", Number(e.target.value))
            }
          />
        </div>

        <div>
          <Label>Quartos</Label>
          <Input
            type="number"
            value={form.quartos}
            onChange={(e) => handleChange("quartos", Number(e.target.value))}
          />
        </div>

        <div>
          <Label>Banheiros</Label>
          <Input
            type="number"
            value={form.banheiros}
            onChange={(e) => handleChange("banheiros", Number(e.target.value))}
          />
        </div>

        <div>
          <Label>Suítes</Label>
          <Input
            type="number"
            value={form.suites}
            onChange={(e) => handleChange("suites", Number(e.target.value))}
          />
        </div>

        <div>
          <Label>Vagas</Label>
          <Input
            type="number"
            value={form.vagas}
            onChange={(e) => handleChange("vagas", Number(e.target.value))}
          />
        </div>

        <div>
          <Label>Cidade preferida</Label>
          <Input
            value={form.cidade_preferida}
            onChange={(e) => handleChange("cidade_preferida", e.target.value)}
          />
        </div>

        <div>
          <Label>Bairro preferido</Label>
          <Input
            value={form.bairro_preferido}
            onChange={(e) => handleChange("bairro_preferido", e.target.value)}
          />
        </div>

        <div>
          <Label>Pet Friendly</Label>
          <Select
            value={form.pet_friendly}
            onChange={(e) =>
              handleChange("pet_friendly", e.target.value === "true")
            }
          >
            <option value="">Selecione</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </Select>
        </div>

        <div>
          <Label>Mobiliado</Label>
          <Select
            value={form.mobiliado}
            onChange={(e) =>
              handleChange("mobiliado", e.target.value === "true")
            }
          >
            <option value="">Selecione</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </Select>
        </div>

        <div>
          <Label>Condomínio Máximo</Label>
          <Input
            type="number"
            value={form.condominio_max}
            onChange={(e) =>
              handleChange("condominio_max", Number(e.target.value))
            }
          />
        </div>

        <div>
          <Label>Urgência</Label>
          <Select
            value={form.urgencia}
            onChange={(e) => handleChange("urgencia", e.target.value)}
          >
            <option value="">Selecione</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </Select>
        </div>
      </div>

      {/* Observações */}
      <div>
        <Label>Motivo da busca</Label>
        <Input
          value={form.motivo_busca}
          onChange={(e) => handleChange("motivo_busca", e.target.value)}
        />
      </div>

      <div>
        <Label>Observações</Label>
        <Textarea
          rows={4}
          value={form.observacoes}
          onChange={(e) => handleChange("observacoes", e.target.value)}
        />
      </div>

      {/* BOTÃO */}
      <Button
        className="w-full mt-6 h-11 text-sm"
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading
          ? "Salvando..."
          : lead
          ? "Atualizar Lead"
          : "Salvar Lead"}
      </Button>
    </div>
  );
}
