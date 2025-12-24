import { cn } from "@/lib/utils";

const statusConfig = {
  // --- STATUS IMÓVEL ---
  disponivel: "bg-emerald-200 text-emerald-800 border-emerald-300 dark:bg-emerald-700 dark:text-emerald-100 dark:border-emerald-500",
  reservado: "bg-amber-200 text-amber-800 border-amber-300 dark:bg-amber-700 dark:text-amber-100 dark:border-amber-500",
  alugado: "bg-indigo-200 text-indigo-800 border-indigo-300 dark:bg-indigo-700 dark:text-indigo-100 dark:border-indigo-500",
  vendido: "bg-violet-200 text-violet-800 border-violet-300 dark:bg-violet-700 dark:text-violet-100 dark:border-violet-500",
  inativo: "bg-red-200 text-red-800 border-red-300 dark:bg-red-700 dark:text-red-100 dark:border-red-500",

  // --- STATUS LEAD (FUNIL) ---
  novo: "bg-sky-200 text-sky-800 border-sky-300 dark:bg-sky-700 dark:text-sky-100 dark:border-sky-500",
  qualificado: "bg-fuchsia-200 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-700 dark:text-fuchsia-100 dark:border-fuchsia-500",
  visita_agendada: "bg-teal-200 text-teal-800 border-teal-300 dark:bg-teal-700 dark:text-teal-100 dark:border-teal-500",
  proposta_feita: "bg-pink-200 text-pink-800 border-pink-300 dark:bg-pink-700 dark:text-pink-100 dark:border-pink-500",
  documentacao: "bg-cyan-200 text-cyan-800 border-cyan-300 dark:bg-cyan-700 dark:text-cyan-100 dark:border-cyan-500",
  concluido: "bg-green-200 text-green-800 border-green-300 dark:bg-green-700 dark:text-green-100 dark:border-green-500",
  perdido: "bg-rose-200 text-rose-800 border-rose-300 dark:bg-rose-700 dark:text-rose-100 dark:border-rose-500",

  // --- CONTRATOS ---
locacao: "bg-teal-300 text-teal-900 border-teal-400 dark:bg-teal-700 dark:text-teal-100 dark:border-teal-500",
venda: "bg-purple-300 text-purple-900 border-purple-400 dark:bg-purple-700 dark:text-purple-100 dark:border-purple-500",
administracao: "bg-orange-300 text-orange-900 border-orange-400 dark:bg-orange-700 dark:text-orange-100 dark:border-orange-500",
renovado: "bg-lime-300 text-lime-900 border-lime-400 dark:bg-lime-700 dark:text-lime-100 dark:border-lime-500",
encerrado: "bg-rose-300 text-rose-900 border-rose-400 dark:bg-rose-700 dark:text-rose-100 dark:border-rose-500",

  // --- TRANSAÇÃO / FINANCEIRO ---
  pendente: "bg-yellow-200 text-yellow-800 border-yellow-300 dark:bg-yellow-700 dark:text-yellow-900 dark:border-yellow-500",
  pago: "bg-emerald-300 text-emerald-900 border-emerald-400 dark:bg-emerald-700 dark:text-emerald-100 dark:border-emerald-500",
  atrasado: "bg-red-200 text-red-900 border-red-300 dark:bg-red-800 dark:text-red-100 dark:border-red-500",
  cancelado: "bg-pink-200 text-pink-900 border-pink-300 dark:bg-pink-700 dark:text-pink-100 dark:border-pink-500",

  // Tipos de Transação
  receita_aluguel: "bg-lime-200 text-lime-900 border-lime-300 dark:bg-lime-700 dark:text-lime-100 dark:border-lime-500",
  taxa_adm_imobiliaria: "bg-orange-200 text-orange-900 border-orange-300 dark:bg-orange-700 dark:text-orange-100 dark:border-orange-500",
  repasse_proprietario: "bg-indigo-200 text-indigo-900 border-indigo-300 dark:bg-indigo-700 dark:text-indigo-100 dark:border-indigo-500",
  comissao_corretor: "bg-purple-200 text-purple-900 border-purple-300 dark:bg-purple-700 dark:text-purple-100 dark:border-purple-500",
  despesa_manutencao: "bg-rose-200 text-rose-900 border-rose-300 dark:bg-rose-700 dark:text-rose-100 dark:border-rose-500",
  pagamento_iptu: "bg-yellow-300 text-yellow-900 border-yellow-400 dark:bg-yellow-700 dark:text-yellow-100 dark:border-yellow-500",
  pagamento_condominio: "bg-cyan-300 text-cyan-900 border-cyan-400 dark:bg-cyan-700 dark:text-cyan-100 dark:border-cyan-500",
  receita_venda_imovel: "bg-purple-200 text-purple-900 border-purple-300 dark:bg-purple-700 dark:text-purple-100 dark:border-purple-500",

  // --- VACÂNCIA (NOVOS STATUS) ---
  sem_contrato: "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500",
  contrato_ativo: "bg-emerald-200 text-emerald-800 border-emerald-300 dark:bg-emerald-700 dark:text-emerald-100 dark:border-emerald-500",
  em_vacancia: "bg-rose-200 text-rose-800 border-rose-300 dark:bg-rose-700 dark:text-rose-100 dark:border-rose-500",
  vacancia_leve: "bg-emerald-200 text-emerald-800 border-emerald-300 dark:bg-emerald-700 dark:text-emerald-100 dark:border-emerald-500",
  vacancia_moderada: "bg-amber-200 text-amber-800 border-amber-300 dark:bg-amber-700 dark:text-amber-100 dark:border-amber-500",
  vacancia_grave: "bg-red-200 text-red-800 border-red-300 dark:bg-red-700 dark:text-red-100 dark:border-red-500",

// --- STATUS COMPLIANCE ---
  valido: "bg-emerald-200 text-emerald-800 border-emerald-300 dark:bg-emerald-700 dark:text-emerald-100 dark:border-emerald-500",
  vencido: "bg-red-200 text-red-800 border-red-300 dark:bg-red-700 dark:text-red-100 dark:border-red-500",

  // Tipos de documento (Compliance)
  laudo: "bg-sky-200 text-sky-900 border-sky-300 dark:bg-sky-700 dark:text-sky-100 dark:border-sky-500",
  art: "bg-indigo-200 text-indigo-900 border-indigo-300 dark:bg-indigo-700 dark:text-indigo-100 dark:border-indigo-500",
  avcb: "bg-rose-200 text-rose-900 border-rose-300 dark:bg-rose-700 dark:text-rose-100 dark:border-rose-500",
  habite_se: "bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-700 dark:text-amber-100 dark:border-amber-500",
 
  // --- STATUS CONTRATO (NOVO ENUM + HARMONIZAÇÃO TOTAL) ---
  em_elaboracao: "bg-sky-200 text-sky-900 border-sky-300 dark:bg-sky-700 dark:text-sky-100 dark:border-sky-500",
  aguardando_assinatura: "bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-700 dark:text-amber-100 dark:border-amber-500",
  assinado: "bg-green-300 text-green-900 border-green-400 dark:bg-green-700 dark:text-green-100 dark:border-green-500",
  vigente: "bg-emerald-300 text-emerald-900 border-emerald-400 dark:bg-emerald-700 dark:text-emerald-100 dark:border-emerald-500",
  ativo: "bg-emerald-200 text-emerald-900 border-emerald-300 dark:bg-emerald-700 dark:text-emerald-100 dark:border-emerald-500",
  reajuste_pendente: "bg-purple-300 text-purple-900 border-purple-400 dark:bg-purple-700 dark:text-purple-100 dark:border-purple-500",
  renovacao_pendente: "bg-indigo-300 text-indigo-900 border-indigo-400 dark:bg-indigo-700 dark:text-indigo-100 dark:border-indigo-500",
  renovado: "bg-lime-300 text-lime-900 border-lime-400 dark:bg-lime-700 dark:text-lime-100 dark:border-lime-500",
  encerrado: "bg-rose-300 text-rose-900 border-rose-400 dark:bg-rose-700 dark:text-rose-100 dark:border-rose-500",
  rescindido: "bg-red-300 text-red-900 border-red-400 dark:bg-red-700 dark:text-red-100 dark:border-red-500",
  cancelado: "bg-pink-300 text-pink-900 border-pink-400 dark:bg-pink-700 dark:text-pink-100 dark:border-pink-500",

  // --- STATUS OS (MANUTENÇÃO) ---
  aberta: "bg-blue-200 text-blue-900 border-blue-300 dark:bg-blue-700 dark:text-blue-100 dark:border-blue-500",
  orcamento: "bg-purple-200 text-purple-900 border-purple-300 dark:bg-purple-700 dark:text-purple-100 dark:border-purple-500",
  aprovada_pelo_inquilino: "bg-teal-300 text-teal-900 border-teal-400 dark:bg-teal-700 dark:text-teal-100 dark:border-teal-500",
  aprovada_pelo_proprietario: "bg-indigo-300 text-indigo-900 border-indigo-400 dark:bg-indigo-700 dark:text-indigo-100 dark:border-indigo-500",
  em_execucao: "bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-700 dark:text-amber-100 dark:border-amber-500 animate-pulse",
  concluida: "bg-green-300 text-green-900 border-green-400 dark:bg-green-700 dark:text-green-100 dark:border-green-500",
  cancelada: "bg-red-200 text-red-900 border-red-300 dark:bg-red-700 dark:text-red-100 dark:border-red-500",

  // --- STATUS PROPOSTA ---
  pendente: "bg-amber-200 text-amber-800 border-amber-300 dark:bg-amber-700 dark:text-amber-100 dark:border-amber-500",
  aceita: "bg-green-300 text-green-900 border-green-400 dark:bg-green-700 dark:text-green-100 dark:border-green-500",
  recusada: "bg-rose-200 text-rose-800 border-rose-300 dark:bg-rose-700 dark:text-rose-100 dark:border-rose-500",
  contraproposta: "bg-indigo-200 text-indigo-800 border-indigo-300 dark:bg-indigo-700 dark:text-indigo-100 dark:border-indigo-500",

  // --- LABELS GENÉRICOS ---
  admin: "bg-purple-300 text-purple-900 border-purple-400 dark:bg-purple-700 dark:text-purple-100 dark:border-purple-500",
  corretor: "bg-cyan-300 text-cyan-900 border-cyan-400 dark:bg-cyan-700 dark:text-cyan-100 dark:border-cyan-500",
  proprietario: "bg-emerald-300 text-emerald-900 border-emerald-400 dark:bg-emerald-700 dark:text-emerald-100 dark:border-emerald-500",
  inquilino: "bg-amber-300 text-amber-900 border-amber-400 dark:bg-amber-700 dark:text-amber-100 dark:border-amber-500",
  cliente: "bg-pink-300 text-pink-900 border-pink-400 dark:bg-pink-700 dark:text-pink-100 dark:border-pink-500",

  // --- EVENTOS CRM ---
  visita_presencial: "bg-emerald-200 text-emerald-900 border-emerald-300 dark:bg-emerald-700 dark:text-emerald-100 dark:border-emerald-500",
  visita_virtual: "bg-sky-200 text-sky-900 border-sky-300 dark:bg-sky-700 dark:text-sky-100 dark:border-sky-500",
  reuniao: "bg-violet-200 text-violet-900 border-violet-300 dark:bg-violet-700 dark:text-violet-100 dark:border-violet-500",
  follow_up: "bg-amber-200 text-amber-900 border-amber-300 dark:bg-amber-700 dark:text-amber-100 dark:border-amber-500",
  administrativo: "bg-blue-200 text-blue-900 border-blue-300 dark:bg-blue-700 dark:text-blue-100 dark:border-blue-500",
  tecnico: "bg-rose-200 text-rose-900 border-rose-300 dark:bg-rose-700 dark:text-rose-100 dark:border-rose-500",
  outro: "bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500",
  // Fallback
  default: "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-700 dark:text-blue-100 dark:border-blue-500",

  manual: "bg-emerald-200 text-emerald-900 border-emerald-300 dark:bg-emerald-700 dark:text-emerald-100 dark:border-emerald-500",
  automatica: "bg-slate-200 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-500",
};

export default function Badge({ status, children, className }) {
  const statusKey = status?.toString().toLowerCase().replace(/ /g, "_") || "default";
  const styleClass = statusConfig[statusKey] || statusConfig.default;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        "rounded-full px-2.5 py-0.5",
        "text-xs font-semibold whitespace-nowrap capitalize",
        "border shadow-sm transition-all duration-200",
        styleClass,
        className
      )}
    >
      {children || status?.toString().replace(/_/g, " ")}
    </span>
  );
}
