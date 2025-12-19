// components/admin/financeiro/financeiro.constants.js
// 📌 Fonte única de verdade (labels, grupos e helpers) pro Financeiro
// Mantém UI consistente e evita “string solta” espalhada pelo front.

export const TRANSACAO_LABELS = {
  // Receitas
  receita_aluguel: "Receita de Aluguel",
  taxa_adm_imobiliaria: "Taxa de Administração",
  receita_venda_imovel: "Receita de Venda de Imóvel", // (novo)

  // Saídas
  repasse_proprietario: "Repasse ao Proprietário",
  comissao_corretor: "Comissão do Corretor",
  despesa_manutencao: "Despesa de Manutenção",
  pagamento_iptu: "Pagamento de IPTU",
  pagamento_condominio: "Pagamento de Condomínio",
  despesa_operacional: "Custo Operacional", // (novo)
};

export const STATUS_LABELS = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export const RECEITA_TIPOS = [
  "receita_aluguel",
  "taxa_adm_imobiliaria",
  "receita_venda_imovel",
];

export const DESPESA_TIPOS = [
  "repasse_proprietario",
  "comissao_corretor",
  "despesa_manutencao",
  "pagamento_iptu",
  "pagamento_condominio",
  "despesa_operacional",
];

export const RECEITA_TIPOS_READONLY = [
  // receitas geradas automaticamente (não devem ter form de “novo”)
  "receita_aluguel",
  "taxa_adm_imobiliaria",
];

export const LOGICAL_SECTIONS = {
  DASHBOARD: "dashboard",
  RECEITAS_ALUGUEIS: "receitas_alugueis",
  RECEITAS_VENDAS: "receitas_vendas",
  DESPESAS_REPASSES: "despesas_repasses",
  DESPESAS_COMISSOES: "despesas_comissoes",
  DESPESAS_CUSTOS: "despesas_custos",
  INADIMPLENCIA: "inadimplencia",
  FLUXO: "fluxo",
};

export function labelTipo(tipo) {
  return TRANSACAO_LABELS[tipo] || String(tipo || "").replace(/_/g, " ");
}

export function labelStatus(status) {
  return STATUS_LABELS[status] || String(status || "");
}

export function isReceita(tipo) {
  return RECEITA_TIPOS.includes(tipo);
}

export function isDespesa(tipo) {
  return DESPESA_TIPOS.includes(tipo);
}

export function isReadonlyReceita(tipo) {
  return RECEITA_TIPOS_READONLY.includes(tipo);
}

// Útil pra “Fluxo de Caixa” (agrupar e colorir etc.)
export function getNatureza(tipo) {
  if (isReceita(tipo)) return "receita";
  if (isDespesa(tipo)) return "despesa";
  return "neutro";
}
