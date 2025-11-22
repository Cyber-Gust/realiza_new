"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// UI
import { Card } from "@/components/admin/ui/Card";
import Modal from "@/components/admin/ui/Modal";
import { Button } from "@/components/admin/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/admin/ui/Tabs";
import { Label, Textarea } from "@/components/admin/ui/Form";
import { useToast } from "@/contexts/ToastContext";

import { ArrowLeft, Upload, Trash2, Loader2 } from "lucide-react";

// Perfis
import PerfilFormEquipe from "@/components/perfis/PerfilFormEquipe";
import PerfilFormLeads from "@/components/perfis/PerfilFormLeads";
import PerfilFormPersonas from "@/components/perfis/PerfilFormPersonas";

// Supabase
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PerfilDetailPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id: perfilId } = use(params);

  const { success, error } = useToast();

  const [perfil, setPerfil] = useState(null);
  const [type, setType] = useState(searchParams.get("type") || "equipe");

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ➤ Aba controlada (necessário para o Tabs do seu DS)
  const [tab, setTab] = useState("dados");

  // ───────────────────────────────
  // LOAD PERFIL
  // ───────────────────────────────
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
      if (!res.ok) throw new Error(json.error);

      const record = json.data;
      setPerfil(record);

      // Descobre tipo automaticamente se não veio via URL
      if (!searchParams.get("type") && record) {
        if (record.role) setType("equipe");
        else if (record.status) setType("leads");
        else if (record.tipo) setType("personas");
      }

    } catch (err) {
      error("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────
  // UPLOAD AVATAR
  // ───────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("id", perfilId);
      formData.append("type", type);

      const res = await fetch("/api/perfis/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setPerfil((p) => ({ ...p, avatar_url: json.avatar_url }));
      success("Foto atualizada com sucesso!");
    } catch (err) {
      error("Erro", err.message);
    } finally {
      setUploading(false);
    }
  };

  // ───────────────────────────────
  // DELETE
  // ───────────────────────────────
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

      success(json.message || "Perfil removido!");
      router.push("/admin/perfis");

    } catch (err) {
      error("Erro", err.message);
    } finally {
      setDeleting(false);
      setOpenDelete(false);
    }
  };

  // ───────────────────────────────
  // LOADING STATES
  // ───────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="animate-spin" /> Carregando perfil...
      </div>
    );
  }

  if (!perfil) {
    return (
      <p className="text-center p-10 text-muted-foreground">
        Perfil não encontrado.
      </p>
    );
  }

  const isAdmin = perfil?.role === "admin";
  const canBeDeleted = type !== "equipe" || perfil.role !== "admin";

  // ====================================================================
  // PAGE
  // ====================================================================
  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {perfil.nome_completo || perfil.nome}
          </h1>
          <p className="text-muted-foreground">
            Visualização detalhada do perfil
          </p>
        </div>

        <div className="flex gap-2">
          {canBeDeleted && (
            <Button
              variant="secondary"
              className="flex items-center gap-2"
              onClick={() => setOpenDelete(true)}
            >
              <Trash2 size={16} /> Remover
            </Button>
          )}

          <Link href="/admin/perfis">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft size={16} /> Voltar
            </Button>
          </Link>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* AVATAR */}
        <Card className="p-6 flex flex-col items-center text-center gap-4 md:col-span-1">
          <div className="relative">
            <Image
              src={perfil.avatar_url || "/placeholder-avatar.png"}
              alt="Avatar"
              width={160}
              height={160}
              className="rounded-full border border-border object-cover shadow"
            />

            {perfil.role === "corretor" && (
              <label className="absolute bottom-1 right-1 cursor-pointer bg-accent text-accent-foreground p-2 rounded-full shadow hover:opacity-90 transition">
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

          <div className="space-y-1">
            <p className="text-lg font-semibold">{perfil.nome_completo || perfil.nome}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {type === "equipe" && `Função: ${perfil.role}`}
              {type === "leads" && `Status: ${perfil.status}`}
              {type === "personas" && `Tipo: ${perfil.tipo}`}
            </p>
          </div>
        </Card>

        {/* CONTEÚDO */}
        <Card className="p-6 md:col-span-2">
          <Tabs value={tab} onValueChange={setTab} className="w-full">

            <TabsList className="bg-muted p-1 flex gap-2">
              <TabsTrigger value="dados">Dados Gerais</TabsTrigger>
              <TabsTrigger value="outros">Outros</TabsTrigger>
            </TabsList>

            {/* DADOS */}
            <TabsContent value="dados" currentValue={tab}>
              {type === "equipe" && (
                <PerfilFormEquipe
                  modo="edit"
                  dadosIniciais={perfil}
                  onSuccess={() => loadPerfil(perfilId)}
                  readOnly={perfil.role === "admin"}
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
            </TabsContent>

            {/* OUTROS */}
            <TabsContent value="outros" currentValue={tab}>
              <Label>Observações</Label>
              <Textarea
                rows={4}
                value={perfil.observacoes || ""}
                readOnly={isAdmin}
                onChange={(e) =>
                  setPerfil((p) => ({ ...p, observacoes: e.target.value }))
                }
              />
            </TabsContent>

          </Tabs>
        </Card>
      </div>

      {/* MODAL DELETE */}
      <Modal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
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
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Removendo...
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
