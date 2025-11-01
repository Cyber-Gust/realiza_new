"use client";
import { useEffect, useMemo, useState } from "react";
import Card from "@/components/admin/ui/Card";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";
import PrecoHistoricoChart from "@/components/imoveis/PrecoHistoricoChart";
import VacanciaWidget from "@/components/imoveis/VacanciaWidget";
import { formatCurrency } from "@/utils/formatters";

export function FinanceiroPanel({ imovel }) {
  const [historico, setHistorico] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [ajuste, setAjuste] = useState({ tipo: "venda", valor: "" });
  const precoAtual = useMemo(() => ({
    venda: Number(imovel?.preco_venda || 0),
    locacao: Number(imovel?.preco_locacao || 0),
  }), [imovel]);

  const fetchHistorico = async () => {
    try {
      const r = await fetch(`/api/imoveis/${imovel.id}/preco`, { cache: "no-store" });
      if (r.status === 404) return setHistorico([]); // rota opcional
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao carregar histórico");
      setHistorico(Array.isArray(j?.data) ? j.data : []);
    } catch (e) {
      // fallback: manter vazio
    }
  };

  useEffect(() => {
    if (imovel?.id) fetchHistorico();
  }, [imovel?.id]);

  const registrarAjuste = async () => {
    try {
      if (!ajuste.valor || Number(ajuste.valor) <= 0) return Toast.error("Informe um valor válido");
      const r = await fetch(`/api/imoveis/${imovel.id}/preco`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: ajuste.tipo, valor: Number(ajuste.valor) })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao registrar ajuste");
      Toast.success("Ajuste registrado");
      setOpenModal(false);
      setAjuste({ tipo: "venda", valor: "" });
      setHistorico(Array.isArray(j?.data) ? j.data : []); // ideal: rota retorna histórico atualizado
    } catch (e) {
      Toast.error(e.message);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="Preço Atual" className="space-y-2">
        <p className="text-sm text-muted-foreground">Venda</p>
        <p className="text-xl font-semibold tracking-tight">{precoAtual.venda ? formatCurrency(precoAtual.venda) : "-"}</p>
        <p className="text-sm text-muted-foreground mt-3">Locação</p>
        <p className="text-xl font-semibold tracking-tight">{precoAtual.locacao ? formatCurrency(precoAtual.locacao) : "-"}</p>
        <Button className="mt-4" onClick={() => setOpenModal(true)}>Registrar Ajuste</Button>
      </Card>

      <Card title="Vacância">
        <VacanciaWidget imovelId={imovel.id} />
      </Card>

      <Card title="Histórico de Preços" className="col-span-2">
        <PrecoHistoricoChart data={historico} />
      </Card>

      {openModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-panel-card shadow-xl p-4">
            <h3 className="text-base font-semibold">Registrar Ajuste de Preço</h3>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-muted-foreground">Tipo</label>
                <select
                  value={ajuste.tipo}
                  onChange={(e) => setAjuste((p) => ({ ...p, tipo: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="venda">Venda</option>
                  <option value="locacao">Locação</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm text-muted-foreground">Novo Valor (R$)</label>
                <input
                  type="number"
                  min={0}
                  value={ajuste.valor}
                  onChange={(e) => setAjuste((p) => ({ ...p, valor: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <Button variant="secondary" onClick={() => setOpenModal(false)}>Cancelar</Button>
                <Button onClick={registrarAjuste}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinanceiroPanel;