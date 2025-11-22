"use client";

import { useEffect, useState } from "react";
import { RotateCcw, MailWarning } from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/contexts/ToastContext";

import FinanceiroTable from "./FinanceiroTable";
import FinanceiroResumo from "./FinanceiroResumo";

export default function InadimplenciaPanel() {
  const [dados, setDados] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  const carregar = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/financeiro?type=inadimplencia", { cache: "no-store" });
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
          Inadimplência
        </h3>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={carregar} disabled={loading}>
            <RotateCcw size={16} /> Atualizar
          </Button>

          <Button className="bg-red-600 hover:bg-red-700 text-white">
            <MailWarning size={16} /> Notificar
          </Button>
        </div>
      </div>

      <FinanceiroResumo meta={meta} />

      <FinanceiroTable data={dados} loading={loading} />
    </div>
  );
}
