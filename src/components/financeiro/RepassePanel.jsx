"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/contexts/ToastContext";

import FinanceiroTable from "./FinanceiroTable";
import FinanceiroResumo from "./FinanceiroResumo";

export default function RepassePanel() {
  const [dados, setDados] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const carregar = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/financeiro?type=repasse", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setDados(json.data || []);
      setMeta(json.meta || {});

    } catch (err) {
      toast.error("Erro ao carregar", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="space-y-4">

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">
          Repasses a Proprietários
        </h3>

        <Button
          onClick={carregar}
          variant="secondary"
          className="flex items-center gap-1"
          disabled={loading}
        >
          <RotateCcw size={16} /> Atualizar
        </Button>
      </div>

      <FinanceiroResumo meta={meta} />

      <FinanceiroTable data={dados} loading={loading} />

    </div>
  );
}
