"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import ImovelForm from "@/components/imoveis/ImovelForm";
import FinanceiroPanel from "@/components/imoveis/FinanceiroPanel";
import MidiaPanel from "@/components/imoveis/MidiaPanel";
import CompliancePanel from "@/components/imoveis/CompliancePanel";
import ChavesDialog from "@/components/imoveis/ChavesDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { KeyRound, Save } from "lucide-react";
import Toast from "@/components/admin/ui/Toast";
import useModal from "@/hooks/useModal";
import { formatCurrency } from "@/utils/formatters";

export default function ImovelDetailPage({ params }) {
  const [imovelId, setImovelId] = useState(null);
  const [imovel, setImovel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const modalChaves = useModal();

  // ✅ Corrigido: params é síncrono, não precisa de async/await
  useEffect(() => {
    let mounted = true;

    (async () => {
      const p = await params; // ✅ Desembrulha a Promise corretamente
      if (mounted && p?.id) setImovelId(p.id);
    })();

    return () => {
      mounted = false;
    };
  }, [params]);

  // 🔹 Carrega dados do imóvel
  const loadImovel = async (id) => {
    try {
      const res = await fetch(`/api/imoveis/list?id=${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar imóvel");
      setImovel(data.data?.[0] || null);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Salvar alterações gerais do imóvel
  const salvarAlteracoes = async () => {
    if (!imovel) return;
    setSaving(true);
    try {
      const res = await fetch("/api/imoveis/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imovel),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar alterações");
      setImovel(data.data);
      Toast.success("Imóvel atualizado com sucesso!");
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ✅ Carrega imóvel só depois de resolver o id
  useEffect(() => {
    if (imovelId) loadImovel(imovelId);
  }, [imovelId]);

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
      {/* 🔹 Cabeçalho com botão de salvar e controle de chaves */}
      <PageHeader
        title={imovel.titulo || "Imóvel sem título"}
        description={`${imovel.tipo?.toUpperCase()} • ${imovel.endereco_cidade || "-"} / ${
          imovel.endereco_estado || ""
        }`}
        rightSection={
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
                if (!imovel?.id) {
                  Toast.error("Imóvel ainda não carregado.");
                  return;
                }
                modalChaves.openModal();
              }}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <KeyRound size={16} /> Chaves
            </Button>
          </div>
        }
      />

      {/* 🔹 Abas do painel */}
      <Tabs defaultValue="cadastro" className="w-full">
        <TabsList className="bg-muted rounded-lg p-1 flex gap-2">
          <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="midia">Mídia</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* 🏠 Aba de Cadastro */}
        <TabsContent value="cadastro" className="mt-4">
          <ImovelForm data={imovel} onChange={setImovel} />
        </TabsContent>

        {/* 💰 Aba Financeiro */}
        <TabsContent value="financeiro" className="mt-4">
          <FinanceiroPanel imovel={imovel} onUpdateImovel={setImovel} />
        </TabsContent>

        {/* 🖼 Aba Mídia */}
        <TabsContent value="midia" className="mt-4">
          <MidiaPanel imovel={imovel} />
        </TabsContent>

        {/* ⚖️ Aba Compliance */}
        <TabsContent value="compliance" className="mt-4">
          <CompliancePanel imovelId={imovel.id} />
        </TabsContent>
      </Tabs>

      {/* 🔹 Info rodapé (datas + valores) */}
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

      {/* 🔹 Modal de controle de chaves */}
      <ChavesDialog
        imovelId={imovel.id}
        open={modalChaves.open}
        onClose={modalChaves.closeModal}
      />
    </div>
  );
}
