"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

import {
  Input,
  Label,
} from "@/components/admin/ui/Form";

import { Switch } from "@/components/admin/ui/Switch";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/admin/ui/Card";

export default function ImovelForm({ data = {}, onChange }) {
  const [form, setForm] = useState(data);
  const [proprietarios, setProprietarios] = useState([]);
  const [corretores, setCorretores] = useState([]);

  // 🔄 Sincroniza com o parent
  useEffect(() => {
    onChange?.(form);
  }, [form, onChange]);

  // 🔍 Carrega PROPRIETÁRIOS
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/personas?tipo=proprietario");
        const { data } = await res.json();
        if (!alive) return;

        if (Array.isArray(data)) {
          setProprietarios(
            data.map((d) => ({
              label: d.nome || d.email || "Sem nome",
              value: String(d.id ?? ""),
            }))
          );
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

  // 🔍 Carrega CORRETORES / ADM
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/profiles?roles=corretor,admin");
        const json = await res.json();
        if (!alive) return;

        if (Array.isArray(json)) {
          setCorretores(
            json.map((d) => ({
              label: d.nome_completo || d.email || "Sem nome",
              value: String(d.id ?? ""),
            }))
          );
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

  // 🔧 Manipula mudanças
  const handleChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));

    if (key === "disponibilidade") {
      let reset = {};
      if (value === "venda")
        reset = { preco_locacao: null, valor_condominio: null, valor_iptu: null };

      if (value === "locacao")
        reset = { preco_venda: null };

      setForm((prev) => ({
        ...prev,
        [key]: value,
        ...reset,
      }));
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
    <Card className="space-y-6">
      <CardHeader>
        <CardTitle>Dados do Imóvel</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Título e codigo_ref */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Título</Label>
            <Input
              value={form.titulo || ""}
              onChange={(e) => handleChange("titulo", e.target.value)}
            />
          </div>

          <div>
            <Label>Código de Referência</Label>
            <Input
              value={form.codigo_ref || ""}
              onChange={(e) => handleChange("codigo_ref", e.target.value)}
            />
          </div>
        </div>

        {/* Descrição */}
        <div>
          <Label>Descrição</Label>
          <Input
            value={form.descricao || ""}
            onChange={(e) => handleChange("descricao", e.target.value)}
          />
        </div>

        {/* Endereço */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>CEP</Label>
            <Input
              value={form.endereco_cep || ""}
              onChange={(e) => handleChange("endereco_cep", e.target.value)}
            />
          </div>

          <div>
            <Label>Logradouro</Label>
            <Input
              value={form.endereco_logradouro || ""}
              onChange={(e) => handleChange("endereco_logradouro", e.target.value)}
            />
          </div>

          <div>
            <Label>Número</Label>
            <Input
              value={form.endereco_numero || ""}
              onChange={(e) => handleChange("endereco_numero", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Bairro</Label>
            <Input
              value={form.endereco_bairro || ""}
              onChange={(e) => handleChange("endereco_bairro", e.target.value)}
            />
          </div>

          <div>
            <Label>Cidade</Label>
            <Input
              value={form.endereco_cidade || ""}
              onChange={(e) => handleChange("endereco_cidade", e.target.value)}
            />
          </div>

          <div>
            <Label>Estado (UF)</Label>
            <Input
              maxLength={2}
              value={form.endereco_estado || ""}
              onChange={(e) =>
                handleChange("endereco_estado", e.target.value.toUpperCase())
              }
            />
          </div>
        </div>

        {/* Proprietário, corretor, tipo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="flex flex-col gap-1">
            <Label>Proprietário</Label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
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
            <Label>Corretor Responsável</Label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
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
            <Label>Tipo</Label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
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

        {/* Status / disponibilidade / switches */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <div className="flex flex-col gap-1">
            <Label>Status</Label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={form.status ?? "disponivel"}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <Label>Disponibilidade</Label>
            <select
              className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={form.disponibilidade ?? "venda"}
              onChange={(e) => handleChange("disponibilidade", e.target.value)}
            >
              {disponibilidadeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-6 items-center justify-center md:justify-start">
            <div className="flex items-center gap-2">
              <Switch
                checked={!!form.mobiliado}
                onCheckedChange={(v) => handleChange("mobiliado", v)}
              />
              <Label className="text-sm">Mobiliado</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={!!form.pet_friendly}
                onCheckedChange={(v) => handleChange("pet_friendly", v)}
              />
              <Label className="text-sm">Pet Friendly</Label>
            </div>
          </div>
        </div>

        {/* Preços */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {(form.disponibilidade === "venda" ||
            form.disponibilidade === "ambos") && (
            <div>
              <Label>Preço de Venda (R$)</Label>
              <Input
                type="number"
                value={form.preco_venda || ""}
                onChange={(e) => handleChange("preco_venda", e.target.value)}
              />
            </div>
          )}

          {(form.disponibilidade === "locacao" ||
            form.disponibilidade === "ambos") && (
            <div>
              <Label>Preço de Locação (R$)</Label>
              <Input
                type="number"
                value={form.preco_locacao || ""}
                onChange={(e) => handleChange("preco_locacao", e.target.value)}
              />
            </div>
          )}

          {(form.disponibilidade === "locacao" ||
            form.disponibilidade === "ambos") && (
            <div>
              <Label>Valor de Condomínio (R$)</Label>
              <Input
                type="number"
                value={form.valor_condominio || ""}
                onChange={(e) => handleChange("valor_condominio", e.target.value)}
              />
            </div>
          )}
        </div>

        {(form.disponibilidade === "locacao" ||
          form.disponibilidade === "ambos") && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Valor de IPTU (R$)</Label>
              <Input
                type="number"
                value={form.valor_iptu || ""}
                onChange={(e) => handleChange("valor_iptu", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Área, quartos, banheiros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Área Total (m²)</Label>
            <Input
              type="number"
              value={form.area_total || ""}
              onChange={(e) => handleChange("area_total", e.target.value)}
            />
          </div>

          <div>
            <Label>Quartos</Label>
            <Input
              type="number"
              value={form.quartos || ""}
              onChange={(e) => handleChange("quartos", e.target.value)}
            />
          </div>

          <div>
            <Label>Banheiros</Label>
            <Input
              type="number"
              value={form.banheiros || ""}
              onChange={(e) => handleChange("banheiros", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Vagas de Garagem</Label>
            <Input
              type="number"
              value={form.vagas_garagem || ""}
              onChange={(e) => handleChange("vagas_garagem", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
