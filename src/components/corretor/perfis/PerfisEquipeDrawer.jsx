"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { useToast } from "@/contexts/ToastContext";

import {
  Loader2,
  X,
  Phone,
  Mail,
  MapPin,
  Shield,
  Banknote,
  Globe,
  LinkIcon,
  UserCog,
  BadgeInfo,
} from "lucide-react";
import Image from "next/image";

export default function PerfisEquipeDrawer({
  profileId,
  onClose,
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const toast = useToast();

  const getImageSrc = (foto) => {
    if (!foto || typeof foto !== "string") return "/placeholder-avatar.png";

    if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
    if (foto.startsWith("/")) return foto;

    return "/" + foto;
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/perfis/list?type=equipe&id=${profileId}`);

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setProfile(json.data);
    } catch (err) {
      toast.error("Erro ao carregar perfil: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [profileId, toast]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (profileId) fetchProfile();
  }, [profileId, fetchProfile]);

  if (!mounted || !profileId) return null;

  const root = document.getElementById("drawer-root");
  if (!root) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:w-[480px] h-full bg-panel-card border-l border-border shadow-xl overflow-y-auto animate-slide-left flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <UserCog size={18} />
            Dados do Membro da Equipe
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex flex-col gap-2 items-center justify-center h-72 text-muted-foreground">
            <Loader2 className="animate-spin" size={22} />
            Carregando informações do perfil…
          </div>
        ) : !profile ? (
          <div className="p-6 text-center text-muted-foreground">
            Perfil não encontrado.
          </div>
        ) : (
          <div className="p-6 space-y-6 text-sm">

            {/* CARD PRINCIPAL */}
            <Card className="p-4 flex gap-3 items-center">
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-muted border">
                <Image
                  src={getImageSrc(profile.avatar_url)}
                  alt={profile.nome_completo}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col">
                <p className="text-base font-semibold">{profile.nome_completo}</p>
                <p className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                  <Shield size={12} /> {profile.role}
                </p>
                {profile.creci && (
                  <p className="text-xs text-muted-foreground">CRECI: {profile.creci}</p>
                )}
              </div>
            </Card>

            {/* CONTATOS */}
            <Card className="p-4 grid grid-cols-1 gap-3">
              <Field icon={<Mail size={14} />} label="E-mail" value={profile.email} />
              <Field icon={<Phone size={14} />} label="Telefone" value={profile.telefone} />
            </Card>

            {/* ENDEREÇO */}
            {(profile.endereco_logradouro ||
              profile.endereco_bairro ||
              profile.endereco_cidade) && (
              <Card className="p-4 grid grid-cols-1 gap-3">
                <p className="font-semibold text-sm flex items-center gap-1">
                  <MapPin size={14} /> Endereço
                </p>

                <Field
                  label="Endereço"
                  value={`${profile.endereco_logradouro || ""}, Nº ${
                    profile.endereco_numero || "-"
                  } - ${profile.endereco_bairro || ""}`}
                />
                <Field
                  label="Cidade"
                  value={`${profile.endereco_cidade || ""} - ${
                    profile.endereco_estado || ""
                  }`}
                />
                <Field label="CEP" value={profile.endereco_cep} />
              </Card>
            )}

            {/* REDES SOCIAIS */}
            {(profile.instagram ||
              profile.linkedin ||
              profile.whatsapp) && (
              <Card className="p-4 grid grid-cols-1 gap-3">
                <p className="font-semibold text-sm flex items-center gap-1">
                  <Globe size={14} /> Redes Sociais
                </p>

                <Field icon={<LinkIcon size={14} />} label="Instagram" value={profile.instagram} />
                <Field icon={<LinkIcon size={14} />} label="LinkedIn" value={profile.linkedin} />
                <Field icon={<LinkIcon size={14} />} label="WhatsApp" value={profile.whatsapp} />
              </Card>
            )}

            {/* PROFISSIONAL */}
            {(profile.resumo || profile.detalhes?.length > 0) && (
              <Card className="p-4 space-y-3">
                <p className="font-semibold text-sm flex items-center gap-1">
                  <BadgeInfo size={14} /> Perfil Profissional
                </p>

                <Field label="Resumo" value={profile.resumo} />

                {Array.isArray(profile.detalhes) && profile.detalhes.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium">Detalhes</p>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                      {profile.detalhes.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}

            {/* DADOS BANCÁRIOS */}
            {(profile.banco ||
              profile.agencia ||
              profile.conta ||
              profile.pix) && (
              <Card className="p-4 space-y-3">
                <p className="font-semibold text-sm flex items-center gap-1">
                  <Banknote size={14} /> Dados Bancários
                </p>

                <Field label="Banco" value={profile.banco} />
                <Field label="Agência" value={profile.agencia} />
                <Field label="Conta" value={profile.conta} />
                <Field label="Tipo" value={profile.tipo_conta} />
                <Field label="Pix" value={profile.pix} />
                <Field label="Favorecido" value={profile.favorecido} />
              </Card>
            )}
          </div>
        )}
      </div>
    </div>,
    root
  );
}

function Field({ label, value, icon }) {
  if (!value) return null;

  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
