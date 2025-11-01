/**
 * Valida CEP (8 dígitos)
 */
export function isValidCep(cep) {
  return /^[0-9]{5}-?[0-9]{3}$/.test(cep);
}

/**
 * Valida CPF
 */
export function isValidCpf(cpf) {
  cpf = cpf.replace(/[^\d]+/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.substring(10, 11));
}

/**
 * Valida CNPJ
 */
export function isValidCnpj(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g, "");
  if (cnpj.length !== 14) return false;

  const calc = (x) => {
    let n = 0;
    const mult = x - 7;
    for (let i = x; i >= 1; i--) {
      n += cnpj.charAt(x - i) * ((i < mult) ? i + 2 : i - 6);
    }
    const r = n % 11;
    return r < 2 ? 0 : 11 - r;
  };

  return (
    parseInt(cnpj.charAt(12)) === calc(12) &&
    parseInt(cnpj.charAt(13)) === calc(13)
  );
}

/**
 * Valida data de validade (não vencida)
 */
export function isValidDate(date) {
  if (!date) return false;
  return !isNaN(new Date(date).getTime());
}

/**
 * Verifica se a validade está vencida ou próxima de vencer
 * @returns {"valid"|"expiring"|"expired"}
 */
export function getValidityStatus(date) {
  if (!isValidDate(date)) return "invalid";
  const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "expired";
  if (diff <= 15) return "expiring";
  return "valid";
}
