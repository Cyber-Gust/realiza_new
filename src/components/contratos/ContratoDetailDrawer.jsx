"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";
import { Loader2, X, FileDown, Calendar, DollarSign, RefreshCw, Lock } from "lucide-react";

export default function CRMContratoDetailDrawer({ contratoId, onClose, onUpdated }) {
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (contratoId) fetchContrato();
  }, [contratoId]);

  const fetchContrato = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contratos?id=${contratoId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setContrato(json.data);
    } catch (err) {
      Toast.error("Erro ao carregar contrato: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEncerrar = async () => {
    if (!contrato?.id) return;
    try {
      setUpdating(true);
      const res = await fetch("/api/contratos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contrato.id, status: "encerrado" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      Toast.success("Contrato encerrado com sucesso!");
      onUpdated?.();
      onClose?.();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleRenovar = async () => {
    if (!contrato?.id) return;
    try {
      setUpdating(true);
      const res = await fetch("/api/contratos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: contrato.id,
          status: "renovado",
          data_inicio: new Date().toISOString().split("T")[0],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      Toast.success("Contrato renovado!");
      onUpdated?.();
      onClose?.();
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (!contratoId) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-end">
      <div className="w-full sm:w-[480px] h-full bg-panel-card border-l border-border shadow-xl overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-border p-4">
          <h2 className="text-lg font-semibold text-foreground">
            Detalhes do Contrato
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* BODY */}
        {loading ? (
          <div className="flex justify-center items-center h-64 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" /> Carregando detalhes...
          </div>
        ) : !contrato ? (
          <p className="p-4 text-center text-muted-foreground">
            Contrato não encontrado.
          </p>
        ) : (
          <div className="p-6 space-y-4 text-sm">
            {/* IMÓVEL */}
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileDown size={16} /> {contrato.imoveis?.titulo || "Imóvel"}
              </h3>
              <p className="text-muted-foreground">
                {contrato.imoveis?.endereco_bairro || "Endereço não informado"}
              </p>
            </div>

            {/* DADOS GERAIS */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="font-medium">{contrato.tipo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium">{contrato.status}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Acordado</p>
                <p className="font-medium">
                  R$ {Number(contrato.valor_acordado || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa Adm.</p>
                <p className="font-medium">
                  {Number(contrato.taxa_administracao_percent || 0)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Índice Reajuste</p>
                <p className="font-medium">{contrato.indice_reajuste}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dia do Vencimento</p>
                <p className="font-medium">{contrato.dia_vencimento_aluguel}</p>
              </div>
            </div>

            {/* DATAS */}
            <div className="mt-4 flex flex-col gap-1">
              <p className="text-xs text-muted-foreground">Período</p>
              <p className="flex items-center gap-2">
                <Calendar size={14} />
                {contrato.data_inicio} → {contrato.data_fim}
              </p>
            </div>

            {/* PARTICIPANTES */}
            <div className="mt-6 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Participantes
              </p>
              <div className="border border-border rounded-md p-2 text-xs space-y-1">
                <p>
                  <strong>Proprietário:</strong>{" "}
                  {contrato.proprietario?.nome_completo || "N/D"}
                </p>
                <p>
                  <strong>Inquilino:</strong>{" "}
                  {contrato.inquilino?.nome_completo || "N/D"}
                </p>
              </div>
            </div>

            {/* DOCUMENTO ASSINADO */}
            {contrato.documento_assinado_url && (
              <div className="mt-6">
                <Button
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2"
                  asChild
                >
                  <a
                    href={contrato.documento_assinado_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileDown size={16} /> Baixar Contrato Assinado
                  </a>
                </Button>
              </div>
            )}

            {/* AÇÕES */}
            <div className="mt-8 flex flex-col gap-2">
              <Button
                className="w-full flex items-center justify-center gap-2"
                onClick={handleRenovar}
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : (
                  <>
                    <RefreshCw size={16} /> Renovar Contrato
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleEncerrar}
                disabled={updating}
              >
                <Lock size={16} /> Encerrar Contrato
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
