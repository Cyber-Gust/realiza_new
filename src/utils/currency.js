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
// DATAS (PADRÃO BR) ✅ SEM BUG DE -1 DIA
// =======================

// Detecta se é ISO date-only: "YYYY-MM-DD"
function isISODateOnly(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// ISO ("2025-02-10") → "10/02/2025" sem timezone zoar
function formatISODateOnlyBR(dateOnlyStr) {
  const [y, m, d] = String(dateOnlyStr).split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

// ISO ("2025-02-10" ou Date) → "10/02/2025"
export const formatDateBR = (value) => {
  if (!value) return "—";

  // ✅ caso mais comum no seu sistema (Supabase):
  // vem "YYYY-MM-DD" e o JS sempre tenta converter com timezone → quebra
  if (isISODateOnly(value)) {
    return formatISODateOnlyBR(value);
  }

  // ✅ se vier Date, mantém
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return "—";
    return value.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  // ✅ se vier ISO completo (com horário), aí pode usar Date normal
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateBRWithWeekday = (value) => {
  if (!value) return "—";

  // ✅ se for "YYYY-MM-DD", converte sem timezone
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const dt = new Date(y, m - 1, d); // local safe ✅

    const weekday = dt.toLocaleDateString("pt-BR", { weekday: "short" });
    const weekdayCapitalized =
      weekday.charAt(0).toUpperCase() + weekday.slice(1).replace(".", "");

    const dataStr = dt.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return `${dataStr} • ${weekdayCapitalized}`;
  }

  // ✅ qualquer outro formato segue normal
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "—";

  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
  const weekdayCapitalized =
    weekday.charAt(0).toUpperCase() + weekday.slice(1).replace(".", "");

  const dataStr = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${dataStr} • ${weekdayCapitalized}`;
};

// =======================
// PORCENTAGEM (%)
// =======================

/**
 * Formata um número para string percentual BR
 * Ex: 10.5 -> "10,50"
 */
export const formatPercentBR = (value) => {
  if (value === null || value === undefined || value === "") return "";

  const n = Number(value);
  if (Number.isNaN(n)) return "";

  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Parse de string percentual BR para number
 * Ex: "10,50" -> 10.5
 */
export const parsePercentToNumber = (raw) => {
  if (!raw) return null;

  const cleaned = String(raw)
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  if (!cleaned) return null;

  const n = Number(cleaned);
  if (Number.isNaN(n)) return null;

  return n;
};

/**
 * Preenchedor estilo "moeda", mas pra porcentagem
 * Ex:
 * "1" -> "0,01"
 * "10" -> "0,10"
 * "1050" -> "10,50"
 */
export const formatPercentInput = (raw) => {
  if (!raw) return "";

  const digits = String(raw).replace(/\D/g, "");
  if (!digits) return "";

  const n = Number(digits) / 100;

  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};