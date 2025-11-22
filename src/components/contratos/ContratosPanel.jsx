"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { useToast } from "@/contexts/ToastContext";
import Badge from "@/components/admin/ui/Badge";
import { Loader2, Plus, FileText, Edit, Trash2 } from "lucide-react";

export default function CRMContratosPanel({
  onOpenForm,
  onOpenDelete,
  onOpenDrawer,
}) {
  const toast = useToast();

  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ tipo: "todos", status: "todos" });

  const loadContratos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/contratos", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setContratos(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar contratos", err.message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadContratos();
  }, [loadContratos]);

  const filtered = contratos.filter((c) => {
    if (filter.tipo !== "todos" && c.tipo !== filter.tipo) return false;
    if (filter.status !== "todos" && c.status !== filter.status) return false;
    return true;
  });

  const statusColor = (status) => {
    const map = {
      ativo: "bg-emerald-600",
      encerrado: "bg-gray-500",
      pendente_assinatura: "bg-yellow-600",
      inadimplente: "bg-red-600",
    };
    return map[status] || "bg-muted";
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText size={18} /> Lista de Contratos
        </h3>

        <div className="flex flex-wrap gap-2 items-center">

          <select
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
            value={filter.tipo}
            onChange={(e) => setFilter({ ...filter, tipo: e.target.value })}
          >
            <option value="todos">Todos os tipos</option>
            <option value="locacao">Locação</option>
            <option value="venda">Venda</option>
            <option value="administracao">Administração</option>
          </select>

          <select
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="pendente_assinatura">
              Pendente de Assinatura
            </option>
            <option value="encerrado">Encerrado</option>
          </select>

          <Button onClick={() => onOpenForm()} className="flex items-center gap-2">
            <Plus size={16} /> Novo Contrato
          </Button>
        </div>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <p className="p-4 text-center text-muted-foreground">
          Nenhum contrato encontrado.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((contrato) => (
            <Card
              key={contrato.id}
              className="p-4 space-y-3 hover:shadow-lg transition rounded-xl cursor-pointer group"
              onClick={() => onOpenDrawer(contrato.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">
                    {contrato.imoveis?.titulo || "Imóvel sem título"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Tipo: {contrato.tipo} | Valor: R$
                    {Number(contrato.valor_acordado).toFixed(2)}
                  </p>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenForm(contrato);
                    }}
                  >
                    <Edit size={16} />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDelete(contrato);
                    }}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground flex justify-between items-center">
                <span>{contrato.data_inicio} → {contrato.data_fim}</span>
                <Badge status={contrato.status}>
                  {contrato.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
