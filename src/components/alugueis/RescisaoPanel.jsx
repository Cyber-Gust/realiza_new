"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import Toast from "@/components/admin/ui/Toast";
import { Loader2, FileX, RefreshCcw } from "lucide-react";

export default function RescisaoPanel() {
  const [id, setId] = useState("");
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      if (!id.trim()) return Toast.error("Informe o ID do contrato.");

      setLoading(true);
      const res = await fetch(`/api/alugueis?view=rescisao&contrato_id=${id}`, {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setDados(json.data);
    } catch (err) {
      Toast.error("Erro ao carregar rescisão: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* =====================================
          🔹 HEADER
      ====================================== */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <FileX size={18} /> Rescisão de Contrato
        </h3>

        {/* Input + botão */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
            placeholder="ID do contrato"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />

          <Button
            onClick={load}
            disabled={loading}
            className="flex gap-2 items-center"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
            Carregar
          </Button>
        </div>
      </div>

      {/* =====================================
          🔹 RESULTADO DA RESCISÃO
      ====================================== */}
      {dados && (
        <Card className="p-6 space-y-4 border border-border bg-panel-card">
          <div className="space-y-1">
            <h4 className="text-lg font-semibold text-foreground">
              {dados.imoveis?.titulo || "Imóvel sem título"}
            </h4>

            <p className="text-sm text-muted-foreground">
              Inquilino:{" "}
              <span className="text-foreground font-medium">
                {dados.inquilino?.nome || "-"}
              </span>
            </p>

            <p className="text-sm text-muted-foreground">
              Vigência atual:{" "}
              <span className="text-foreground">
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

          {/* =====================================
              🔹 BLOCO FUTURO: CÁLCULO DE MULTA
              (já deixei aqui a estrutura mental)
          ====================================== */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground italic">
              Quando desejar, posso implementar aqui:
              <br />• cálculo automático de multa rescisória  
              • proporcionalidade restante  
              • aviso prévio  
              • geração de minuta PDF  
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
