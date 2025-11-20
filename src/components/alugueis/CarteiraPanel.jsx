"use client";

import { useState, useEffect } from "react";
import Card from "@/components/admin/ui/Card";
import Toast from "@/components/admin/ui/Toast";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Home, User2 } from "lucide-react";

export default function CarteiraPanel() {
  const [loading, setLoading] = useState(true);
  const [carteira, setCarteira] = useState([]);
  const [filter, setFilter] = useState("todos"); // ativo, pendente, atrasado, regular

  useEffect(() => {
    loadCarteira();
  }, []);

  const loadCarteira = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alugueis?view=carteira", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCarteira(json.data || []);
    } catch (err) {
      Toast.error("Erro ao carregar carteira: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // ⚡ FILTRO DINÂMICO
  // ================================
  const filtered = carteira.filter((c) => {
    if (filter === "todos") return true;
    return c.status_financeiro === filter;
  });

  // ================================
  // 🎨 COR DO BADGE
  // ================================
  const badgeColor = (status) => {
    const map = {
      atrasado: "bg-red-600",
      pendente: "bg-yellow-600",
      regular: "bg-emerald-600",
    };
    return map[status] || "bg-muted";
  };

  // ================================
  // ⏳ LOADING
  // ================================
  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Carregando carteira...
      </div>
    );

  // ================================
  // 📭 SEM CONTRATOS
  // ================================
  if (carteira.length === 0)
    return (
      <p className="text-muted-foreground text-center py-6">
        Nenhum contrato de locação ativo encontrado.
      </p>
    );

  return (
    <div className="space-y-4">
      {/* ==================================================
          🔹 HEADER COM FILTROS + RELOAD
      ================================================== */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Home size={18} /> Carteira de Locações
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* SELECT STATUS */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
          >
            <option value="todos">Todos os contratos</option>
            <option value="regular">Regulares</option>
            <option value="pendente">Pendentes</option>
            <option value="atrasado">Atrasados</option>
          </select>

          {/* BUTTON RELOAD */}
          <Button
            variant="outline"
            onClick={loadCarteira}
            className="flex gap-2 items-center"
          >
            <RefreshCcw size={15} /> Atualizar
          </Button>
        </div>
      </div>

      {/* ==================================================
          🔹 GRID DE CONTRATOS
      ================================================== */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <Card
            key={c.id}
            className="p-4 space-y-3 hover:shadow-lg transition cursor-pointer"
          >
            {/* TÍTULO */}
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-foreground">
                {c.imoveis?.titulo || "Imóvel"}
              </h4>

              <span
                className={`px-2 py-0.5 text-xs rounded-full text-white ${badgeColor(
                  c.status_financeiro
                )}`}
              >
                {c.status_financeiro}
              </span>
            </div>

            {/* INFORMAÇÕES */}
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground flex items-center gap-1">
                <User2 size={14} /> Inquilino:{" "}
                <span className="text-foreground">
                  {c.inquilino?.nome || "-"}
                </span>
              </p>

              <p className="text-muted-foreground">
                Valor mensal:{" "}
                <span className="text-foreground font-medium">
                  R$ {Number(c.valor_acordado).toFixed(2)}
                </span>
              </p>

              <p className="text-muted-foreground">
                Início:{" "}
                <span className="text-foreground">{c.data_inicio}</span>
              </p>
              <p className="text-muted-foreground">
                Fim:{" "}
                <span className="text-foreground">{c.data_fim}</span>
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
