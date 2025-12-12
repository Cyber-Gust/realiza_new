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
