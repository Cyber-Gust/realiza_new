"use client";

import { useState } from "react";

import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Skeleton } from "@/components/admin/ui/Skeleton";
import { Input } from "@/components/admin/ui/Form"; // 🔥 Ajuste necessário
import { useToast } from "@/contexts/ToastContext";

import { cn } from "@/lib/utils";
import { Loader2, FileX, RefreshCcw } from "lucide-react";

export default function RescisaoPanel() {
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
        `/api/alugueis?view=rescisao&contrato_id=${id}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setDados(json.data);
    } catch (err) {
      toastError("Erro ao carregar rescisão: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-10 duration-200">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <FileX size={18} className="text-muted-foreground" />
          <h3 className="text-lg font-semibold tracking-tight">
            Rescisão de Contrato
          </h3>
        </div>

        {/* INPUT + LOAD */}
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
              <Loader2 size={16} className="animate-spin" />
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
            "p-6 space-y-4 border border-border rounded-lg shadow-sm bg-card",
            "animate-in fade-in-0 duration-200"
          )}
        >
          <div className="space-y-1">
            <h4 className="text-lg font-semibold text-foreground">
              {dados.imoveis?.titulo || "Imóvel sem título"}
            </h4>

            <p className="text-sm text-muted-foreground">
              Inquilino:
              <span className="ml-1 text-foreground font-medium">
                {dados.inquilino?.nome || "-"}
              </span>
            </p>

            <p className="text-sm text-muted-foreground">
              Vigência atual:
              <span className="ml-1 text-foreground">
                {dados.data_inicio} → {dados.data_fim}
              </span>
            </p>

            <p className="text-sm text-muted-foreground">
              Valor do aluguel:
              <span className="ml-1 text-foreground font-semibold">
                R$ {Number(dados.valor_acordado).toFixed(2)}
              </span>
            </p>
          </div>

          {/* FUTURO BLOCO DE CÁLCULO */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              Quando desejar, posso implementar aqui:
              <br />• cálculo automático de multa rescisória  
              • proporcionalidade restante  
              • aviso prévio  
              • geração de minuta em PDF  
              • disparo automático para assinatura  
            </p>
          </div>
        </Card>
      )}

      {!dados && !loading && (
        <p className="text-sm text-muted-foreground italic">
          Informe o ID do contrato para visualizar os detalhes.
        </p>
      )}
    </div>
  );
}

/* ===========================================================
   🔹 LOADING CARD — Skeleton premium
=========================================================== */
function LoadingCard() {
  return (
    <Card className="p-6 space-y-4">
      <Skeleton className="h-6 w-56 rounded-md" />
      <Skeleton className="h-4 w-48 rounded-md" />
      <Skeleton className="h-4 w-40 rounded-md" />
      <Skeleton className="h-4 w-36 rounded-md" />
    </Card>
  );
}
