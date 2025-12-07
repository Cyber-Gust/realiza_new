"use client";

import { useEffect, useMemo, useState, useCallback } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/admin/ui/Card";

import { Button } from "@/components/admin/ui/Button";
import Modal from "@/components/admin/ui/Modal";
import { useToast } from "@/contexts/ToastContext";

import PrecoHistoricoChart from "@/components/imoveis/PrecoHistoricoChart";
import VacanciaWidget from "@/components/imoveis/VacanciaWidget";

import { formatCurrency } from "@/utils/formatters";
import { createClient } from "@/lib/supabase/client";
import { Input, Label, Select } from "../admin/ui/Form";

export default function FinanceiroPanel({ imovel, onUpdateImovel }) {
  const { success, error } = useToast();

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

  /* ============================================================
      🔹 BUSCAR HISTÓRICO (GET action=precos)
  ============================================================ */
  const fetchHistorico = useCallback(async () => {
    if (!imovel?.id) return;

    try {
      const r = await fetch(`/api/imoveis/${imovel.id}?action=precos`, {
        cache: "no-store",
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao carregar histórico");

      setHistorico(Array.isArray(j?.data) ? j.data : []);
    } catch (e) {
      console.error("Erro ao buscar histórico:", e);
    }
  }, [imovel?.id]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  /* ============================================================
      🔹 REGISTRAR AJUSTE (PUT action=precos_add)
  ============================================================ */
  const registrarAjuste = async () => {
    try {
      if (!ajuste.valor || Number(ajuste.valor) <= 0)
        return error("Atenção", "Informe um valor válido");

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user)
        return error("Autenticação", "Sessão expirada. Faça login novamente.");

      const r = await fetch(
        `/api/imoveis/${imovel.id}?action=precos_add`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: ajuste.tipo,
            valor: Number(ajuste.valor),
            usuario_id: user.id,
          }),
        }
      );

      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao registrar ajuste");

      success("Sucesso", "Ajuste registrado com sucesso!");

      setOpenModal(false);
      setAjuste({ tipo: "venda", valor: "" });

      const novo = { ...imovel };
      if (ajuste.tipo === "venda") novo.preco_venda = Number(ajuste.valor);
      if (ajuste.tipo === "locacao") novo.preco_locacao = Number(ajuste.valor);

      onUpdateImovel?.(novo);

      fetchHistorico();
    } catch (e) {
      error("Erro", e.message);
    }
  };

  /* ============================================================
      🔹 ATUALIZAR DISPONIBILIDADE
         (PUT /api/imoveis/:id)
  ============================================================ */
  const atualizarDisponibilidade = async (novaDisponibilidade) => {
    try {
      const r = await fetch(`/api/imoveis/${imovel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disponibilidade: novaDisponibilidade,
        }),
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao atualizar");

      success("Sucesso", "Disponibilidade atualizada!");

      onUpdateImovel?.({
        ...imovel,
        disponibilidade: novaDisponibilidade,
      });
    } catch (e) {
      error("Erro", e.message);
    }
  };

  /* ============================================================
      🔹 RENDER
  ============================================================ */
  return (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-x-hidden min-w-0">

    {/* 💰 PREÇO ATUAL */}
    <div className="w-full min-w-0">
      <Card className="min-w-0 w-full">
        <CardHeader>
          <CardTitle>Preço Atual</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-between flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground">Venda</p>
              <p className="text-xl font-semibold">
                {precoAtual.venda ? formatCurrency(precoAtual.venda) : "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Locação</p>
              <p className="text-xl font-semibold">
                {precoAtual.locacao ? formatCurrency(precoAtual.locacao) : "-"}
              </p>
            </div>
          </div>

          {/* Disponibilidade */}
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-sm text-muted-foreground">Disponibilidade</label>

            <Select
              value={imovel.disponibilidade ?? "venda"}
              onChange={(e) => atualizarDisponibilidade(e.target.value)}
            >
              <option value="venda">Venda</option>
              <option value="locacao">Locação</option>
              <option value="ambos">Ambos</option>
            </Select>
          </div>

          <Button className="mt-4" onClick={() => setOpenModal(true)}>
            Registrar Ajuste
          </Button>
        </CardContent>
      </Card>
    </div>

    {/* 📦 CUSTOS MENSAIS */}
    <div className="w-full min-w-0">
      <Card className="min-w-0 w-full">
        <CardHeader>
          <CardTitle>Custos Mensais</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex justify-between flex-wrap">
            <p className="text-sm text-muted-foreground">Condomínio</p>
            <p className="text-base font-medium">
              {precoAtual.condominio ? formatCurrency(precoAtual.condominio) : "-"}
            </p>
          </div>

          <div className="flex justify-between flex-wrap">
            <p className="text-sm text-muted-foreground">IPTU</p>
            <p className="text-base font-medium">
              {precoAtual.iptu ? formatCurrency(precoAtual.iptu) : "-"}
            </p>
          </div>

          <VacanciaWidget imovelId={imovel.id} className="mt-4" />
        </CardContent>
      </Card>
    </div>

    {/* 📈 HISTÓRICO */}
    <div className="col-span-1 md:col-span-2 w-full min-w-0">
      <Card className="min-w-0 w-full">
        <CardHeader>
          <CardTitle>Histórico de Preços</CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <div className="min-w-full">
            <PrecoHistoricoChart data={historico} />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* 🪟 MODAL */}
    <Modal
      isOpen={openModal}
      onClose={() => setOpenModal(false)}
      title="Registrar Ajuste de Preço"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpenModal(false)}>
            Cancelar
          </Button>

          <Button onClick={registrarAjuste}>Salvar</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 mt-2">
        {/* Tipo */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">Tipo</label>

          <Select
            value={ajuste.tipo}
            onChange={(e) => setAjuste((p) => ({ ...p, tipo: e.target.value }))}
          >
            <option value="venda">Venda</option>
            <option value="locacao">Locação</option>
          </Select>
        </div>

        {/* Valor */}
        <div className="flex flex-col gap-1">
          <Label className="text-sm rounded-xl text-muted-foreground">
            Novo Valor (R$)
          </Label>

          <Input
            type="number"
            min={0}
            value={ajuste.valor}
            onChange={(e) =>
              setAjuste((p) => ({ ...p, valor: e.target.value }))
            }
          />
        </div>
      </div>
    </Modal>

  </div>
);
}