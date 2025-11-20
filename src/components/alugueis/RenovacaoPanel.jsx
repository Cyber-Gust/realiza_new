"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import Toast from "@/components/admin/ui/Toast";
import { Loader2, RefreshCcw, FileSignature } from "lucide-react";

export default function RenovacaoPanel() {
  const [id, setId] = useState("");
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      if (!id.trim()) return Toast.error("Informe o ID do contrato.");
      setLoading(true);

      const res = await fetch(`/api/alugueis?view=renovacao&contrato_id=${id}`, {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setDados(json.data);
    } catch (err) {
      Toast.error("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // Renderização final
  // ======================================================
  return (
    <div className="space-y-6">
      {/* =====================================
          🔹 HEADER
      ====================================== */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <FileSignature size={18} /> Renovação de Contrato
        </h3>

        {/* Campo de busca + botão */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
            placeholder="ID do contrato"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />

          <Button
            onClick={load}
            className="flex gap-2 items-center"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCcw size={16} />}
            Carregar
          </Button>
        </div>
      </div>

      {/* =====================================
          🔹 RESULTADO
      ====================================== */}
      {dados && (
        <Card className="p-6 space-y-3 border border-border bg-panel-card">
          <h4 className="font-semibold text-foreground text-lg">
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
            Valor atual:
            <span className="text-foreground font-semibold ml-1">
              R$ {Number(dados.valor_acordado).toFixed(2)}
            </span>
          </p>

          {/* Quando quiser implementar cálculo de reajuste
              basta eu gerar o bloco abaixo com UI completa */}
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
