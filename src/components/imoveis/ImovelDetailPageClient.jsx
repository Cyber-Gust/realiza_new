"use client";

import { useEffect, useState } from "react";

import { Card } from "@/components/admin/ui/Card";

import { useUser } from "@/contexts/UserContext";

import ImovelForm from "@/components/imoveis/ImovelForm";
import FinanceiroPanel from "@/components/imoveis/FinanceiroPanel";
import MidiaPanel from "@/components/imoveis/MidiaPanel";
import CompliancePanel from "@/components/imoveis/CompliancePanel";
import ChavesDialog from "@/components/imoveis/ChavesDialog";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin/ui/Tabs";
import { Button } from "@/components/admin/ui/Button";

import { KeyRound, Save } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import useModal from "@/hooks/useModal";

import { formatCurrency } from "@/utils/formatters";

export default function ImovelDetailPageClient({ imovelId }) {
  const { user, profile } = useUser();
  const toast = useToast();

  const [imovel, setImovel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tab, setTab] = useState("cadastro");

  const modalChaves = useModal();

  /* ======================================================
     🔥 LOAD IMÓVEL
  ====================================================== */
  const loadImovel = async () => {
    try {
      const res = await fetch(`/api/imoveis/${imovelId}`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao carregar imóvel");

      setImovel(data.data || null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (imovelId) loadImovel();
  }, [imovelId]);

  /* ======================================================
     🔥 SALVAR ALTERAÇÕES
  ====================================================== */
  const salvarAlteracoes = async () => {
    if (!imovel) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/imoveis/${imovelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imovel),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar alterações");

      setImovel(data.data);
      toast.success("Imóvel atualizado com sucesso!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ======================================================
     🔥 RENDER
  ====================================================== */
  if (loading)
    return (
      <p className="text-center p-10 text-muted-foreground">
        Carregando imóvel...
      </p>
    );

  if (!imovel)
    return (
      <p className="text-center p-10 text-muted-foreground">
        Imóvel não encontrado.
      </p>
    );

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {imovel.titulo || "Imóvel sem título"}
          </h1>

          <p className="text-muted-foreground text-sm mt-1">
            {`${imovel.tipo?.toUpperCase()} • ${imovel.endereco_cidade || "-"} / ${
              imovel.endereco_estado || ""
            }`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={salvarAlteracoes}
            disabled={saving}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? "Salvando..." : "Salvar"}
          </Button>

          <Button
            onClick={() => {
              modalChaves.openModal();
            }}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <KeyRound size={16} /> Chaves
          </Button>
        </div>
      </div>

      {/* TABS */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted p-1 flex gap-2">
          <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="midia">Mídia</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="cadastro" className="mt-4">
          <ImovelForm data={imovel} onChange={setImovel} />
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4">
          <FinanceiroPanel imovel={imovel} onUpdateImovel={setImovel} />
        </TabsContent>

        <TabsContent value="midia" className="mt-4">
          <MidiaPanel imovel={imovel} />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <CompliancePanel imovelId={imovelId} />
        </TabsContent>
      </Tabs>

      {/* FOOTER */}
      <Card className="p-4 text-sm text-muted-foreground">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <p>
            <strong>Criado em:</strong>{" "}
            {new Date(imovel.created_at).toLocaleDateString("pt-BR")}
          </p>

          <p>
            <strong>Última atualização:</strong>{" "}
            {new Date(imovel.updated_at).toLocaleDateString("pt-BR")}
          </p>

          <p>
            <strong>Valor de Venda:</strong>{" "}
            {formatCurrency(imovel.preco_venda)}
          </p>

          <p>
            <strong>Valor de Locação:</strong>{" "}
            {formatCurrency(imovel.preco_locacao)}
          </p>
        </div>
      </Card>

      {/* MODAL CHAVES */}
      <ChavesDialog
        imovelId={imovelId}
        open={modalChaves.open}
        onClose={modalChaves.closeModal}
        userId={user?.id}    // 🔥 Agora SEM ERRO!
      />
    </div>
  );
}
