"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import Card from "@/components/admin/ui/Card";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";
import PrecoHistoricoChart from "@/components/imoveis/PrecoHistoricoChart";
import VacanciaWidget from "@/components/imoveis/VacanciaWidget";
import { formatCurrency } from "@/utils/formatters";
import { createClient } from "@/lib/supabase/client";

export default function FinanceiroPanel({ imovel, onUpdateImovel }) {
  const [historico, setHistorico] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [ajuste, setAjuste] = useState({ tipo: "venda", valor: "" });

  const precoAtual = useMemo(
    () => ({
      venda: Number(imovel?.preco_venda || 0),
      locacao: Number(imovel?.preco_locacao || 0),
      condominio: Number(imovel?.valor_condominio || 0),
      iptu: Number(imovel?.valor_iptu || 0),
    }),
    [imovel]
  );

  // 🔄 Busca histórico de preços
  const fetchHistorico = useCallback(async () => {
    try {
      const r = await fetch(`/api/imoveis/${imovel.id}/preco`, { cache: "no-store" });
      if (r.status === 404) return setHistorico([]);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao carregar histórico");
      setHistorico(Array.isArray(j?.data) ? j.data : []);
    } catch (e) {
      console.error("Erro ao buscar histórico:", e);
    }
  }, [imovel?.id]);

  useEffect(() => {
    if (imovel?.id) fetchHistorico();
  }, [imovel?.id, fetchHistorico]);

  const registrarAjuste = async () => {
    try {
      if (!ajuste.valor || Number(ajuste.valor) <= 0)
        return Toast.error("Informe um valor válido");

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return Toast.error("Sessão expirada. Faça login novamente.");

      const r = await fetch(`/api/imoveis/${imovel.id}/preco`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: ajuste.tipo,
          valor: Number(ajuste.valor),
          usuario_id: user.id,
        }),
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao registrar ajuste");

      Toast.success("Ajuste registrado com sucesso!");
      setOpenModal(false);
      setAjuste({ tipo: "venda", valor: "" });

      const novoImovel = { ...imovel };
      if (ajuste.tipo === "venda") novoImovel.preco_venda = Number(ajuste.valor);
      if (ajuste.tipo === "locacao") novoImovel.preco_locacao = Number(ajuste.valor);
      onUpdateImovel?.(novoImovel);

      await fetchHistorico();
    } catch (e) {
      Toast.error(e.message);
    }
  };

  // 🔁 Atualiza disponibilidade no Supabase
  const atualizarDisponibilidade = async (novaDisponibilidade) => {
    try {
      const r = await fetch(`/api/imoveis/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: imovel.id, disponibilidade: novaDisponibilidade }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao atualizar disponibilidade");

      Toast.success("Disponibilidade atualizada");
      onUpdateImovel?.({ ...imovel, disponibilidade: novaDisponibilidade });
    } catch (e) {
      Toast.error(e.message);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* 💰 Painel de Preços */}
      <Card title="Preço Atual" className="space-y-2">
        <div className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Venda</p>
            <p className="text-xl font-semibold tracking-tight">
              {precoAtual.venda ? formatCurrency(precoAtual.venda) : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Locação</p>
            <p className="text-xl font-semibold tracking-tight">
              {precoAtual.locacao ? formatCurrency(precoAtual.locacao) : "-"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">Disponibilidade</label>
          <select
            className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
            value={imovel.disponibilidade ?? "venda"}
            onChange={(e) => atualizarDisponibilidade(e.target.value)}
          >
            <option value="venda">Venda</option>
            <option value="locacao">Locação</option>
            <option value="ambos">Ambos</option>
          </select>
        </div>

        <Button className="mt-4" onClick={() => setOpenModal(true)}>
          Registrar Ajuste
        </Button>
      </Card>

      {/* 🏢 Painel de Custos Fixos */}
      <Card title="Custos Mensais">
        <div className="space-y-2">
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Condomínio</p>
            <p className="text-base font-medium">
              {precoAtual.condominio ? formatCurrency(precoAtual.condominio) : "-"}
            </p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">IPTU</p>
            <p className="text-base font-medium">
              {precoAtual.iptu ? formatCurrency(precoAtual.iptu) : "-"}
            </p>
          </div>
        </div>
        <VacanciaWidget imovelId={imovel.id} className="mt-4" />
      </Card>

      {/* 📈 Histórico de Preços */}
      <Card title="Histórico de Preços" className="col-span-2">
        <PrecoHistoricoChart data={historico} />
      </Card>

      {/* 🪟 Modal de Ajuste */}
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
                  className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
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
                  className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <Button variant="secondary" onClick={() => setOpenModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={registrarAjuste}>Salvar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
