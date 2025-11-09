"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";
import FinanceiroTable from "./FinanceiroTable";
import FinanceiroResumo from "./FinanceiroResumo";
import { RotateCcw } from "lucide-react";

export default function RepassePanel() {
  const [dados, setDados] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/financeiro?type=repasse", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDados(json.data || []);
      setMeta(json.meta || {});
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Repasses a Proprietários</h3>
        <Button onClick={carregar} variant="secondary" className="flex items-center gap-1">
          <RotateCcw size={16} /> Atualizar
        </Button>
      </div>

      <FinanceiroResumo meta={meta} />
      <FinanceiroTable data={dados} loading={loading} />
    </div>
  );
}
