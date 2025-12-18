/**
 * ======================================================
 * STATUS FLOW — GOVERNANÇA DE CONTRATOS
 * Fonte única da verdade para transições de status
 * ======================================================
 */

export type ContratoStatus =
  | "em_elaboracao"
  | "aguardando_assinatura"
  | "assinado"
  | "vigente"
  | "ativo"
  | "reajuste_pendente"
  | "renovacao_pendente"
  | "renovado"
  | "encerrado"
  | "rescindido"
  | "cancelado";

/**
 * ------------------------------------------------------
 * Regras oficiais de transição
 * ------------------------------------------------------
 */
export const STATUS_FLOW: Record<
  string,
  { from: ContratoStatus[]; to: ContratoStatus }
> = {
  gerar_minuta: {
    from: ["em_elaboracao"],
    to: "aguardando_assinatura",
  },

  enviar_assinatura: {
    from: ["aguardando_assinatura"],
    to: "assinado",
  },

  criar_aditivo: {
    from: ["vigente", "ativo"],
    to: "ativo",
  },

  reajustar: {
    from: ["vigente", "ativo"],
    to: "reajuste_pendente",
  },

  renovar: {
    from: ["vigente", "ativo"],
    to: "renovado",
  },

  encerrar: {
    from: ["vigente", "ativo", "renovado"],
    to: "encerrado",
  },

  rescindir: {
    from: ["vigente", "ativo"],
    to: "rescindido",
  },

  cancelar: {
    from: ["em_elaboracao", "aguardando_assinatura"],
    to: "cancelado",
  },
};

/**
 * ------------------------------------------------------
 * Valida e retorna o próximo status
 * ------------------------------------------------------
 */
export function getNextStatus(
  action: string,
  currentStatus: ContratoStatus
): ContratoStatus {
  const rule = STATUS_FLOW[action];

  if (!rule) {
    return currentStatus;
  }

  if (!rule.from.includes(currentStatus)) {
    throw new Error(
      `Ação '${action}' não permitida quando o contrato está '${currentStatus}'`
    );
  }

  return rule.to;
}
