"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { Input, Label, Textarea, Select } from "@/components/admin/ui/Form";

import {
  Loader2,
  Settings,
  User2,
  PenTool,
  CreditCard,
  MapPin,
  Camera,
} from "lucide-react";

import { useToast } from "@/contexts/ToastContext";
import Image from "next/image";

export default function ConfiguracoesPage() {
  const toast = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    data_nascimento: "",
    role: "",
    creci: "",

    avatar_url: "",
    resumo: "",
    bio_publica: "",

    instagram: "",
    linkedin: "",
    whatsapp: "",

    endereco_cep: "",
    endereco_logradouro: "",
    endereco_numero: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_estado: "",

    banco: "",
    agencia: "",
    conta: "",
    tipo_conta: "",
    pix: "",
    favorecido: "",

    assinatura_provider: "clicksign",
    assinatura_token: "",
    assinatura_ativa: false,
  });

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setForm((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar perfil");
    } finally {
      setLoading(false);
    }
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAvatarUpload(file) {
    try {
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Arquivo inválido");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error("Imagem maior que 2MB");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("perfil_fotos")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("perfil_fotos")
        .getPublicUrl(path);

      await supabase
        .from("profiles")
        .update({
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      update("avatar_url", data.publicUrl);
      toast.success("Foto atualizada com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar foto");
    }
  }

  async function handleSave() {
    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update(form)
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Configurações salvas com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" />
        Carregando perfil…
      </div>
    );
  }

  return (
  <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-4">
    <div className="w-full max-w-4xl space-y-10 px-4">

      {/* HEADER */}
      <div className="flex items-center gap-2">
        <Settings size={20} />
        <h1 className="text-xl font-semibold">Configurações</h1>
      </div>

      {/* AVATAR */}
        <Card className="p-6 w-full">
        <div className="flex items-center gap-6">

            <Image
              src={
                form.avatar_url
                  ? `${form.avatar_url}?v=${new Date(form.updated_at || Date.now()).getTime()}`
                  : "/avatar-placeholder.png"
              }
              alt={form.nome_completo ? `Avatar de ${form.nome_completo}` : "Avatar do usuário"}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border"
              priority
            />

            {/* INPUT FILE NATIVO (ESCONDIDO) */}
            <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
                e.target.files && handleAvatarUpload(e.target.files[0])
            }
            />

            {/* BOTÃO QUE DISPARA O INPUT */}
            <Button
            variant="secondary"
            type="button"
            className="flex gap-2"
            onClick={() => fileRef.current?.click()}
            >
            <Camera size={16} />
            Alterar foto
            </Button>

        </div>
        </Card>

      {/* PERFIL */}
      <Card className="p-6 space-y-6 w-full">
        <Section title="Perfil" icon={<User2 size={16} />}>
          <Field label="Nome completo">
            <Input
              value={form.nome_completo}
              onChange={(e) =>
                update("nome_completo", e.target.value)
              }
            />
          </Field>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="E-mail">
              <Input value={form.email} disabled />
            </Field>

            <Field label="Perfil">
              <Input value={form.role} disabled />
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Telefone">
              <Input
                placeholder="Telefone"
                value={form.telefone}
                onChange={(e) =>
                  update("telefone", e.target.value)
                }
              />
            </Field>
            <Field label="CPF / CNPJ">
              <Input
                placeholder="CPF / CNPJ"
                value={form.cpf_cnpj}
                onChange={(e) =>
                  update("cpf_cnpj", e.target.value)
                }
              />
            </Field>
          </div>
          <Field label="Bio pública">      
          <Textarea
            placeholder="Bio pública"
            value={form.bio_publica}
            onChange={(e) =>
              update("bio_publica", e.target.value)
            }
          />
          </Field>
        </Section>
      </Card>

      {/* ENDEREÇO */}
      <Card className="p-6 space-y-6 w-full">
        <Section title="Endereço" icon={<MapPin size={16} />}>

            <Field label="CEP">
            <Input
                placeholder="00000-000"
                value={form.endereco_cep}
                onChange={(e) => update("endereco_cep", e.target.value)}
            />
            </Field>

            <Field label="Logradouro">
            <Input
                placeholder="Rua, Avenida, etc."
                value={form.endereco_logradouro}
                onChange={(e) => update("endereco_logradouro", e.target.value)}
            />
            </Field>

            <div className="grid md:grid-cols-3 gap-4">
            <Field label="Número">
                <Input
                placeholder="123"
                value={form.endereco_numero}
                onChange={(e) => update("endereco_numero", e.target.value)}
                />
            </Field>

            <Field label="Bairro">
                <Input
                placeholder="Centro"
                value={form.endereco_bairro}
                onChange={(e) => update("endereco_bairro", e.target.value)}
                />
            </Field>

            <Field label="Cidade">
                <Input
                placeholder="São Paulo"
                value={form.endereco_cidade}
                onChange={(e) => update("endereco_cidade", e.target.value)}
                />
            </Field>
            </div>

            <Field label="Estado">
            <Input
                placeholder="SP"
                value={form.endereco_estado}
                onChange={(e) => update("endereco_estado", e.target.value)}
            />
            </Field>

        </Section>
        </Card>

      {/* DADOS BANCÁRIOS */}
      <Card className="p-6 space-y-6 w-full">
        <Section title="Dados bancários" icon={<CreditCard size={16} />}>

            <Field label="Banco">
            <Input
                placeholder="Nome do banco"
                value={form.banco}
                onChange={(e) => update("banco", e.target.value)}
            />
            </Field>

            <Field label="Agência">
            <Input
                placeholder="0000"
                value={form.agencia}
                onChange={(e) => update("agencia", e.target.value)}
            />
            </Field>

            <Field label="Conta">
            <Input
                placeholder="00000-0"
                value={form.conta}
                onChange={(e) => update("conta", e.target.value)}
            />
            </Field>

            <Field label="Tipo de conta">
            <Input
                placeholder="Corrente ou Poupança"
                value={form.tipo_conta}
                onChange={(e) => update("tipo_conta", e.target.value)}
            />
            </Field>

            <Field label="PIX">
            <Input
                placeholder="CPF, e-mail ou chave aleatória"
                value={form.pix}
                onChange={(e) => update("pix", e.target.value)}
            />
            </Field>

            <Field label="Favorecido">
            <Input
                placeholder="Nome completo"
                value={form.favorecido}
                onChange={(e) => update("favorecido", e.target.value)}
            />
            </Field>

        </Section>
        </Card>

      {/* ASSINATURA */}
      <Card className="p-6 space-y-6 w-full">
        <Section title="Assinatura digital" icon={<PenTool size={16} />}>
            <Field label="Provedor de assinatura">
              <Select
                value={form.assinatura_provider}
                onChange={(e) =>
                  update("assinatura_provider", e.target.value)
                }
              >
                <option value="clicksign">Clicksign</option>
                <option value="zapsign" disabled>
                  Zapsign (em breve)
                </option>
              </Select>
            </Field>
          <Field label="Token da API">
            <Input
              type="password"
              placeholder="Token da API"
              value={form.assinatura_token}
              onChange={(e) =>
                update("assinatura_token", e.target.value)
              }
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.assinatura_ativa}
              className="
                peer h-5 w-5 cursor-pointer appearance-none rounded
                border border-gray-400 transition-all
                checked:bg-accent checked:border-accent
                checked:before:block checked:before:content-['✔']
                checked:before:text-white checked:before:text-sm
              "
              onChange={(e) =>
                update("assinatura_ativa", e.target.checked)
              }
            />
            Ativar assinatura digital
          </label>
        </Section>
      </Card>

      {/* ACTIONS */}
      <div className="flex justify-end w-full">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex gap-2"
        >
          {saving && (
            <Loader2 size={14} className="animate-spin" />
          )}
          Salvar configurações
        </Button>
      </div>

    </div>
  </div>
);
}

/* COMPONENTES AUXILIARES */

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <>
      <div className="flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </div>
      {children}
    </>
  );
}
