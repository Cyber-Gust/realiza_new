"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  formatBRL,
  parseCurrencyToNumber,
  formatArea,
  parseAreaToNumber,
  formatPhoneBR,
} from "@/utils/currency";
import { Input, Label, Select, Textarea } from "@/components/admin/ui/Form";
import SearchableSelect from "@/components/admin/ui/SearchableSelect";
import { Switch } from "@/components/admin/ui/Switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/admin/ui/Card";

/* ============================================================
   MOCKS DE ENDEREÇO
============================================================ */
const ESTADOS = [
  { sigla: "MG", nome: "Minas Gerais" }
];

export const CIDADES_POR_ESTADO = {
  MG: [
    "Barbacena",
    "Barroso",
    "Bom Sucesso",
    "Capela Nova",
    "Carandaí",
    "Cipotânea",
    "Conceição da Barra de Minas",
    "Coronel Xavier Chaves",
    "Desterro do Melo",
    "Dores de Campos",
    "Entre Rios de Minas",
    "Ibertioga",
    "Lagoa Dourada",
    "Madre de Deus de Minas",
    "Nazareno",
    "Piedade do Rio Grande",
    "Prados",
    "Resende Costa",
    "Ressaquinha",
    "Santa Bárbara do Tugúrio",
    "Santa Cruz de Minas",
    "Santa Rita de Ibitipoca",
    "Santana do Garambéu",
    "Santos Dumont",
    "São João Del Rei",
    "São Tiago",
    "São Vicente de Minas",
    "Tiradentes"
  ]
};

export const BAIRROS_POR_CIDADE = {
  "São João Del Rei": [
    "Água Geral (Tejuco)",
    "Águas Férreas (Tejuco)",
    "Alto das Mercês",
    "Alto do Maquiné (Colônia do Marçal)",
    "Araçá",
    "Área Rural de São João Del Rei",
    "Barro Preto",
    "Bela Vista",
    "Bom Pastor",
    "Bonfim",
    "Caiçaras",
    "Cananéia",
    "Caquende",
    "Centro",
    "Cidade Nova",
    "Cidade Verde",
    "COHAB",
    "Colinas Del Rey",
    "Colônia do Giarola",
    "Colônia do Marçal",
    "Dom Bosco",
    "Fábricas",
    "Guarda-Mor",
    "Jardim América",
    "Jardim Colônia (Colônia do Marçal)",
    "Jardim Montese",
    "Jardim Paulo Campos",
    "Lava Pés",
    "Lombão",
    "Loteamento do Carmindo (Colônia do Marçal)",
    "Matozinhos",
    "Morro Grande",
    "Nascente do Sol (Colônia do Marçal)",
    "Nossa Senhora da Conceição",
    "Novo Horizonte",
    "Parque Real",
    "Parque São João Del Rei (Colônia do Marçal)",
    "Pio XII",
    "Portal Vila Rica (Colônia do Marçal)",
    "Rainha da Paz",
    "Recreio das Alterosas (Colônia do Marçal)",
    "Residencial Dom Lucas Moreira Neves",
    "Residencial Girassol",
    "Residencial Jardim Aeroporto",
    "Residencial Lenheiro",
    "Residencial Maquiné",
    "Residencial São José Operário (Tejuco)",
    "Rio Acima",
    "Risoleta Neves IF",
    "São Caetano",
    "São Francisco (Colônia do Marçal)",
    "São Geraldo",
    "São José Operário",
    "São Judas Tadeu",
    "São Pedro (Colônia do Marçal)",
    "Segredo",
    "Senhor dos Montes",
    "Solar da Serra (Colônia do Marçal)",
    "Tejuco",
    "Vale Nascente do Sol",
    "Várzea do Faria (Bonfim)",
    "Vila Belizário",
    "Vila Brasil",
    "Vila do Carmo (Colônia do Marçal)",
    "Vila Jardim Nossa Senhora de Fátima",
    "Vila Jardim São José",
    "Vila Jesus Silva",
    "Vila João Lombard (Fábricas)",
    "Vila Marchetti",
    "Vila Maria (Bonfim)",
    "Vila Militar",
    "Vila Santa Terezinha",
    "Vila Santo Antônio (Matozinhos)",
    "Vila São Bento",
    "Vila São Paulo (Fábricas)",
    "Vila São Vicente (Colônia do Marçal)"
  ],

  "Santa Cruz de Minas": ["Centro", "Porto Real", "Bela vista"]
};

/* ============================================================
   CATEGORIAS
============================================================ */
const categoriaOptions = [
  "Para Alugar",
  "Vitrine dos Sonhos",
  "Realize Essence",
  "Imóveis no Geral",
  "Imóveis na Planta",
  "Casa em Condomínio",
];

/* ============================================================
   CARACTERÍSTICAS — SEPARADAS EM: UNIDADE vs CONDOMÍNIO
============================================================ */
export const caracteristicasUnidade = [
  "Ar Condicionado",
  "Aquecimento Solar",
  "Acabamento em Porcelanato",
  "Acabamento em Laminado",
  "Box",
  "Iluminação em LED",
  "Jardim de Inverno",
  "Cerca Elétrica",
  "Canil",
  "Closet",
  "Telhado Colonial",
  "Poço Semi Artesiano",
  "Piscina Aquecida",
  "Móveis Planejados",
  "Energia Fotovoltaica",
  "Lareira",
  "Iluminação Planejada",
  "Pé Direito Alto",
  "Acabamento de Luxo",
  "Fechadura Eletrônica",
  "Automação Residencial",
  "Vista Panorâmica",
  "Acessibilidade PCD",
  "Portão Eletrônico",
  "Circuito de Segurança",
  "Sistema de Alarme",
  "CFTV",
  "Teto Rebaixado em Gesso",
  "Depósito Privativo",
  "Despensa",
  "Sala de TV",
  "Sala de Jantar",
  "Banheira / Hidromassagem",
  "Aquecedor a Gás",
  "Churrasqueira",
  "Varanda Gourmet",
  "Deck",
  "Jardim",
  "Spa",
  "Mirante",
];

export const caracteristicasCondominio = [
  "Playground",
  "Academia",
  "Salão de Festas",
  "Portaria",
  "Portaria 24h",
  "Segurança Interna",
  "Quadra Esportiva",
  "Brinquedoteca",
  "Piscina Coletiva",
  "Sauna",
  "Sala de Jogos",
  "Coworking",
  "Espaço Pet",
  "Bicicletário",
  "Lavanderia Coletiva",
  "Espaço Cinema",
  "Horta Comunitária",
  "Mini Mercado",
  "Gerador de Energia",
  "Vagas para Visitantes",
];


/* ============================================================
   OUTRAS CONFIGS
============================================================ */
const situacaoDocumentacaoOptions = [
  "Regular",
  "Em regularização",
  "Financiado",
  "Inventário",
  "Contrato de gaveta",
  "Outro",
];

const tipoOptions = [
  { label: "Casa", value: "casa" },
  { label: "Apartamento", value: "apartamento" },
  { label: "Terreno", value: "terreno" },
  { label: "Comercial", value: "comercial" },
  { label: "Rural", value: "rural" },
];

const statusOptions = [
  { label: "Disponível", value: "disponivel" },
  { label: "Reservado", value: "reservado" },
  { label: "Alugado", value: "alugado" },
  { label: "Vendido", value: "vendido" },
  { label: "Inativo", value: "inativo" },
];

const disponibilidadeOptions = [
  { label: "Venda", value: "venda" },
  { label: "Locação", value: "locacao" },
  { label: "Ambos", value: "ambos" },
];

/* ============================================================
   SLUGIFY
============================================================ */
function slugify(value) {
  if (!value) return "";
  return value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ImovelForm({ data = {}, onChange }) {
  const [form, setForm] = useState(() => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return {
      disponibilidade: data.disponibilidade ?? "venda",
      codigo_ref: data.codigo_ref ?? `RL-${random}`,
      observacoes: data.observacoes ?? "",
      ...data,
    };
  });

  const [personas, setPersonas] = useState([]);
  const [corretores, setCorretores] = useState([]);
  const [activeTab, setActiveTab] = useState("fisicas");

  const [autoTitulo, setAutoTitulo] = useState(!data?.titulo);
  const [autoSlug, setAutoSlug] = useState(!data?.slug);
  const [autoDescricao, setAutoDescricao] = useState(!data?.descricao);

  const didMount = useRef(false);

  // 🔄 Sync parent (controla loop infinito)
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    onChange?.(form);
  }, [form, onChange]);

  /* ============================================================
     LOAD PERSONAS
  ============================================================ */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const [resPersonas, resClientes] = await Promise.all([
          fetch("/api/perfis/list?type=personas&mode=select"),
          fetch("/api/perfis/list?type=clientes&mode=select"),
        ]);

        const { data: personasData } = await resPersonas.json();
        const { data: clientesData } = await resClientes.json();

        if (!alive) return;

        const list = [
          ...(Array.isArray(personasData) ? personasData : []),
          ...(Array.isArray(clientesData) ? clientesData : []),
        ];

        setPersonas(list);
      } catch (e) {
        setPersonas([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /* ============================================================
     LOAD CORRETORES
  ============================================================ */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/perfis/list?type=equipe&mode=select");
        const { data } = await res.json();

        if (!alive) return;

        const list = Array.isArray(data)
        ? data.filter((d) => ["corretor", "admin"].includes(d.role))
        : [];

        setCorretores(list);
      } catch (e) {
        setCorretores([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const gerarNomeImovel = useCallback((form) => {
    const tipo = tipoOptions.find((t) => t.value === form.tipo)?.label;
    if (!tipo) return "";

    const bairro = form.endereco_bairro;
    const cidade = form.endereco_cidade;
    const vibe = [];

    if (form.suites >= 2) vibe.push("alto padrão");
    if (form.area_total > 300) vibe.push("amplitude estonteante");
    if (form.caracteristicas_extras?.includes("Vista Panorâmica")) {
      vibe.push("vista de tirar o fôlego");
    }
    if (form.caracteristicas_extras?.includes("Lareira")) {
      vibe.push("toque acolhedor");
    }
    if (form.caracteristicas_extras?.includes("Aquecimento Solar")) {
      vibe.push("sustentabilidade");
    }

    const vibes = vibe.length ? ` – ${vibe.join(", ")}` : "";
    return `${tipo} no ${bairro || cidade || "localização privilegiada"}${vibes}`;
  }, []);

  const gerarTituloCurto = useCallback((form) => {
    const tipo = tipoOptions.find((t) => t.value === form.tipo)?.label;
    if (!tipo) return "";

    const bairro = form.endereco_bairro || form.endereco_cidade;
    return bairro ? `${tipo} • ${bairro}` : tipo;
  }, []);

  const gerarDescricao = useCallback((form) => {
    const extras = form.caracteristicas_extras?.slice(0, 4)?.join(", ");

    return `
  Um ${form.tipo || "imóvel"} com ${form.area_total || "?"}m² localizado em ${
      form.endereco_bairro || form.endereco_cidade || "região estratégica"
    }.

  Ambientes bem distribuídos, ${form.quartos || "?"} quarto(s), ${
      form.suites || "?"
    } suíte(s), pensado para quem busca conforto, funcionalidade e personalidade.

  Destaques: ${extras || "acabamentos selecionados com critério"}.
  `.trim();
  }, []);

  /* ============================================================
     HANDLERS
  ============================================================ */
  const handleChange = useCallback(
    (key, value) => {
      setForm((prev) => {
        let next = { ...prev, [key]: value };

        /* AUTO TÍTULO / CURTO */
        if (autoTitulo && key !== "titulo") {
          const novoTitulo = gerarNomeImovel(next);
          if (novoTitulo && novoTitulo !== next.titulo) {
            next.titulo = novoTitulo;
          }

          const curto = gerarTituloCurto(next);
          if (curto && curto !== next.titulo_curto) {
            next.titulo_curto = curto;
          }
        }

        /* AUTO DESCRIÇÃO */
        if (autoDescricao && key !== "descricao") {
          const desc = gerarDescricao(next);
          if (desc && desc !== next.descricao) {
            next.descricao = desc;
          }
        }

        /* AUTO SLUG */
        if (autoSlug && (key === "titulo" || autoTitulo)) {
          const novoSlug = slugify(next.titulo);
          if (novoSlug && novoSlug !== next.slug) {
            next.slug = novoSlug;
          }
        }

        /* DISPONIBILIDADE */
        if (key === "disponibilidade") {
          if (value === "venda") {
            next.preco_locacao = null;
            next.inquilino_id = null;
          }
          if (value === "locacao") {
            next.preco_venda = null;
          }
        }

        /* COMISSÕES */
        if (key === "tipo" || key === "disponibilidade") {
          const tipoAtual = key === "tipo" ? value : next.tipo;
          const dispAtual = key === "disponibilidade" ? value : next.disponibilidade;
          const isRural = tipoAtual === "rural";

          if (
            (dispAtual === "venda" || dispAtual === "ambos") &&
            !next.comissao_venda_percent
          ) {
            next.comissao_venda_percent = isRural ? 8 : 5;
          }

          if (
            (dispAtual === "locacao" || dispAtual === "ambos") &&
            !next.comissao_locacao_percent
          ) {
            next.comissao_locacao_percent = 8;
          }
        }

        /* CARACTERÍSTICAS FÍSICAS */
        if (key.startsWith("cf_")) {
          const field = key.replace("cf_", "");
          const current = next.caracteristicas_fisicas || {};

          next.caracteristicas_fisicas = {
            ...current,
            [field]:
              value === "" || value === null || Number.isNaN(Number(value))
                ? null
                : Number(value),
          };

          delete next[key];
        }

        /* CARACTERÍSTICAS EXTRAS */
        if (key === "caracteristicas_extras_toggle") {
          const { item, checked } = value || {};
          const current = Array.isArray(prev.caracteristicas_extras)
            ? prev.caracteristicas_extras
            : [];

          next.caracteristicas_extras = checked
            ? Array.from(new Set([...current, item]))
            : current.filter((c) => c !== item);

          delete next[key];
        }

        return next;
      });
    },
    [
      autoTitulo,
      autoDescricao,
      autoSlug,
      gerarNomeImovel,
      gerarTituloCurto,
      gerarDescricao,
    ]
  );

  const handleChangeNumero = useCallback(
    (key, value) => {
      const num = value === "" ? null : Number(value);
      handleChange(key, Number.isNaN(num) ? null : num);
    },
    [handleChange]
  );

  const handleChangeCheckboxExtra = useCallback(
    (item, checked) => {
      handleChange("caracteristicas_extras_toggle", { item, checked });
    },
    [handleChange]
  );

  const handleChangeCurrency = useCallback(
    (key, rawValue) => {
      const numericValue = parseCurrencyToNumber(rawValue);  // Converte o valor digitado para número
      handleChange(key, Number.isNaN(numericValue) ? null : numericValue);
  // Chama o handleChange com o valor convertido
    },
    [handleChange]
  );

  const handleChangeArea = useCallback(
    (key, rawValue) => {
      const numericValue = parseAreaToNumber(rawValue);
      handleChange(key, numericValue);
    },
    [handleChange]
  );

  const handleChangeCaracteristicaFisica = useCallback(
    (field, value) => {
      handleChange(`cf_${field}`, value === "" ? "" : Number(value));
    },
    [handleChange]
  );

  const handleCepBlur = useCallback(async () => {
    const cep = (form.endereco_cep || "").replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dataCep = await res.json();
      if (dataCep.erro) return;

      if (dataCep.logradouro) {
        handleChange("endereco_logradouro", dataCep.logradouro);
      }
      if (dataCep.bairro) {
        handleChange("endereco_bairro", dataCep.bairro);
      }
      if (dataCep.localidade) {
        handleChange("endereco_cidade", dataCep.localidade);
      }
      if (dataCep.uf) {
        handleChange("endereco_estado", dataCep.uf);
      }
    } catch (e) {
      // opcional: log ou toast
    }
  }, [form.endereco_cep, handleChange]);

  // Cálculo de comissão (mantido como estava)
  const comissaoVendaValor = useMemo(() => {
    if (!form.preco_venda || !form.comissao_venda_percent) return 0;
    return (Number(form.preco_venda) * Number(form.comissao_venda_percent)) / 100;
  }, [form.preco_venda, form.comissao_venda_percent]);

  const comissaoLocacaoValor = useMemo(() => {
    if (!form.preco_locacao || !form.comissao_locacao_percent) return 0;
    return (Number(form.preco_locacao) * Number(form.comissao_locacao_percent)) / 100;
  }, [form.preco_locacao, form.comissao_locacao_percent]);

  const estadoOptions = ESTADOS;

  const cidadeOptions = useMemo(() => {
    const uf = form.endereco_estado;
    const base = uf && CIDADES_POR_ESTADO[uf] ? [...CIDADES_POR_ESTADO[uf]] : [];
    const atual = form.endereco_cidade;
    if (atual && !base.includes(atual)) base.push(atual);
    return base;
  }, [form.endereco_estado, form.endereco_cidade]);

  const bairroOptions = useMemo(() => {
    const cidade = form.endereco_cidade;
    const base = cidade && BAIRROS_POR_CIDADE[cidade] ? [...BAIRROS_POR_CIDADE[cidade]] : [];
    const atual = form.endereco_bairro;
    if (atual && !base.includes(atual)) base.push(atual);
    return base;
  }, [form.endereco_cidade, form.endereco_bairro]);

  /* ============================================================
    SELECIONADOS — PARA EXIBIR TELEFONE (READ-ONLY)
  ============================================================ */

  const proprietarioSelecionado = useMemo(() => {
    return personas.find(
      (p) => p.value === String(form.proprietario_id)
    );
  }, [personas, form.proprietario_id]);

  const inquilinoSelecionado = useMemo(() => {
    return personas.find(
      (p) => p.value === String(form.inquilino_id)
    );
  }, [personas, form.inquilino_id]);

  const corretorSelecionado = useMemo(() => {
    return corretores.find(
      (c) => c.value === String(form.corretor_id)
    );
  }, [corretores, form.corretor_id]);

  const options1a10 = Array.from({ length: 10 }, (_, i) => i);

  /* ============================================================
     AQUI TERMINA A PRIMEIRA PARTE
     O RETURN COMEÇA AGORA — SÓ ENVIO QUANDO VOCÊ DER "OK"
  ============================================================ */
  return (
    <Card className="space-y-6">
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle>Dados do Imóvel</CardTitle>

          {/* Toggle Venda / Locação / Ambos */}
          <div
            className={`
              inline-flex overflow-hidden rounded-full border
              border-gray-300 dark:border-neutral-700
              bg-white dark:bg-neutral-800
            `}
          >
            {disponibilidadeOptions.map((opt) => {
              const isActive = form.disponibilidade === opt.value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange("disponibilidade", opt.value)}
                  className={`
                    px-4 py-1.5 text-sm md:text-base font-medium transition-colors
                    border-l first:border-l-0 last:border-r-0
                    border-gray-300 dark:border-neutral-700
                    ${
                      isActive
                        ? "bg-accent text-white"
                        : "bg-white text-black dark:bg-neutral-800 dark:text-white"
                    }
                  `}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Info básica: Proprietário, Corretor, Tipo, Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
          <div>
            <Label>Proprietário</Label>
            <SearchableSelect
              options={personas}
              value={form.proprietario_id ? String(form.proprietario_id) : ""}
              onChange={(val) => handleChange("proprietario_id", val || null)}
            />

            {(proprietarioSelecionado?.telefone ||
              proprietarioSelecionado?.contato_telefone) && (
              <p className="mt-1 text-sm text-gray-500">
                {formatPhoneBR(
                  proprietarioSelecionado.telefone ||
                  proprietarioSelecionado.contato_telefone
                )}
              </p>
            )}
          </div>

          <div>
            <Label>Corretor Responsável</Label>
            <SearchableSelect
              options={corretores}
              value={form.corretor_id ? String(form.corretor_id) : ""}
              onChange={(val) => handleChange("corretor_id", val || null)}
            />

            {(corretorSelecionado?.telefone || corretorSelecionado?.contato_telefone) && (
              <p className="mt-1 text-sm text-gray-500">
                {formatPhoneBR(
                  corretorSelecionado.telefone ||
                  corretorSelecionado.contato_telefone
                )}
              </p>
            )}
          </div>

          <div>
            <Label>Tipo de Imóvel</Label>
            <Select
              value={form.tipo ?? ""}
              onChange={(e) => handleChange("tipo", e.target.value)}
            >
              <option value="" hidden>
                Selecione...
              </option>
              {tipoOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>

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
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tabs de seção */}
        <div className="flex flex-wrap gap-2 border-b pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("fisicas")}
            className={`px-3 py-1 rounded-t-md text-sm md:text-base border-b-2 ${
              activeTab === "fisicas"
                ? "border-accent text-accent"
                : "border-transparent text-gray-600 dark:text-gray-300"
            }`}
          >
            Características físicas
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("financeiro")}
            className={`px-3 py-1 rounded-t-md text-sm md:text-base border-b-2 ${
              activeTab === "financeiro"
                ? "border-accent text-accent"
                : "border-transparent text-gray-600 dark:text-gray-300"
            }`}
          >
            Financeiro
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("documentacao")}
            className={`px-3 py-1 rounded-t-md text-sm md:text-base border-b-2 ${
              activeTab === "documentacao"
                ? "border-accent text-accent"
                : "border-transparent text-gray-600 dark:text-gray-300"
            }`}
          >
            Documentação
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("texto")}
            className={`px-3 py-1 rounded-t-md text-sm md:text-base border-b-2 ${
              activeTab === "texto"
                ? "border-accent text-accent"
                : "border-transparent text-gray-600 dark:text-gray-300"
            }`}
          >
            Título & descrição
          </button>
        </div>

        {/* =======================================================
            TAB: CARACTERÍSTICAS FÍSICAS
        ======================================================== */}
        {activeTab === "fisicas" && (
          <div className="space-y-6">
            {/* ENDEREÇO */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm md:text-base">Endereço</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>CEP</Label>
                  <Input
                    value={form.endereco_cep || ""}
                    onChange={(e) =>
                      handleChange("endereco_cep", e.target.value)
                    }
                    onBlur={handleCepBlur}
                    placeholder="Somente números"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={form.endereco_logradouro || ""}
                    onChange={(e) =>
                      handleChange("endereco_logradouro", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>Número</Label>
                  <Input
                    value={form.endereco_numero || ""}
                    onChange={(e) =>
                      handleChange("endereco_numero", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Estado (UF)</Label>
                  <Select
                    value={form.endereco_estado || ""}
                    onChange={(e) => {
                      const uf = e.target.value;

                      handleChange("endereco_estado", uf);
                      handleChange("endereco_cidade", "");
                      handleChange("endereco_bairro", "");
                    }}
                  >
                    <option value="" hidden>
                      Selecione...
                    </option>
                    {estadoOptions.map((uf) => (
                      <option key={uf.sigla} value={uf.sigla}>
                        {uf.sigla} - {uf.nome}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Cidade</Label>
                  <Select
                    value={form.endereco_cidade || ""}
                    onChange={(e) => {
                      const cidade = e.target.value;

                      handleChange("endereco_cidade", cidade);
                      handleChange("endereco_bairro", "");
                    }}
                  >
                    <option value="" hidden>
                      Selecione...
                    </option>
                    {cidadeOptions.map((cidade) => (
                      <option key={cidade} value={cidade}>
                        {cidade}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Bairro</Label>
                  <Select
                    value={form.endereco_bairro || ""}
                    onChange={(e) =>
                      handleChange("endereco_bairro", e.target.value)
                    }
                  >
                    <option value="" hidden>
                      Selecione...
                    </option>
                    {bairroOptions.map((bairro) => (
                      <option key={bairro} value={bairro}>
                        {bairro}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            {/* ÁREAS */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm md:text-base">
                Áreas e dimensões
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Área Total (m²)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={formatArea(form.area_total)}
                    onChange={(e) =>
                      handleChangeArea("area_total", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>Área Construída (m²)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={formatArea(form.area_construida)}
                    onChange={(e) =>
                      handleChangeArea("area_construida", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>Testada (m)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={formatArea(form.testada)}
                    onChange={(e) =>
                      handleChangeArea("testada", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>Profundidade (m)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={formatArea(form.profundidade)}
                    onChange={(e) =>
                      handleChangeArea("profundidade", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* DORMITÓRIOS / BANHEIROS / VAGAS */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm md:text-base">
                Dormitórios e banheiros
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Quartos</Label>
                  <Select
                    value={form.quartos ?? ""}
                    onChange={(e) =>
                      handleChangeNumero("quartos", e.target.value)
                    }
                  >
                    <option value="" hidden>
                      Selecione...
                    </option>
                    {options1a10.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Suítes</Label>
                  <Select
                    value={form.suites ?? ""}
                    onChange={(e) =>
                      handleChangeNumero("suites", e.target.value)
                    }
                  >
                    <option value="" hidden>
                      Selecione...
                    </option>
                    {options1a10.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Banheiros</Label>
                  <Select
                    value={form.banheiros ?? ""}
                    onChange={(e) =>
                      handleChangeNumero("banheiros", e.target.value)
                    }
                  >
                    <option value="" hidden>
                      Selecione...
                    </option>
                    {options1a10.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label>Vagas de Garagem</Label>
                  <Select
                    value={form.vagas_garagem ?? ""}
                    onChange={(e) =>
                      handleChangeNumero("vagas_garagem", e.target.value)
                    }
                  >
                    <option value="" hidden>
                      Selecione...
                    </option>
                    {options1a10.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            {/* AMBIENTES DETALHADOS (JSONB) */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm md:text-base">
                Ambientes (1 a 10) – detalhado
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* SALAS */}
                <div>
                  <Label>Sala(s)</Label>
                  <Select
                    value={form.caracteristicas_fisicas?.sala ?? ""}
                    onChange={(e) =>
                      handleChangeCaracteristicaFisica("sala", e.target.value)
                    }
                  >
                    <option value="" hidden>Selecione...</option>
                    {options1a10.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </Select>
                </div>

                {/* QUARTOS / SUÍTES / CLOSET */}
                <div>
                  <Label>Closet(s)</Label>
                  <Select
                    value={form.caracteristicas_fisicas?.closet ?? ""}
                    onChange={(e) =>
                      handleChangeCaracteristicaFisica("closet", e.target.value)
                    }
                  >
                    <option value="" hidden>Selecione...</option>
                    {options1a10.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </Select>
                </div>

                {/* BANHEIROS */}
                <div>
                  <Label>Lavabo(s)</Label>
                  <Select
                    value={form.caracteristicas_fisicas?.lav ?? ""}
                    onChange={(e) => handleChangeCaracteristicaFisica("lav", e.target.value)}
                  >
                    <option value="" hidden>Selecione...</option>
                    {options1a10.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </Select>
                </div>

                {/* COZINHA / COPA */}
                <div>
                  <Label>Cozinha(s)</Label>
                  <Select
                    value={form.caracteristicas_fisicas?.cozinha ?? ""}
                    onChange={(e) => handleChangeCaracteristicaFisica("cozinha", e.target.value)}
                  >
                    <option value="" hidden>Selecione...</option>
                    {options1a10.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </Select>
                </div>

                <div>
                  <Label>Copa(s)</Label>
                  <Select
                    value={form.caracteristicas_fisicas?.copa ?? ""}
                    onChange={(e) => handleChangeCaracteristicaFisica("copa", e.target.value)}
                  >
                    <option value="" hidden>Selecione...</option>
                    {options1a10.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </Select>
                </div>

                {/* ÁREA DE SERVIÇO / LAVANDERIA */}
                <div>
                  <Label>Área de Serviço</Label>
                  <Select
                    value={form.caracteristicas_fisicas?.area_servico ?? ""}
                    onChange={(e) =>
                      handleChangeCaracteristicaFisica("area_servico", e.target.value)
                    }
                  >
                    <option value="" hidden>Selecione...</option>
                    {options1a10.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </Select>
                </div>

                <div>
                  <Label>Lavanderia</Label>
                  <Select
                    value={form.caracteristicas_fisicas?.lavanderia ?? ""}
                    onChange={(e) =>
                      handleChangeCaracteristicaFisica("lavanderia", e.target.value)
                    }
                  >
                    <option value="" hidden>Selecione...</option>
                    {options1a10.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </Select>
                </div>

                {/* VARANDAS */}
                <div>
                  <Label>Varanda(s)</Label>
                  <Select
                    value={form.caracteristicas_fisicas?.varanda ?? ""}
                    onChange={(e) =>
                      handleChangeCaracteristicaFisica("varanda", e.target.value)
                    }
                  >
                    <option value="" hidden>Selecione...</option>
                    {options1a10.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </Select>
                </div>

                {/* ESCRITÓRIO */}
                <div>
                  <Label>Escritório(s)</Label>
                  <Select
                    value={form.caracteristicas_fisicas?.escritorio ?? ""}
                    onChange={(e) =>
                      handleChangeCaracteristicaFisica("escritorio", e.target.value)
                    }
                  >
                    <option value="" hidden>Selecione...</option>
                    {options1a10.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </Select>
                </div>

                <div>
                  <Label>Quintal(is)</Label>
                  <Select
                    value={form.caracteristicas_fisicas?.quintal ?? ""}
                    onChange={(e) =>
                      handleChangeCaracteristicaFisica("quintal", e.target.value)
                    }
                  >
                    <option value="" hidden>Selecione...</option>
                    {options1a10.map((n) => (<option key={n} value={n}>{n}</option>))}
                  </Select>
                </div>
              </div>
            </div>

            {/* PET FRIENDLY, MOBILIADO, ELEVADOR, PISCINA, ÁREA GOURMET */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm md:text-base">Conveniências</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* PET FRIENDLY */}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!form.pet_friendly}
                    onCheckedChange={(v) => handleChange("pet_friendly", v)}
                  />
                  <Label>Pet Friendly</Label>
                </div>

                {/* MOBILIADO */}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!form.mobiliado}
                    onCheckedChange={(v) => handleChange("mobiliado", v)}
                  />
                  <Label>Mobiliado</Label>
                </div>

                {/* ELEVADOR */}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!form.elevador}
                    onCheckedChange={(v) => handleChange("elevador", v)}
                  />
                  <Label>Elevador</Label>
                </div>

                {/* PISCINA */}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!form.piscina}
                    onCheckedChange={(v) => handleChange("piscina", v)}
                  />
                  <Label>Piscina</Label>
                </div>

                {/* ÁREA GOURMET */}
                <div className="flex items-center gap-3">
                  <Switch
                    checked={!!form.area_gourmet}
                    onCheckedChange={(v) => handleChange("area_gourmet", v)}
                  />
                  <Label>Área Gourmet</Label>
                </div>

              </div>
            </div>  

            {/* CARACTERÍSTICAS EXTRAS */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm md:text-base">Características adicionais</h3>

              <details className="group border rounded-2xl p-4">
                <summary className="font-medium flex items-center justify-between cursor-pointer">
                  <span>Selecionar características</span>
                  <svg className="w-5 h-5 transition-transform group-open:rotate-180" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>

                <div className="mt-4 space-y-6">
                  {/* BLOCO: CARACTERÍSTICAS DO IMÓVEL */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Características do Imóvel</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {caracteristicasUnidade.map((item) => {
                        const checked =
                          Array.isArray(form.caracteristicas_extras) &&
                          form.caracteristicas_extras.includes(item);

                        return (
                          <label
                            key={item}
                            className="flex items-center gap-3 cursor-pointer p-3 rounded-xl"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                handleChangeCheckboxExtra(item, e.target.checked)
                              }
                              className="
                                peer h-5 w-5 cursor-pointer appearance-none rounded
                                border border-gray-400 transition-all
                                checked:bg-accent checked:border-accent
                                checked:before:block checked:before:content-['✔']
                                checked:before:text-white checked:before:text-sm
                              "
                            />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* BLOCO: CARACTERÍSTICAS DO CONDOMÍNIO */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Características do Condomínio</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {caracteristicasCondominio.map((item) => {
                        const checked =
                          Array.isArray(form.caracteristicas_extras) &&
                          form.caracteristicas_extras.includes(item);

                        return (
                          <label
                            key={item}
                            className="flex items-center gap-3 cursor-pointer p-3 rounded-xl"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                handleChangeCheckboxExtra(item, e.target.checked)
                              }
                              className="
                                peer h-5 w-5 cursor-pointer appearance-none rounded
                                border border-gray-400 transition-all
                                checked:bg-accent checked:border-accent
                                checked:before:block checked:before:content-['✔']
                                checked:before:text-white checked:before:text-sm
                              "
                            />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </details>
            </div>

            {/* OBSERVAÇÕES */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={form.observacoes || ""}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                placeholder="Anotações internas, detalhes importantes, contexto do imóvel..."
              />
            </div>

            {/* Nome do Condomínio */}
            <div className="space-y-2">
              <Label>Nome do Condomínio (opcional)</Label>
              <Input
                value={form.condominio || ""}
                onChange={(e) => handleChange("condominio", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* =======================================================
            TAB: FINANCEIRO
        ======================================================== */}
        {activeTab === "financeiro" && (
          <div className="space-y-6">
            {(form.disponibilidade === "venda" || form.disponibilidade === "ambos") && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm md:text-base">Venda</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Preço de Venda (R$)</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"  // Placeholder que indica o formato
                      value={form.preco_venda ? formatBRL(form.preco_venda) : ""}  // Exibe o valor formatado
                      onChange={(e) => handleChangeCurrency("preco_venda", e.target.value)}  // Chama o handler para tratar a mudança
                    />
                  </div>

                  <div>
                    <Label>Comissão de Venda (%)</Label>
                    <Select
                      value={form.comissao_venda_percent ?? ""}
                      onChange={(e) =>
                        handleChangeNumero("comissao_venda_percent", e.target.value)
                      }
                    >
                      <option value="" hidden>Selecione...</option>
                      {(form.tipo === "rural" ? [8,9,10] : [5,6,7]).map((p) => (
                        <option key={p} value={p}>{p}%</option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <Label>Valor da Comissão (R$)</Label>
                    <Input
                      readOnly
                      value={
                        comissaoVendaValor
                          ? comissaoVendaValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : ""
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {(form.disponibilidade === "locacao" || form.disponibilidade === "ambos") && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm md:text-base">Locação</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Preço de Locação (R$)</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="R$ 0,00"
                      value={
                        form.preco_locacao
                          ? formatBRL(form.preco_locacao)
                          : ""
                      }
                      onChange={(e) =>
                        handleChangeCurrency("preco_locacao", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label>Comissão de Locação (%)</Label>
                    <Select
                      value={form.comissao_locacao_percent ?? ""}
                      onChange={(e) =>
                        handleChangeNumero("comissao_locacao_percent", e.target.value)
                      }
                    >
                      <option value="" hidden>Selecione...</option>
                      {[8,9,10].map((p) => (<option key={p} value={p}>{p}%</option>))}
                    </Select>
                  </div>

                  <div>
                    <Label>Valor da Comissão (R$)</Label>
                    <Input
                      readOnly
                      value={
                        comissaoLocacaoValor
                          ? comissaoLocacaoValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                          : ""
                      }
                    />
                  </div>
                </div>

                {(form.disponibilidade === "locacao" ||
                  form.disponibilidade === "ambos" ||
                  form.status === "alugado") && (
                  <div className="grid grid-cols-1 md:grid-cols-3">
                    <div>
                      <Label>Inquilino</Label>
                      <SearchableSelect
                        options={personas}
                        value={form.inquilino_id ? String(form.inquilino_id) : ""}
                        onChange={(val) => handleChange("inquilino_id", val || null)}
                      />

                      {(inquilinoSelecionado?.telefone || inquilinoSelecionado?.contato_telefone) && (
                        <p className="mt-1 text-sm text-gray-500">
                          {formatPhoneBR(
                            inquilinoSelecionado.telefone ||
                            inquilinoSelecionado.contato_telefone
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Encargos */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm md:text-base">Encargos</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Valor Condomínio (R$)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={
                      form.valor_condominio
                        ? formatBRL(form.valor_condominio)
                        : ""
                    }
                    onChange={(e) =>
                      handleChangeCurrency("valor_condominio", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>Valor IPTU (R$)</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="R$ 0,00"
                    value={
                      form.valor_iptu
                        ? formatBRL(form.valor_iptu)
                        : ""
                    }
                    onChange={(e) =>
                      handleChangeCurrency("valor_iptu", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB: DOCUMENTAÇÃO
        ======================================================== */}
        {activeTab === "documentacao" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm md:text-base">Situação da documentação</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Situação</Label>
                  <Select
                    value={form.situacao_documentacao || ""}
                    onChange={(e) => handleChange("situacao_documentacao", e.target.value)}
                  >
                    <option value="" hidden>Selecione...</option>
                    {situacaoDocumentacaoOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </Select>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <Switch
                    checked={!!form.aceita_permuta}
                    onCheckedChange={(v) => handleChange("aceita_permuta", v)}
                  />
                  <Label>Aceita permuta</Label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm md:text-base">Controle de chaves</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Localização da Chave</Label>
                  <Input
                    value={form.chaves_localizacao || ""}
                    onChange={(e) => handleChange("chaves_localizacao", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            TAB: TÍTULO & DESCRIÇÃO
        ======================================================== */}
        {activeTab === "texto" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label>Título</Label>
                <Input
                  value={form.titulo || ""}
                  onChange={(e) => {
                    setAutoTitulo(false);
                    handleChange("titulo", e.target.value);
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug || ""}
                  onChange={(e) => {
                    setAutoSlug(false);
                    handleChange("slug", e.target.value);
                  }}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Título Curto</Label>
                <Input
                  value={form.titulo_curto || ""}
                  onChange={(e) => handleChange("titulo_curto", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao || ""}
                onChange={(e) => {
                  setAutoDescricao(false);
                  handleChange("descricao", e.target.value);
                }}
                placeholder="Descrição completa do imóvel"
              />
            </div>

            {/* CATEGORIAS */}
            <div className="space-y-2">
              <Label>Categorias</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {categoriaOptions.map((cat) => {
                  const normalized = cat.toLowerCase();
                  const checked = form.categorias?.includes(normalized) || false;

                  return (
                    <label
                      key={cat}
                      className="flex items-center gap-3 p-2 rounded-xl cursor-pointer hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          let next = form.categorias ? [...form.categorias] : [];

                          if (isChecked) {
                            if (!next.includes(normalized)) next.push(normalized);
                          } else {
                            next = next.filter((c) => c !== normalized);
                          }

                          handleChange("categorias", next);
                        }}
                        className="
                            peer h-5 w-5 cursor-pointer appearance-none rounded
                            border border-gray-400 transition-all

                            checked:bg-accent               /* usa sua variável de cor */
                            checked:border-accent
                            checked:before:block
                            checked:before:content-['✔']    /* check branco */
                            checked:before:text-white
                            checked:before:text-sm
                            hover:border-accent
                          "
                      />
                      <span>{cat}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
