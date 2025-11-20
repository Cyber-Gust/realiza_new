"use client";

import { useState, useEffect } from "react";
import Toast from "@/components/admin/ui/Toast";
import Card from "@/components/admin/ui/Card";
import { Button } from "@/components/ui/button";
import Table from "@/components/admin/ui/Table";
import { Loader2, Wallet, RefreshCcw } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

export default function InadimplenciaPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("todos"); // pendente | atrasado | todos

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/alugueis?view=inadimplencia", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data || []);
    } catch (err) {
      Toast.error("Erro ao carregar inadimplência: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ================================
  // 🎯 FILTRAGEM
  // ================================
  const filtered = data.filter((item) => {
    if (filterStatus === "todos") return true;
    return item.status === filterStatus;
  });

  // ================================
  // 🎨 BADGE DE STATUS
  // ================================
  const statusBadge = (status) => {
    const map = {
      atrasado: "bg-red-600",
      pendente: "bg-yellow-600",
    };
    return map[status] || "bg-muted";
  };

  // ================================
  // ⏳ LOADING
  // ================================
  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Carregando inadimplência...
      </div>
    );

  // ================================
  // 📭 SEM REGISTROS
  // ================================
  if (!data.length)
    return (
      <p className="text-muted-foreground py-6 text-center">
        Nenhum lançamento pendente ou atrasado.
      </p>
    );

  // ================================
  // 🧱 COLUNAS DA TABELA
  // ================================
  const columns = [
    { key: "imovel", label: "Imóvel" },
    { key: "inquilino", label: "Inquilino" },
    { key: "status", label: "Status" },
    { key: "vencimento", label: "Vencimento" },
    { key: "valor", label: "Valor" },
  ];

  const tableData = filtered.map((item) => ({
    imovel: item.contratos?.imoveis?.titulo || "-",
    inquilino: item.contratos?.inquilino?.nome || "-",
    status: (
      <span
        className={`px-2 py-0.5 text-xs rounded-full text-white ${statusBadge(
          item.status
        )}`}
      >
        {item.status}
      </span>
    ),
    vencimento: item.data_vencimento,
    valor: <span className="font-medium text-red-600">{formatCurrency(item.valor)}</span>,
  }));

  return (
    <div className="space-y-4">
      {/* ==================================================
          🔹 HEADER
      ================================================== */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Wallet size={18} /> Inadimplência Geral
        </h3>

        <div className="flex items-center gap-2 flex-wrap">
          {/* SELECT DE STATUS */}
          <select
            className="border border-border rounded-md p-2 bg-panel-card text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="atrasado">Atrasados</option>
          </select>

          {/* BOTÃO RELOAD */}
          <Button
            variant="outline"
            onClick={load}
            className="flex items-center gap-2"
          >
            <RefreshCcw size={15} /> Atualizar
          </Button>
        </div>
      </div>

      {/* ==================================================
          🔹 TABELA RESPONSIVA
      ================================================== */}
      <Card className="p-0 overflow-hidden border border-border">
        <Table columns={columns} data={tableData} />
      </Card>
    </div>
  );
}
