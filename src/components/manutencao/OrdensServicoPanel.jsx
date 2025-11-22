"use client";

import { useEffect, useState } from "react";

// UI
import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import Badge from "@/components/admin/ui/Badge";
import { Select } from "@/components/admin/ui/Form";

// Toast
import { useToast } from "@/contexts/ToastContext";

import {
  Loader2,
  Plus,
  Wrench,
  Edit,
  Trash2,
} from "lucide-react";

export default function OrdensServicoPanel({
  onAdd,
  onEdit,
  onDelete,
  onSelect,
}) {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todas");

  const toast = useToast();

  const loadOrdens = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/manutencao/ordens-servico", {
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setOrdens(json.data || []);
    } catch (err) {
      toast.error("Erro ao carregar OS", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdens();
  }, []);

  const filtered =
    filter === "todas"
      ? ordens
      : ordens.filter((o) => o.status === filter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Wrench size={18} /> Ordens de Serviço
        </h3>

        <div className="flex items-center gap-2">
  
        {/* Filtro com Select do DS */}
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-40"
        >
          <option value="todas">Todas</option>
          <option value="aberta">Abertas</option>
          <option value="orcamento">Orçamento</option>
          <option value="em_execucao">Em Execução</option>
          <option value="concluida">Concluídas</option>
          <option value="cancelada">Canceladas</option>
        </Select>

        <Button onClick={onAdd} className="flex items-center gap-2">
          <Plus size={16} /> Nova OS
        </Button>
      </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center items-center py-10 text-muted-foreground">
          <Loader2 className="animate-spin mr-2" /> Carregando...
        </div>
      ) : filtered.length === 0 ? (
        <p className="p-4 text-center text-muted-foreground">
          Nenhuma OS encontrada.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((os) => (
            <Card
              key={os.id}
              className="p-4 space-y-2 hover:shadow-lg transition cursor-pointer"
              onClick={() => onSelect(os.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-foreground">
                    {os.imovel?.titulo || "Imóvel não informado"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {os.descricao_problema?.slice(0, 60)}...
                  </p>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(os);
                    }}
                  >
                    <Edit size={16} />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(os);
                    }}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {new Date(os.created_at).toLocaleDateString("pt-BR")}
                </span>

                <Badge status={os.status}>{os.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
