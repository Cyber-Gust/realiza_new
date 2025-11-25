"use client";

import { useState, useCallback, useEffect, useMemo } from "react";

import { Input, Label, Select, Textarea } from "@/components/admin/ui/Form";
import { Switch } from "@/components/admin/ui/Switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/admin/ui/Card";

export default function ImovelForm({ data = {}, onChange }) {
  const [form, setForm] = useState({ ...data });
  const [proprietarios, setProprietarios] = useState([]);
  const [corretores, setCorretores] = useState([]);

  /* ============================================================
     🔄 Sync com o parent (edição ou criação)
  ============================================================ */
  useEffect(() => {
    onChange?.(form);
  }, [form, onChange]);

  /* ============================================================
     📌 Carregar PROPRIETÁRIOS
  ============================================================ */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/personas?tipo=proprietario");
        const { data } = await res.json();
        if (!alive) return;

        setProprietarios(
          Array.isArray(data)
            ? data.map((d) => ({
                label: d.nome || d.email || "Sem nome",
                value: String(d.id),
              }))
            : []
        );
      } catch (e) {
        console.error("Erro ao carregar proprietários:", e);
        setProprietarios([]);
      }
    })();

    return () => (alive = false);
  }, []);

  /* ============================================================
     📌 Carregar CORRETORES
  ============================================================ */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/profiles?roles=corretor,admin");
        const json = await res.json();
        if (!alive) return;

        setCorretores(
          Array.isArray(json)
            ? json.map((d) => ({
                label: d.nome_completo || d.email || "Sem nome",
                value: String(d.id),
              }))
            : []
        );
      } catch (e) {
        console.error("Erro ao carregar corretores:", e);
      }
    })();

    return () => (alive = false);
  }, []);

  /* ============================================================
     🔧 Change Handler — limpo, genérico e resiliente
  ============================================================ */
  const handleChange = useCallback((key, value) => {
    setForm((prev) => {
      let next = { ...prev, [key]: value };

      // Regras da disponibilidade
      if (key === "disponibilidade") {
        if (value === "venda") {
          next = {
            ...next,
            preco_locacao: null,
            valor_condominio: null,
            valor_iptu: null,
          };
        }

        if (value === "locacao") {
          next = {
            ...next,
            preco_venda: null,
          };
        }
      }

      return next;
    });
  }, []);

  /* ============================================================
     OPTIONS
  ============================================================ */
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

  const categoriaOptions = [
    "Para Alugar",
    "Vitrine dos Sonhos",
    "Realize Essence",
    "Imóveis no Geral",
    "Imóveis na Planta",
    "Casa em Condomínio",
  ];

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <Card className="space-y-6">
      <CardHeader>
        <CardTitle>Dados do Imóvel</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Título + Código + Slug */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Título</Label>
            <Input
              value={form.titulo || ""}
              onChange={(e) => {
                const value = e.target.value;
                handleChange("titulo", value);

                // auto-slug no mesmo fluxo do input
                if (!data.id) {
                  const slug = value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^\w-]+/g, "");
                  handleChange("slug", slug);
                }
              }}
            />
          </div>

          <div>
            <Label>Código de Referência</Label>
            <Input
              value={form.codigo_ref || ""}
              onChange={(e) => handleChange("codigo_ref", e.target.value)}
            />
          </div>

          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug || ""}
              onChange={(e) => handleChange("slug", e.target.value)}
            />
          </div>
        </div>

        {/* Título curto */}
        <div>
          <Label>Título Curto</Label>
          <Input
            value={form.titulo_curto || ""}
            onChange={(e) => handleChange("titulo_curto", e.target.value)}
          />
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
            <Label>UF</Label>
            <Input
              maxLength={2}
              value={form.endereco_estado || ""}
              onChange={(e) =>
                handleChange("endereco_estado", e.target.value.toUpperCase())
              }
            />
          </div>
        </div>

        {/* Proprietário / Corretor / Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Proprietário</Label>
            <Select
              
              value={form.proprietario_id ?? ""}
              onChange={(e) => handleChange("proprietario_id", e.target.value)}
            >
              <option value="" hidden>Selecione...</option>
              {proprietarios.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Corretor Responsável</Label>
            <Select
              
              value={form.corretor_id ?? ""}
              onChange={(e) => handleChange("corretor_id", e.target.value)}
            >
              <option value="" hidden>Selecione...</option>
              {corretores.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Tipo</Label>
            <Select
              
              value={form.tipo ?? ""}
              onChange={(e) => handleChange("tipo", e.target.value)}
            >
              <option value="" hidden>Selecione...</option>
              {tipoOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Status / disponibilidade / flags */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Status</Label>
            <Select
              
              value={form.status ?? "disponivel"}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label>Disponibilidade</Label>
            <Select
              
              value={form.disponibilidade ?? "venda"}
              onChange={(e) => handleChange("disponibilidade", e.target.value)}
            >
              {disponibilidadeOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2">
              <Switch checked={!!form.mobiliado} onCheckedChange={(v) => handleChange("mobiliado", v)} />
              <Label>Mobiliado</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={!!form.pet_friendly} onCheckedChange={(v) => handleChange("pet_friendly", v)} />
              <Label>Pet Friendly</Label>
            </div>
          </div>
        </div>

        {/* Flags extras */}
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={!!form.piscina} onCheckedChange={(v) => handleChange("piscina", v)} />
            <Label>Piscina</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={!!form.elevador} onCheckedChange={(v) => handleChange("elevador", v)} />
            <Label>Elevador</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={!!form.area_gourmet} onCheckedChange={(v) => handleChange("area_gourmet", v)} />
            <Label>Área Gourmet</Label>
          </div>
        </div>

        {/* PREÇOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(form.disponibilidade === "venda" ||
            form.disponibilidade === "ambos") && (
            <div>
              <Label>Preço de Venda (R$)</Label>
              <Input
                type="number"
                value={form.preco_venda ?? ""}
                onChange={(e) =>
                  handleChange("preco_venda", Number(e.target.value))
                }
              />
            </div>
          )}

          {(form.disponibilidade === "locacao" ||
            form.disponibilidade === "ambos") && (
            <div>
              <Label>Preço de Locação (R$)</Label>
              <Input
                type="number"
                value={form.preco_locacao ?? ""}
                onChange={(e) =>
                  handleChange("preco_locacao", Number(e.target.value))
                }
              />
            </div>
          )}

          <div>
            <Label>Valor de Condomínio (R$)</Label>
            <Input
              type="number"
              value={form.valor_condominio ?? ""}
              onChange={(e) =>
                handleChange("valor_condominio", Number(e.target.value))
              }
            />
          </div>

          <div>
            <Label>Valor IPTU (R$)</Label>
            <Input
              type="number"
              value={form.valor_iptu ?? ""}
              onChange={(e) =>
                handleChange("valor_iptu", Number(e.target.value))
              }
            />
          </div>
        </div>

        {/* Área / Dormitórios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Área Total (m²)</Label>
            <Input
              type="number"
              value={form.area_total ?? ""}
              onChange={(e) => handleChange("area_total", Number(e.target.value))}
            />
          </div>

          <div>
            <Label>Quartos</Label>
            <Input
              type="number"
              value={form.quartos ?? ""}
              onChange={(e) => handleChange("quartos", Number(e.target.value))}
            />
          </div>

          <div>
            <Label>Suítes</Label>
            <Input
              type="number"
              value={form.suites ?? ""}
              onChange={(e) => handleChange("suites", Number(e.target.value))}
            />
          </div>

          <div>
            <Label>Banheiros</Label>
            <Input
              type="number"
              value={form.banheiros ?? ""}
              onChange={(e) => handleChange("banheiros", Number(e.target.value))}
            />
          </div>
        </div>

        {/* Garagem */}
        <div>
          <Label>Vagas de Garagem</Label>
          <Input
            type="number"
            value={form.vagas_garagem ?? ""}
            onChange={(e) => handleChange("vagas_garagem", Number(e.target.value))}
          />
        </div>

        {/* Condominio nome */}
        <div>
          <Label>Nome do Condomínio (opcional)</Label>
          <Input
            value={form.condominio || ""}
            onChange={(e) => handleChange("condominio", e.target.value)}
          />
        </div>

        {/* Chaves */}
        <div>
          <Label>Localização da Chave (interno)</Label>
          <Input
            value={form.chaves_localizacao || ""}
            onChange={(e) => handleChange("chaves_localizacao", e.target.value)}
          />
        </div>

        <div className="space-y-2">
        <Label>Categorias</Label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {categoriaOptions.map((cat) => {
            const normalized = cat.toLowerCase();

            return (
              <label
                key={cat}
                className="
                  flex items-center gap-3 cursor-pointer select-none
                  p-2 rounded-xl transition-all
                  hover:bg-gray-100
                "
              >
                <input
                  type="checkbox"
                  className="
                    peer h-5 w-5 cursor-pointer appearance-none rounded
                    border border-gray-400 transition-all
                    checked:bg-accent checked:border-accent
                    checked:before:block checked:before:content-['✔']
                    checked:before:text-white checked:before:text-sm
                    checked:before:flex checked:before:items-center checked:before:justify-center
                    hover:border-accent
                  "
                  checked={form.categorias?.includes(normalized) || false}
                  onChange={(e) => {
                    const checked = e.target.checked;

                    let next = form.categorias ? [...form.categorias] : [];

                    if (checked) {
                      next.push(normalized);
                    } else {
                      next = next.filter((c) => c !== normalized);
                    }

                    handleChange("categorias", next);
                  }}
                />

                <span className="text-gray-800 dark:text-white">{cat}</span>
              </label>
            );
          })}
        </div>
      </div>
      </CardContent>
    </Card>
  );
}
