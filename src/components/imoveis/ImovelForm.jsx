"use client";
import Input from "@/components/admin/forms/Input";
import Switch from "@/components/admin/forms/Switch";
import Card from "@/components/admin/ui/Card";
import { useState, useCallback, useEffect, useMemo } from "react";

export default function ImovelForm({ data = {}, onChange }) {
  const [form, setForm] = useState(data);
  const [proprietarios, setProprietarios] = useState([]);
  const [corretores, setCorretores] = useState([]);

  // 🔄 Sincroniza com o parent (NovoImovelPage)
  useEffect(() => {
    onChange && onChange(form);
  }, [form, onChange]);

  // 🔍 Carrega lista de proprietários (personas)
  useEffect(() => {
  let alive = true;

  (async () => {
    try {
      const res = await fetch("/api/personas?tipo=proprietario");
      const { data } = await res.json(); // ✅ pega o campo correto
      if (!alive) return;

      if (Array.isArray(data)) {
        const mapped = data.map((d) => ({
          label: d.nome || d.email || "Sem nome",
          value: String(d.id ?? ""),
        }));
        setProprietarios(mapped);
      } else {
        setProprietarios([]);
      }
    } catch (e) {
      console.error("Erro ao carregar proprietários:", e);
      setProprietarios([]);
    }
  })();

  return () => {
    alive = false;
  };
}, []);

  // 🔍 Carrega lista de corretores/admins
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/profiles?roles=corretor,admin");
        const json = await res.json();
        if (!alive) return;

        if (Array.isArray(json)) {
          const mapped = json.map((d) => ({
            label: d.nome_completo || d.email || "Sem nome",
            value: String(d.id ?? ""),
          }));
          setCorretores(mapped);
        } else {
          setCorretores([]);
        }
      } catch (e) {
        console.error("Erro ao carregar corretores:", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "disponibilidade") {
      let reset = {};
      if (value === "venda") reset = { preco_locacao: null, valor_condominio: null, valor_iptu: null };
      if (value === "locacao") reset = { preco_venda: null };
      setForm((prev) => ({ ...prev, [key]: value, ...reset }));
      return;
    }
  }, []);

  const tipoOptions = useMemo(
    () => [
      { label: "Casa", value: "casa" },
      { label: "Apartamento", value: "apartamento" },
      { label: "Terreno", value: "terreno" },
      { label: "Comercial", value: "comercial" },
      { label: "Rural", value: "rural" },
    ],
    []
  );

  const statusOptions = useMemo(
    () => [
      { label: "Disponível", value: "disponivel" },
      { label: "Reservado", value: "reservado" },
      { label: "Alugado", value: "alugado" },
      { label: "Vendido", value: "vendido" },
      { label: "Inativo", value: "inativo" },
    ],
    []
  );

  const disponibilidadeOptions = useMemo(
    () => [
      { label: "Venda", value: "venda" },
      { label: "Locação", value: "locacao" },
      { label: "Ambos", value: "ambos" },
    ],
    []
  );

  return (
    <Card title="Dados do Imóvel" className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Título"
          value={form.titulo || ""}
          onChange={(e) => handleChange("titulo", e.target.value)}
        />
        <Input
          label="Código de Referência"
          value={form.codigo_ref || ""}
          onChange={(e) => handleChange("codigo_ref", e.target.value)}
        />
      </div>

      <Input
        label="Descrição"
        value={form.descricao || ""}
        onChange={(e) => handleChange("descricao", e.target.value)}
      />

      {/* Endereço */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="CEP"
          value={form.endereco_cep || ""}
          onChange={(e) => handleChange("endereco_cep", e.target.value)}
        />
        <Input
          label="Logradouro"
          value={form.endereco_logradouro || ""}
          onChange={(e) => handleChange("endereco_logradouro", e.target.value)}
        />
        <Input
          label="Número"
          value={form.endereco_numero || ""}
          onChange={(e) => handleChange("endereco_numero", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Bairro"
          value={form.endereco_bairro || ""}
          onChange={(e) => handleChange("endereco_bairro", e.target.value)}
        />
        <Input
          label="Cidade"
          value={form.endereco_cidade || ""}
          onChange={(e) => handleChange("endereco_cidade", e.target.value)}
        />
        <Input
          label="Estado (UF)"
          maxLength={2}
          value={form.endereco_estado || ""}
          onChange={(e) =>
            handleChange("endereco_estado", e.target.value.toUpperCase())
          }
        />
      </div>

      {/* Proprietário, Corretor e Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted-foreground">Proprietário</label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
            value={form.proprietario_id ?? ""}
            onChange={(e) => handleChange("proprietario_id", e.target.value)}
          >
            <option value="" disabled hidden>Selecione...</option>
            {proprietarios.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted-foreground">Corretor Responsável</label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
            value={form.corretor_id ?? ""}
            onChange={(e) => handleChange("corretor_id", e.target.value)}
          >
            <option value="" disabled hidden>Selecione...</option>
            {corretores.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted-foreground">Tipo</label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
            value={form.tipo ?? ""}
            onChange={(e) => handleChange("tipo", e.target.value)}
          >
            <option value="" disabled hidden>Selecione...</option>
            {tipoOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Status e switches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted-foreground">Status</label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
            value={form.status ?? "disponivel"}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted-foreground">Disponibilidade</label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
            value={form.disponibilidade ?? "venda"}
            onChange={(e) => handleChange("disponibilidade", e.target.value)}
          >
            {disponibilidadeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-6 items-center justify-center md:justify-start">
          <Switch
            label="Mobiliado"
            checked={!!form.mobiliado}
            onCheckedChange={(v) => handleChange("mobiliado", v)}
          />
          <Switch
            label="Pet Friendly"
            checked={!!form.pet_friendly}
            onCheckedChange={(v) => handleChange("pet_friendly", v)}
          />
        </div>
      </div>

     {/* Preços, condomínio e IPTU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(form.disponibilidade === "venda" || form.disponibilidade === "ambos") && (
          <Input
            label="Preço de Venda (R$)"
            type="number"
            value={form.preco_venda || ""}
            onChange={(e) => handleChange("preco_venda", e.target.value)}
          />
        )}

        {(form.disponibilidade === "locacao" || form.disponibilidade === "ambos") && (
          <Input
            label="Preço de Locação (R$)"
            type="number"
            value={form.preco_locacao || ""}
            onChange={(e) => handleChange("preco_locacao", e.target.value)}
          />
        )}

        {/* Exibe condomínio e IPTU apenas se for locação ou ambos */}
          <Input
            label="Valor de Condomínio (R$)"
            type="number"
            value={form.valor_condominio || ""}
            onChange={(e) => handleChange("valor_condominio", e.target.value)}
          />
      </div>

      {/* IPTU sempre que houver locação ou ambos */}
      {(form.disponibilidade === "locacao" || form.disponibilidade === "ambos") && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Valor de IPTU (R$)"
            type="number"
            value={form.valor_iptu || ""}
            onChange={(e) => handleChange("valor_iptu", e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Valor de IPTU (R$)"
          type="number"
          value={form.valor_iptu || ""}
          onChange={(e) => handleChange("valor_iptu", e.target.value)}
        />
        <Input
          label="Área Total (m²)"
          type="number"
          value={form.area_total || ""}
          onChange={(e) => handleChange("area_total", e.target.value)}
        />
        <Input
          label="Quartos"
          type="number"
          value={form.quartos || ""}
          onChange={(e) => handleChange("quartos", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Banheiros"
          type="number"
          value={form.banheiros || ""}
          onChange={(e) => handleChange("banheiros", e.target.value)}
        />
        <Input
          label="Vagas de Garagem"
          type="number"
          value={form.vagas_garagem || ""}
          onChange={(e) => handleChange("vagas_garagem", e.target.value)}
        />
      </div>
    </Card>
  );
}
