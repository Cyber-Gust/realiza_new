// Formata o valor em centavos para o formato monetário em BRL
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

// Formata metragem (ex: 102.34 → "102,34")
export const formatArea = (value) => {
  if (value === null || value === undefined) return "";

  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Converte string digitada (somente números) para metragem
// "10234" → 102.34
export const parseAreaToNumber = (raw) => {
  if (!raw) return null;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  return Number(digits) / 100;
};

export function formatPhoneBR(value) {
  if (!value) return "";

  // remove tudo que não for número
  let digits = String(value).replace(/\D/g, "");

  // remove DDI se já vier junto
  if (digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  // celular BR (11 dígitos)
  if (digits.length === 11) {
    const ddd = digits.slice(0, 2);
    const nine = digits.slice(2, 3);
    const part1 = digits.slice(3, 7);
    const part2 = digits.slice(7);

    return `+55 (${ddd}) ${nine} ${part1}-${part2}`;
  }

  // fixo BR (10 dígitos)
  if (digits.length === 10) {
    const ddd = digits.slice(0, 2);
    const part1 = digits.slice(2, 6);
    const part2 = digits.slice(6);

    return `+55 (${ddd}) ${part1}-${part2}`;
  }

  // fallback defensivo
  return value;
}