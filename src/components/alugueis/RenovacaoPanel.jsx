"use client";

import { useState } from "react";

import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { Input } from "@/components/admin/ui/Form"; // ⬅️ Ajuste correto
import { useToast } from "@/contexts/ToastContext";

import { cn } from "@/lib/utils";
import {
  Loader2,
  RefreshCcw,
  FileSignature,
} from "lucide-react";

export default function RenovacaoPanel() {
  const [id, setId] = useState("");
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  const { error: toastError } = useToast();

  const load = async () => {
    try {
      if (!id.trim()) {
        toastError("Informe o ID do contrato.");
        return;
      }

      setLoading(true);

      const res = await fetch(
        `/api/alugueis?view=renovacao&contrato_id=${id}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setDados(json.data);
    } catch (err) {
      toastError("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-10 duration-200">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <FileSignature size={18} className="text-muted-foreground" />
          <h3 className="text-lg font-semibold tracking-tight">
            Renovação de Contrato
          </h3>
        </div>

        {/* CAMPO DE BUSCA */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            value={id}
            placeholder="ID do contrato"
            onChange={(e) => setId(e.target.value)}
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
              <RefreshCcw size={16} />
            )}
            Carregar
          </Button>
        </div>
      </div>

      {/* RESULTADO */}
      {loading && <LoadingCard />}

      {dados && !loading && (
        <Card
          className={cn(
            "p-6 space-y-4 border border-border rounded-lg shadow-sm",
            "animate-in fade-in-0 duration-200"
          )}
        >
          <h4 className="font-semibold text-foreground text-lg">
            {dados.imoveis?.titulo || "Imóvel sem título"}
          </h4>

          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Inquilino:
              <span className="text-foreground font-medium ml-1">
                {dados.inquilino?.nome || "-"}
              </span>
            </p>

            <p className="text-muted-foreground">
              Vigência atual:
              <span className="text-foreground ml-1">
                {dados.data_inicio} → {dados.data_fim}
              </span>
            </p>

            <p className="text-muted-foreground">
              Valor atual:
              <span className="text-foreground font-semibold ml-1">
                R$ {Number(dados.valor_acordado).toFixed(2)}
              </span>
            </p>
          </div>

          {/* Futuro bloco de cálculo de reajuste pode ser plugado aqui */}
        </Card>
      )}

      {!dados && !loading && (
        <p className="text-muted-foreground text-sm italic">
          Busque pelo ID do contrato para visualizar detalhes.
        </p>
      )}
    </div>
  );
}

/* ===========================================================
   🔹 LOADING CARD — Skeleton Enterprise
=========================================================== */
function LoadingCard() {
  return (
    <Card className="p-6 space-y-4">
      <Skeleton className="h-6 w-48 rounded-md" />
      <Skeleton className="h-4 w-56 rounded-md" />
      <Skeleton className="h-4 w-40 rounded-md" />
      <Skeleton className="h-4 w-32 rounded-md" />
    </Card>
  );
}
