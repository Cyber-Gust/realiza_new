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

import { createClient } from "@/lib/supabase/client";
import { Input, Label, Select } from "../admin/ui/Form";

/* ============================================================
   💰 UTILITÁRIO MONETÁRIO
============================================================ */
export const formatBRL = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);

export const parseCurrencyToNumber = (raw) => {
  if (!raw) return 0;
  const digits = raw.replace(/\D/g, "");
  return Number(digits) / 100;
};

export default function FinanceiroPanel({ imovel, onUpdateImovel }) {
  const { success, error } = useToast();

  const [historico, setHistorico] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [ajuste, setAjuste] = useState({
    tipo: "venda",
    valor: "",
  });

  /* ============================================================
     📌 PREÇOS ATUAIS
  ============================================================ */
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
     📈 HISTÓRICO
  ============================================================ */
  const fetchHistorico = useCallback(async () => {
    if (!imovel?.id) return;

    try {
      const r = await fetch(`/api/imoveis/${imovel.id}?action=precos`, {
        cache: "no-store",
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j.error);

      setHistorico(Array.isArray(j?.data) ? j.data : []);
    } catch (e) {
      console.error(e);
    }
  }, [imovel?.id]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  /* ============================================================
     📝 REGISTRAR AJUSTE
  ============================================================ */
  const registrarAjuste = async () => {
    const valorNumerico = parseCurrencyToNumber(ajuste.valor);

    if (!valorNumerico || valorNumerico <= 0)
      return error("Atenção", "Informe um valor válido");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user)
        return error("Sessão expirada", "Faça login novamente.");

      const r = await fetch(
        `/api/imoveis/${imovel.id}?action=precos_add`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: ajuste.tipo,
            valor: valorNumerico,
            usuario_id: user.id,
          }),
        }
      );

      const j = await r.json();
      if (!r.ok) throw new Error(j.error);

      success("Sucesso", "Ajuste registrado com sucesso!");

      setOpenModal(false);
      setAjuste({ tipo: "venda", valor: "" });

      onUpdateImovel?.({
        ...imovel,
        ...(ajuste.tipo === "venda" && { preco_venda: valorNumerico }),
        ...(ajuste.tipo === "locacao" && { preco_locacao: valorNumerico }),
      });

      fetchHistorico();
    } catch (e) {
      error("Erro", e.message);
    }
  };

  /* ============================================================
     🔄 DISPONIBILIDADE
  ============================================================ */
  const atualizarDisponibilidade = async (novaDisponibilidade) => {
    try {
      const r = await fetch(`/api/imoveis/${imovel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disponibilidade: novaDisponibilidade }),
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j.error);

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
     🧱 RENDER
  ============================================================ */
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* 💰 PREÇO ATUAL */}
      <Card>
        <CardHeader>
          <CardTitle>Preço Atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Venda</p>
              <p className="text-xl font-semibold">
                {precoAtual.venda ? formatBRL(precoAtual.venda) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Locação</p>
              <p className="text-xl font-semibold">
                {precoAtual.locacao ? formatBRL(precoAtual.locacao) : "-"}
              </p>
            </div>
          </div>

          <Select
            value={imovel.disponibilidade ?? "venda"}
            onChange={(e) => atualizarDisponibilidade(e.target.value)}
          >
            <option value="venda">Venda</option>
            <option value="locacao">Locação</option>
            <option value="ambos">Ambos</option>
          </Select>

          <Button onClick={() => setOpenModal(true)}>
            Registrar Ajuste
          </Button>
        </CardContent>
      </Card>

      {/* 📦 CUSTOS */}
      <Card>
        <CardHeader>
          <CardTitle>Custos Mensais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Condomínio</span>
            <span>{formatBRL(precoAtual.condominio)}</span>
          </div>
          <div className="flex justify-between">
            <span>IPTU</span>
            <span>{formatBRL(precoAtual.iptu)}</span>
          </div>

          <VacanciaWidget imovelId={imovel.id} />
        </CardContent>
      </Card>

      {/* 📈 HISTÓRICO */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Histórico de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <PrecoHistoricoChart data={historico} />
        </CardContent>
      </Card>

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
        <div className="space-y-4">
          <Select
            value={ajuste.tipo}
            onChange={(e) =>
              setAjuste((p) => ({ ...p, tipo: e.target.value }))
            }
          >
            <option value="venda">Venda</option>
            <option value="locacao">Locação</option>
          </Select>

          <div>
            <Label>Novo Valor</Label>
            <Input
              value={ajuste.valor}
              placeholder="R$ 0,00"
              onChange={(e) => {
                const raw = e.target.value;
                const numeric = parseCurrencyToNumber(raw);
                setAjuste((p) => ({
                  ...p,
                  valor: formatBRL(numeric),
                }));
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
