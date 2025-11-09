"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";
import FinanceiroTable from "./FinanceiroTable";
import FinanceiroResumo from "./FinanceiroResumo";
import { Plus } from "lucide-react";
import Modal from "@/components/admin/ui/Modal";
import FinanceiroForm from "./FinanceiroForm";

export default function PagarPanel() {
  const [dados, setDados] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/financeiro?type=pagar", { cache: "no-store" });
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
        <h3 className="text-lg font-semibold text-foreground">Contas a Pagar</h3>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-1">
          <Plus size={16} /> Novo Pagamento
        </Button>
      </div>

      <FinanceiroResumo meta={meta} />
      <FinanceiroTable data={dados} loading={loading} />

      <Modal open={open} onOpenChange={setOpen} title="Novo Lançamento a Pagar">
        <FinanceiroForm
          tipoDefault="pagar"
          onSaved={carregar}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}
