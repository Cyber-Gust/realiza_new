"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/admin/ui/Button";
import Modal from "@/components/admin/ui/Modal";
import { useToast } from "@/contexts/ToastContext";

import FinanceiroTable from "./FinanceiroTable";
import FinanceiroResumo from "./FinanceiroResumo";
import FinanceiroForm from "./FinanceiroForm";

export default function PagarPanel() {
  const [dados, setDados] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const toast = useToast();

  const carregar = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/financeiro?type=pagar", { cache: "no-store" });
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

      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Contas a Pagar</h3>

        <Button onClick={() => setOpen(true)} className="flex items-center gap-1">
          <Plus size={16} /> Novo Pagamento
        </Button>
      </div>

      {/* Resumo */}
      <FinanceiroResumo meta={meta} />

      {/* Tabela */}
      <FinanceiroTable data={dados} loading={loading} />

      {/* Modal */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Novo Lançamento a Pagar"
      >
        <FinanceiroForm
          tipoDefault="pagar"
          onSaved={carregar}
          onClose={() => setOpen(false)}
        />
      </Modal>

    </div>
  );
}
