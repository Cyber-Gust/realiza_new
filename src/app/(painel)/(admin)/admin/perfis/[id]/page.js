"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import Toast from "@/components/admin/ui/Toast";
import Modal from "@/components/admin/ui/Modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// 🧩 Importa os formulários unificados
import PerfilFormEquipe from "@/components/perfis/PerfilFormEquipe";
import PerfilFormLeads from "@/components/perfis/PerfilFormLeads";
import PerfilFormPersonas from "@/components/perfis/PerfilFormPersonas";

// 🔹 Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PerfilDetailPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id: perfilId } = use(params);
  const [perfil, setPerfil] = useState(null);
  const [type, setType] = useState(searchParams.get("type") || "equipe");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 🔹 Carrega perfil
  useEffect(() => {
    if (perfilId) loadPerfil(perfilId);
  }, [perfilId]);

  const loadPerfil = async (id) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/perfis/list?id=${id}&type=${type}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao carregar perfil");

      const record = json.data;
      setPerfil(record);

      // Ajusta tipo automaticamente se não veio na URL
      if (!searchParams.get("type") && record) {
        if (record.role) setType("equipe");
        else if (record.status) setType("leads");
        else if (record.tipo) setType("personas");
      }
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Upload de foto (só para corretores)
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id", perfilId);
      formData.append("type", type);

      const res = await fetch("/api/perfis/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro no upload");

      setPerfil((p) => ({ ...p, avatar_url: json.avatar_url }));
      Toast.success("Foto atualizada com sucesso!");
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Deletar perfil
  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch("/api/perfis/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: perfilId, type }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      Toast.success(json.message || "Perfil removido!");
      router.push("/admin/perfis");
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setDeleting(false);
      setOpenDelete(false);
    }
  };

  if (loading)
    return (
      <p className="text-center p-10 text-muted-foreground flex items-center justify-center gap-2">
        <Loader2 className="animate-spin" /> Carregando perfil...
      </p>
    );

  if (!perfil)
    return (
      <p className="text-center p-10 text-muted-foreground">
        Perfil não encontrado.
      </p>
    );

  const isAdmin = perfil?.role === "admin";
  const canBeDeleted = type !== "equipe" || (perfil.role && perfil.role !== "admin");

  return (
    <div className="space-y-6">
      {/* 🔹 Cabeçalho */}
      <PageHeader
        title={perfil.nome_completo || perfil.nome || "Perfil"}
        description={`Tipo: ${type}`}
        rightSection={
          <div className="flex gap-2">
            {canBeDeleted && (
              <Button
                onClick={() => setOpenDelete(true)}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 size={16} /> Remover
              </Button>
            )}
            <Link href="/admin/perfis">
              <Button variant="secondary" className="flex items-center gap-2">
                <ArrowLeft size={16} /> Voltar
              </Button>
            </Link>
          </div>
        }
      />

      {/* 🔹 Tabs */}
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="bg-muted rounded-lg p-1 flex gap-2">
          <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
          <TabsTrigger value="outros">Outros</TabsTrigger>
        </TabsList>

        {/* 🧩 Aba 1 */}
        <TabsContent value="dados" className="mt-4">
          <Card className="p-6 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="relative">
                <Image
                  src={perfil.avatar_url || "/placeholder-avatar.png"}
                  alt="Avatar"
                  width={140}
                  height={140}
                  className="rounded-full border border-border object-cover"
                />

                {/* Upload só para corretor */}
                {perfil.role === "corretor" && (
                  <label className="absolute bottom-0 right-0 cursor-pointer bg-accent text-white p-2 rounded-full shadow hover:opacity-90">
                    {uploading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Formulários dinâmicos */}
              <div className="flex-1">
                {type === "equipe" && (
                  <PerfilFormEquipe
                    modo="edit"
                    dadosIniciais={perfil}
                    onSuccess={() => loadPerfil(perfilId)}
                    readOnly={perfil.role === "admin"} // 👈 habilita modo só leitura para admin
                  />
                )}
                {type === "leads" && (
                  <PerfilFormLeads
                    modo="edit"
                    dadosIniciais={perfil}
                    onSuccess={() => loadPerfil(perfilId)}
                  />
                )}
                {type === "personas" && (
                  <PerfilFormPersonas
                    modo="edit"
                    dadosIniciais={perfil}
                    onSuccess={() => loadPerfil(perfilId)}
                  />
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 🗂 Aba 2 */}
        <TabsContent value="outros" className="mt-4">
          <Card className="p-6 space-y-3">
            {perfil.observacoes !== undefined && (
              <textarea
                placeholder="Observações"
                value={perfil.observacoes || ""}
                readOnly={isAdmin}
                onChange={(e) =>
                  setPerfil((p) => ({ ...p, observacoes: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
                rows={3}
              />
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* 🔹 Modal de confirmação */}
      <Modal
        open={openDelete}
        onOpenChange={setOpenDelete}
        title="Confirmar exclusão"
      >
        <div className="space-y-3">
          <p className="text-muted-foreground">
            Tem certeza que deseja remover este perfil? Essa ação é irreversível.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpenDelete(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Removendo...
                </>
              ) : (
                <>
                  <Trash2 size={16} /> Remover
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
