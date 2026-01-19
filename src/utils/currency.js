// =======================
// FINANCEIRO
// =======================

// Formata o valor em centavos para o formato monetário em BRL (Ex: R$ 1.200,50)
export const formatBRL = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

// Converte a string com valor monetário (R$) para número (em centavos)
export const parseCurrencyToNumber = (raw) => {
  if (!raw) return 0;
  const digits = raw.replace(/\D/g, "");  // remove qualquer coisa que não seja número
  return Number(digits) / 100;  // converte para valor em centavos
};

// =======================
// METRAGEM / ÁREA
// =======================

// Formata metragem (ex: 102.34 → "102,34")
export const formatArea = (value) => {
  if (value === null || value === undefined) return "";

  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Converte string digitada (somente números) para metragem float
// "10234" → 102.34
export const parseAreaToNumber = (raw) => {
  if (!raw) return null;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  return Number(digits) / 100;
};

// =======================
// DOCUMENTOS (CPF / CNPJ)
// =======================

// Detecta automaticamente se é CPF (11) ou CNPJ (14) e aplica a máscara
export const formatDocument = (value) => {
  if (!value) return "";
  
  // Remove tudo que não for dígito
  const digits = String(value).replace(/\D/g, "");

  // CPF (000.000.000-00)
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  // CNPJ (00.000.000/0000-00)
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  // Se não bater com nenhum tamanho padrão, retorna o original (ou limpo)
  return value;
};

// =======================
// TELEFONE
// =======================

export function formatPhoneBR(value) {
  if (!value) return "";

  // remove tudo que não for número
  let digits = String(value).replace(/\D/g, "");

  // remove DDI (55) se já vier junto, para não duplicar na formatação visual
  if (digits.startsWith("55") && digits.length > 11) {
    digits = digits.slice(2);
  }

  // Celular BR (11 dígitos) -> (11) 99999-9999
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
  }

  // Fixo BR (10 dígitos) -> (11) 3333-3333
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  // Se for diferente (ex: número incompleto ou internacional sem padrão), retorna como está
  return value;
}

// =======================
// DATAS (PADRÃO BR)
// =======================

// ISO ("2025-02-10" ou Date) → "10/02/2025"
export const formatDateBR = (value) => {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// ISO → "10/02/2025 • Seg"
export const formatDateBRWithWeekday = (value) => {
  if (!value) return "—";

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "—";

  // Deixa a primeira letra do dia maiúscula (ex: "seg" -> "Seg")
  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
  const weekdayCapitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1).replace(".", "");
  const dataStr = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${dataStr} • ${weekdayCapitalized}`;
};