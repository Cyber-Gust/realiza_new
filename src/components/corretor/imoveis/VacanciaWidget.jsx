"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/admin/ui/Badge";

export default function VacanciaWidget({ imovelId }) {
  const [state, setState] = useState({
    dias: null,
    status: null,
    ultimo_contrato: null,
    loading: true,
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const r = await fetch(`/api/imoveis/${imovelId}/vacancia`, {
          cache: "no-store",
        });

        const j = await r.json();
        if (!alive) return;

        setState({
          dias: j?.vacancia?.dias ?? null,
          status: j?.vacancia?.status ?? null,
          ultimo_contrato: j?.vacancia?.ultimo_contrato ?? null,
          loading: false,
        });
      } catch {
        if (!alive) return;
        setState({ dias: null, status: "erro", ultimo_contrato: null, loading: false });
      }
    })();

    return () => { alive = false };
  }, [imovelId]);

  if (state.loading) return <p className="text-sm text-muted-foreground">Calculando...</p>;

  const { dias, status, ultimo_contrato } = state;

  // Map para Badge
  const badgeMap = {
    sem_contrato: "sem_contrato",
    contrato_ativo: "contrato_ativo",

    em_vacancia:
      dias > 30
        ? "vacancia_grave"
        : dias > 7
          ? "vacancia_moderada"
          : "vacancia_leve",

    erro: "perdido",
  };

  return (
    <div className="flex items-center gap-3">
      <Badge status={badgeMap[status]}>
        {status === "sem_contrato" && "Sem contrato cadastrado"}
        {status === "contrato_ativo" && "Contrato ativo"}
        {status === "em_vacancia" && `${dias} dias sem contrato ativo`}
        {status === "erro" && "Erro ao calcular"}
      </Badge>

      {ultimo_contrato?.data_fim && (
        <span className="text-xs text-muted-foreground">
          Último contrato até {new Date(ultimo_contrato.data_fim).toLocaleDateString("pt-BR")}
        </span>
      )}
    </div>
  );
}
