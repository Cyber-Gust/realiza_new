"use client";

import { useState } from "react";

import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import Badge from "@/components/admin/ui/Badge";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { Input } from "@/components/admin/ui/Form";
import { useToast } from "@/contexts/ToastContext";

import { cn } from "@/lib/utils";
import {
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function TimelinePanel() {
  const [contratoId, setContratoId] = useState("");
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);

  const { error: toastError } = useToast();

  const load = async () => {
    try {
      if (!contratoId.trim()) {
        toastError("Informe o ID do contrato.");
        return;
      }

      setLoading(true);

      const res = await fetch(
        `/api/alugueis?view=timeline&contrato_id=${contratoId}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setDados(json.data || []);
    } catch (err) {
      toastError("Erro ao carregar timeline: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-10 duration-200">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-muted-foreground" />
          <h3 className="text-lg font-semibold tracking-tight">
            Histórico do Contrato
          </h3>
        </div>

        {/* INPUT + BUTTON */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="ID do contrato"
            value={contratoId}
            onChange={(e) => setContratoId(e.target.value)}
            className="w-40"
          />

          <Button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Clock size={16} />
            )}
            Carregar
          </Button>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      )}

      {/* VAZIO */}
      {!loading && dados.length === 0 && (
        <p className="text-muted-foreground italic text-sm">
          Nenhum evento encontrado para este contrato.
        </p>
      )}

      {/* TIMELINE */}
      <div className="space-y-4">
        {!loading &&
          dados.map((t, index) => (
            <div key={t.id} className="flex items-start gap-4">

              {/* LINHA DA TIMELINE */}
              <div className="flex flex-col items-center pt-1">
                <span
                  className={cn(
                    "w-3 h-3 rounded-full shadow-sm",
                    t.status === "pago"
                      ? "bg-emerald-600"
                      : t.status === "atrasado"
                      ? "bg-rose-600"
                      : "bg-amber-600"
                  )}
                />
                {index < dados.length - 1 && (
                  <div className="w-0.5 flex-1 bg-border mt-1"></div>
                )}
              </div>

              {/* CARD DO EVENTO */}
              <Card
                className={cn(
                  "flex-1 p-4 space-y-2 border border-border bg-card",
                  "rounded-lg shadow-sm hover:shadow-md transition-all duration-150",
                  "animate-in fade-in-0"
                )}
              >
                {/* TÍTULO + STATUS */}
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-foreground">
                    {t.descricao}
                  </h4>
                  <StatusBadge status={t.status} />
                </div>

                {/* VENCIMENTO */}
                <p className="text-sm text-muted-foreground">
                  Vencimento:
                  <span className="text-foreground font-medium ml-1">
                    {t.data_vencimento}
                  </span>
                </p>

                {/* VALOR */}
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

/* ===========================================================
   🔹 STATUS BADGE (fornecedor oficial do design system)
=========================================================== */
function StatusBadge({ status }) {
  const map = {
    pago: {
      icon: CheckCircle2,
      class: "bg-emerald-600 text-white",
      label: "Pago",
    },
    atrasado: {
      icon: AlertTriangle,
      class: "bg-rose-600 text-white",
      label: "Atrasado",
    },
    pendente: {
      icon: Clock,
      class: "bg-amber-600 text-white",
      label: "Pendente",
    },
  };

  const item = map[status] || map["pendente"];
  const Icon = item.icon;

  return (
    <Badge
      className={cn("flex items-center gap-1 text-xs px-2 py-0.5", item.class)}
    >
      <Icon size={12} /> {item.label}
    </Badge>
  );
}
