"use client";
import { cn } from "@/lib/utils";

/**
 * 🔹 Badge Global
 * Cobre: CRM, Leads, Imóveis, Financeiro, Agenda e Papéis
 * Segue o padrão de estilo do painel de perfis (leads, imóveis etc.)
 */
export default function Badge({ status, children, variant = "soft", className }) {
  const value = (status || children || "")
  .toString()
  .trim()
  .normalize("NFD") // remove acentos tipo "Reunião" -> "reuniao"
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replaceAll(" ", "_");


  // === ENUMS / MAPAS DE CORES GLOBAIS ===
  const COLORS = {
    // 👤 Perfis / Roles
    admin: "emerald",
    corretor: "purple",

    // 💼 Status Gerais
    ativo: "emerald",
    inativo: "gray",
    pendente: "amber",
    pago: "emerald",
    atrasado: "red",
    reservado: "amber",
    vendido: "blue",
    alugado: "purple",
    disponivel: "emerald",

    // 💬 Leads (CRM)
    novo: "sky",
    qualificado: "indigo",
    visita_agendada: "amber",
    proposta_feita: "emerald",
    documentacao: "purple",
    concluido: "emerald",
    perdido: "red",

    // 🧾 Financeiro / Transações
    taxa_adm_imobiliaria: "blue",
    repasse_proprietario: "emerald",
    comissao_corretor: "indigo",
    despesa_manutencao: "orange",
    pagamento_iptu: "amber",
    pagamento_condominio: "teal",
    pago: "esmerald",

    // 📅 Agenda — Tipos de Evento
    visita_presencial: "emerald",
    visita_virtual: "sky",
    reuniao: "blue",
    follow_up: "amber",
    tecnico: "orange",
    administrativo: "gray",
    outro: "purple",

    // 📆 Agenda — Status Operacionais
    agendado: "sky",
    em_andamento: "blue",
    concluido_evento: "emerald",
    cancelado: "red",
    adiado: "amber",
    hoje: "indigo",
    futuro: "sky",
    encerrado: "gray",
  };

  const color = COLORS[value] || "gray";

  // === VARIANTES ===
  const base =
    "inline-flex items-center justify-center rounded-full text-xs font-semibold px-3 py-1 select-none whitespace-nowrap transition";

  const variants = {
    soft: `bg-${color}-500/15 text-${color}-700 border border-${color}-400/30`,
    solid: `bg-${color}-600 text-white`,
    outline: `border border-${color}-500 text-${color}-700 bg-transparent`,
  };

  return (
    <span className={cn(base, variants[variant], className)}>
      {status || children}
    </span>
  );
}
