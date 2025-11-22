"use client";

import { useState, useEffect } from "react";

import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { useToast } from "@/contexts/ToastContext";

import { Button } from "@/components/admin/ui/Button";
import { cn } from "@/lib/utils";

import {
  Loader2,
  RefreshCcw,
  Home,
  User2,
} from "lucide-react";

export default function CarteiraPanel() {
  const [loading, setLoading] = useState(true);
  const [carteira, setCarteira] = useState([]);
  const [filter, setFilter] = useState("todos");

  const { error: toastError } = useToast();

  useEffect(() => {
    loadCarteira();
  }, []);

  const loadCarteira = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/alugueis?view=carteira", {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setCarteira(json.data || []);
    } catch (err) {
      toastError("Erro ao carregar carteira: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = carteira.filter((c) =>
    filter === "todos" ? true : c.status_financeiro === filter
  );

  if (loading) return <LoadingState />;

  if (carteira.length === 0)
    return (
      <p className="text-muted-foreground text-center py-6">
        Nenhum contrato de locação ativo encontrado.
      </p>
    );

  return (
    <div className="space-y-6 animate-in fade-in-10 duration-200">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <Home size={18} className="text-muted-foreground" />
          <h3 className="text-lg font-semibold tracking-tight">
            Carteira de Locações
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={cn(
              "border border-border rounded-md bg-card",
              "text-sm px-3 py-2",
              "focus:outline-none focus:ring-2 focus:ring-primary/50"
            )}
          >
            <option value="todos">Todos os contratos</option>
            <option value="regular">Regulares</option>
            <option value="pendente">Pendentes</option>
            <option value="atrasado">Atrasados</option>
          </select>

          <Button
            variant="ghost"
            onClick={loadCarteira}
            className={cn(
              "flex gap-2 items-center",
              "border border-border bg-transparent hover:bg-muted"
            )}
          >
            <RefreshCcw size={15} /> Atualizar
          </Button>
        </div>
      </div>

      {/* GRID DE CONTRATOS */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <ContratoCard key={c.id} data={c} />
        ))}
      </div>
    </div>
  );
}

/* ===========================================================
   🔹 LOADING — Skeleton Premium
=========================================================== */
function LoadingState() {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 py-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-lg" />
      ))}
    </div>
  );
}

/* ===========================================================
   🔹 CONTRATO CARD
=========================================================== */
function ContratoCard({ data }) {
  const {
    imoveis,
    status_financeiro,
    inquilino,
    valor_acordado,
    data_inicio,
    data_fim,
  } = data;

  return (
    <Card
      className={cn(
        "p-4 space-y-3 border border-border rounded-lg shadow-sm",
        "hover:shadow-md hover:-translate-y-[1px] transition-all duration-150",
        "cursor-pointer bg-card"
      )}
    >
      {/* HEADER + STATUS */}
      <div className="flex justify-between items-start">
        <h4 className="font-medium leading-tight">
          {imoveis?.titulo || "Imóvel"}
        </h4>

        <Badge
          className={cn(
            "text-xs capitalize px-2 py-0.5",
            colorMap[status_financeiro] ??
              "bg-muted text-muted-foreground"
          )}
        >
          {status_financeiro}
        </Badge>
      </div>

      {/* INFORMAÇÕES */}
      <div className="space-y-1 text-sm">
        <p className="text-muted-foreground flex items-center gap-1">
          <User2 size={14} />
          Inquilino:
          <span className="text-foreground ml-1">
            {inquilino?.nome || "-"}
          </span>
        </p>

        <p className="text-muted-foreground">
          Valor mensal:
          <span className="text-foreground font-medium ml-1">
            R$ {Number(valor_acordado).toFixed(2)}
          </span>
        </p>

        <p className="text-muted-foreground">
          Início:
          <span className="text-foreground ml-1">{data_inicio}</span>
        </p>

        <p className="text-muted-foreground">
          Fim:
          <span className="text-foreground ml-1">{data_fim}</span>
        </p>
      </div>
    </Card>
  );
}

/* ===========================================================
   🔹 COLOR MAP — Badge padronizado
=========================================================== */
const colorMap = {
  atrasado: "bg-red-600 text-white",
  pendente: "bg-yellow-600 text-white",
  regular: "bg-emerald-600 text-white",
};
