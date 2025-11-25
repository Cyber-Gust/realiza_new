"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/admin/ui/Badge";

export default function VacanciaWidget({ imovelId }) {
  const [state, setState] = useState({
    dias: null,
    data_fim: null,
    loading: true
  });

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const r = await fetch(
          `/api/imoveis/${imovelId}?action=financeiro&vacancia=1`,
          { cache: "no-store" }
        );

        const j = await r.json();
        if (!alive) return;

        if (r.ok) {
          setState({
            dias: j?.vacancia?.dias ?? 0,
            data_fim: j?.vacancia?.ultimo_contrato?.data_fim ?? null,
            loading: false
          });
        } else {
          setState({ dias: 0, data_fim: null, loading: false });
        }
      } catch {
        if (!alive) return;
        setState({ dias: 0, data_fim: null, loading: false });
      }
    })();

    return () => {
      alive = false;
    };
  }, [imovelId]);

  if (state.loading) {
    return <p className="text-sm text-muted-foreground">Calculando...</p>;
  }

  const dias = state.dias ?? 0;

  // 🔥 Mapa de risco → Badge
  const statusMap = {
    green: "disponivel",
    amber: "reservado",
    red: "perdido"
  };

  const risk =
    dias > 30 ? "red" : dias > 7 ? "amber" : "green";

  return (
    <div className="flex items-center gap-3">
      <Badge status={statusMap[risk]}>
        {dias} dias sem contrato ativo
      </Badge>

      {state.data_fim && (
        <span className="text-xs text-muted-foreground">
          Último contrato até{" "}
          {new Date(state.data_fim).toLocaleDateString("pt-BR")}
        </span>
      )}
    </div>
  );
}
