/**
 * Formata número para BRL.
 * @param {number|string} value
 */
export function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "—";
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Formata CEP (00000-000)
 */
export function formatCep(value = "") {
  const v = value.replace(/\D/g, "");
  return v.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

/**
 * Formata CNPJ (00.000.000/0000-00)
 */
export function formatCnpj(value = "") {
  const v = value.replace(/\D/g, "");
  return v.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Formata CPF (000.000.000-00)
 */
export function formatCpf(value = "") {
  const v = value.replace(/\D/g, "");
  return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/**
 * Normaliza UF (sempre em maiúsculas, ex: "MG", "SP")
 */
export function formatUf(value = "") {
  return (value || "").trim().toUpperCase().substring(0, 2);
}

/**
 * Formata data no padrão DD/MM/AAAA
 */
export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("pt-BR");
}

/**
 * Remove acentos e espaços de uma string (para buscas, URLs)
 */
export function normalizeString(str = "") {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
