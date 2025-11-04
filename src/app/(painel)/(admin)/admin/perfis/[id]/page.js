"use client";

import { useEffect, useState } from "react";
import { use } from "react"; // ✅ adicione no topo
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import Toast from "@/components/admin/ui/Toast";
import Modal from "@/components/admin/ui/Modal";
import Input from "@/components/admin/forms/Input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Upload, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

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
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Enums
  const USER_ROLES = ["admin", "corretor"];
  const LEAD_STATUS = [
    "novo",
    "qualificado",
    "visita_agendada",
    "proposta_feita",
    "documentacao",
    "concluido",
    "perdido",
  ];
  const PERSONA_TIPOS = ["proprietario", "inquilino", "cliente"];

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

      // 🔹 Ajusta tipo automaticamente se não veio na URL
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

  // 🔹 Atualizar perfil
  const updatePerfil = async (updates) => {
    const payload = { id: perfilId, type, ...updates };

    if (typeof updates.dados_bancarios_json === "object")
      payload.dados_bancarios_json = JSON.stringify(updates.dados_bancarios_json);
    if (typeof updates.endereco_json === "object")
      payload.endereco_json = JSON.stringify(updates.endereco_json);
    if (typeof updates.perfil_busca_json === "object")
      payload.perfil_busca_json = JSON.stringify(updates.perfil_busca_json);

    const res = await fetch("/api/perfis/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
  };

  const salvarAlteracoes = async () => {
    try {
      setSaving(true);
      await updatePerfil(perfil);
      Toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Upload de foto
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

  const canBeDeleted =
    type !== "equipe" || (perfil.role && perfil.role !== "admin");

  return (
    <div className="space-y-6">
      {/* 🔹 Cabeçalho */}
      <PageHeader
        title={perfil.nome_completo || perfil.nome || "Perfil"}
        description={`Tipo: ${type}`}
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
          <Card className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              {/* Avatar */}
              <div className="relative">
                <Image
                  src={perfil.avatar_url || "/placeholder-avatar.png"}
                  alt="Avatar"
                  width={140}
                  height={140}
                  className="rounded-full border border-border object-cover"
                />
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
              </div>

              {/* Campos principais */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Nome completo"
                  value={perfil.nome_completo || perfil.nome || ""}
                  onChange={(e) =>
                    setPerfil((p) => ({
                      ...p,
                      nome_completo: e.target.value,
                      nome: e.target.value,
                    }))
                  }
                />
                <Input
                  label="E-mail"
                  value={perfil.email || ""}
                  onChange={(e) =>
                    setPerfil((p) => ({ ...p, email: e.target.value }))
                  }
                />
                <Input
                  label="Telefone"
                  value={perfil.telefone || ""}
                  onChange={(e) =>
                    setPerfil((p) => ({ ...p, telefone: e.target.value }))
                  }
                />
                <Input
                  label="CPF/CNPJ"
                  value={perfil.cpf_cnpj || ""}
                  onChange={(e) =>
                    setPerfil((p) => ({ ...p, cpf_cnpj: e.target.value }))
                  }
                />

                {/* Selects dinâmicos */}
                {type === "equipe" && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Função
                    </label>
                    <select
                      value={perfil.role || ""}
                      onChange={(e) =>
                        setPerfil((p) => ({ ...p, role: e.target.value }))
                      }
                      disabled={perfil.role === "admin"}
                      className="w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
                    >
                      {USER_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {type === "leads" && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <select
                      value={perfil.status || ""}
                      onChange={(e) =>
                        setPerfil((p) => ({ ...p, status: e.target.value }))
                      }
                      className="w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
                    >
                      {LEAD_STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {type === "personas" && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Tipo
                    </label>
                    <select
                      value={perfil.tipo || ""}
                      onChange={(e) =>
                        setPerfil((p) => ({ ...p, tipo: e.target.value }))
                      }
                      className="w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
                    >
                      {PERSONA_TIPOS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
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
                onChange={(e) =>
                  setPerfil((p) => ({ ...p, observacoes: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm"
                rows={3}
              />
            )}

            {perfil.dados_bancarios_json !== undefined && (
              <Input
                label="Dados Bancários (JSON)"
                value={
                  typeof perfil.dados_bancarios_json === "object"
                    ? JSON.stringify(perfil.dados_bancarios_json)
                    : perfil.dados_bancarios_json || ""
                }
                onChange={(e) =>
                  setPerfil((p) => ({
                    ...p,
                    dados_bancarios_json: e.target.value,
                  }))
                }
              />
            )}

            {perfil.endereco_json !== undefined && (
              <Input
                label="Endereço (JSON)"
                value={
                  typeof perfil.endereco_json === "object"
                    ? JSON.stringify(perfil.endereco_json)
                    : perfil.endereco_json || ""
                }
                onChange={(e) =>
                  setPerfil((p) => ({
                    ...p,
                    endereco_json: e.target.value,
                  }))
                }
              />
            )}

            {perfil.perfil_busca_json !== undefined && (
              <Input
                label="Preferências (JSON)"
                value={
                  typeof perfil.perfil_busca_json === "object"
                    ? JSON.stringify(perfil.perfil_busca_json)
                    : perfil.perfil_busca_json || ""
                }
                onChange={(e) =>
                  setPerfil((p) => ({
                    ...p,
                    perfil_busca_json: e.target.value,
                  }))
                }
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
