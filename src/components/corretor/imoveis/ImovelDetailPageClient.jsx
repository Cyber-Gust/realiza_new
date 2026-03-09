"use client";
import { useEffect, useState } from "react";

import { Card } from "@/components/admin/ui/Card";

import { useUser } from "@/contexts/UserContext";

import ImovelForm from "./ImovelForm";
import FinanceiroPanel from "./FinanceiroPanel";
import MidiaPanel from "./MidiaPanel";
import CompliancePanel from "./CompliancePanel";
import ChavesDialog from "./ChavesDialog";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin/ui/Tabs";
import { Button } from "@/components/admin/ui/Button";

import { AlertTriangle, KeyRound, Save, Trash2, Printer } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import useModal from "@/hooks/useModal";

import { formatCurrency } from "@/utils/formatters";
import { BackButton } from "@/components/admin/ui/BackButton";
import Modal from "@/components/admin/ui/Modal";
import FichaImovelPrint from "@/components/imoveis/FichaImovelPrint";

export default function ImovelDetailPageClient({ imovelId }) {
  const { user, profile } = useUser();
  const toast = useToast();

  const [imovel, setImovel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [proprietario, setProprietario] = useState(null);
  const [captador, setCaptador] = useState(null);
  const router = useRouter();

  const isAdmin = profile?.role === "admin";
  const isOwner =
  String(imovel?.corretor_id) === String(user?.id);
  const canEdit = isAdmin || isOwner;

  const [tab, setTab] = useState("cadastro");

  const modalChaves = useModal();

  /* ======================================================
     🔥 LOAD IMÓVEL
  ====================================================== */
  useEffect(() => {
    const loadImovel = async () => {
      try {
        const res = await fetch(`/api/imoveis/${imovelId}`, { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Erro ao carregar imóvel");

        setImovel(data.data || null);
        const im = data.data;

      if (im?.proprietario_id) {
        const resProp = await fetch(`/api/perfis/list?type=personas&id=${im.proprietario_id}`);
        const dataProp = await resProp.json();
        setProprietario(dataProp.data);
      }

      if (im?.corretor_id) {
        const resCap = await fetch(`/api/perfis/list?type=equipe&id=${im.corretor_id}`);
        const dataCap = await resCap.json();
        setCaptador(dataCap.data);
      }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (imovelId) loadImovel();
  }, [imovelId, toast]);

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
      🔥 REMOVER IMÓVEL
  ====================================================== */    
  const removerImovel = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);

      const res = await fetch(`/api/imoveis/${imovelId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao remover imóvel");

      toast.success("Imóvel removido com sucesso!");

      // Mandar o usuário de volta pra listagem
      router.push("/admin/imoveis");

    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
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
    <>
    <div className="space-y-6 print:hidden">

      <BackButton />

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

        <div className="space-y-2">

          {!canEdit && (
            <p className="text-sm text-yellow-600 flex items-center gap-2">
              <AlertTriangle size={14} />
              Você não pode editar este imóvel
            </p>
          )}

          {/* TITULO DO IMÓVEL */}
          <h1 className="text-2xl font-bold">
            {imovel.titulo || "Imóvel sem título"}
          </h1>

          {/* ENDEREÇO */}
          <p className="text-sm text-muted-foreground">
            <strong>Endereço:</strong>{" "}
            {imovel.endereco_logradouro || "-"}, {imovel.endereco_numero || ""} •{" "}
            {imovel.endereco_bairro || "-"} •{" "}
            {imovel.endereco_cidade || "-"} / {imovel.endereco_estado || ""}
          </p>

          {/* INFO */}
          <div className="flex flex-wrap gap-4 text-sm mt-2">

            <span>
              <strong>Proprietário:</strong>{" "}
              {proprietario?.nome || "Não informado"}
            </span>

            <span>
              <strong>Captador:</strong>{" "}
              {captador?.nome_completo || "Não informado"}
            </span>

            <span>
              <strong>Código:</strong>{" "}
              {imovel.codigo_ref || "-"}
            </span>

            <span>
              <strong>Status:</strong>{" "}
              {imovel.status || "-"}
            </span>

          </div>

        </div>

        <div className="flex flex-wrap gap-2">
          {/* BOTÃO DE IMPRESSÃO AQUI */}
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Printer size={16} /> Imprimir Ficha
            </Button>
          {tab !== "midia" && (
            <Button
              onClick={salvarAlteracoes}
              disabled={!canEdit || saving}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          )}

          <Button
            onClick={() => {
              modalChaves.openModal();
            }}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <KeyRound size={16} /> Chaves
          </Button>

          <Button
            onClick={() => setDeleteTarget(imovel)}
            disabled={!canEdit}
            variant="destructive"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 size={16} />
            Remover
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
          <ImovelForm data={imovel} onChange={setImovel} disabled={!canEdit} />
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4">
          <FinanceiroPanel imovel={imovel} onUpdateImovel={setImovel} disabled={!canEdit} />
        </TabsContent>

        <TabsContent value="midia" className="mt-4">
          <MidiaPanel imovel={imovel} disabled={!canEdit} />
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <CompliancePanel imovelId={imovelId} disabled={!canEdit} />
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

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Imóvel"
      >
        {deleteTarget && (
          <div className="space-y-5">

            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-1" />
              <div>
                <p>
                  Tem certeza que deseja remover o imóvel{" "}
                  <strong>{deleteTarget.titulo}</strong>?
                </p>

                <p className="text-sm text-muted-foreground mt-1">
                  Esta operação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="w-1/2"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </Button>

              <Button
                className="w-1/2 bg-red-600 hover:bg-red-700 text-white"
                onClick={removerImovel}
                disabled={deleting}
              >
                {deleting ? "Removendo..." : "Confirmar"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
    <FichaImovelPrint imovel={imovel} captador={captador} />
    </>
  );
}
