"use client";

import { useState } from "react";
import Toast from "@/components/admin/ui/Toast";
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import { Loader2, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export default function TimelinePanel() {
  const [contratoId, setContratoId] = useState("");
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      if (!contratoId.trim()) return Toast.error("Informe o ID do contrato.");

      setLoading(true);
      const res = await fetch(`/api/alugueis?view=timeline&contrato_id=${contratoId}`, {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDados(json.data || []);
    } catch (err) {
      Toast.error("Erro ao carregar timeline: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pago":
        return (
          <span className="flex items-center gap-1 text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded text-xs">
            <CheckCircle2 size={14} /> Pago
          </span>
        );
      case "atrasado":
        return (
          <span className="flex items-center gap-1 text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded text-xs">
            <AlertTriangle size={14} /> Atrasado
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded text-xs">
            <Clock size={14} /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">

      {/* =====================================
          🔹 HEADER
      ====================================== */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock size={18} /> Histórico do Contrato
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            placeholder="ID do contrato"
            className="p-2 border border-border rounded bg-panel-card text-sm"
            value={contratoId}
            onChange={(e) => setContratoId(e.target.value)}
          />

          <Button className="flex gap-2 items-center" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Clock size={16} />}
            Carregar
          </Button>
        </div>
      </div>

      {/* =====================================
          🔹 LOADING
      ====================================== */}
      {loading && (
        <p className="text-muted-foreground text-sm flex items-center gap-2">
          <Loader2 className="animate-spin" size={16} /> Carregando timeline...
        </p>
      )}

      {/* =====================================
          🔹 VAZIO
      ====================================== */}
      {!loading && dados.length === 0 && (
        <p className="text-muted-foreground italic text-sm">
          Nenhum evento encontrado para este contrato.
        </p>
      )}

      {/* =====================================
          🔹 TIMELINE LIST
      ====================================== */}
      <div className="space-y-4">
        {dados.map((t, index) => (
          <div key={t.id} className="flex items-start gap-3">
            {/* Linha vertical da timeline */}
            <div className="flex flex-col items-center">
              <span
                className={`w-3 h-3 rounded-full ${
                  t.status === "pago"
                    ? "bg-emerald-600"
                    : t.status === "atrasado"
                    ? "bg-rose-600"
                    : "bg-amber-600"
                }`}
              />

              {index < dados.length - 1 && (
                <div className="w-0.5 flex-1 bg-border mt-1 mb-1" />
              )}
            </div>

            <Card className="flex-1 p-4 space-y-2 bg-panel-card border border-border">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-foreground">{t.descricao}</h4>
                {getStatusBadge(t.status)}
              </div>

              <p className="text-sm text-muted-foreground">
                Vencimento:{" "}
                <span className="text-foreground font-medium">
                  {t.data_vencimento}
                </span>
              </p>

              {t.valor && (
                <p className="text-sm text-foreground font-medium">
                  Valor: R$ {Number(t.valor).toFixed(2)}
                </p>
              )}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
