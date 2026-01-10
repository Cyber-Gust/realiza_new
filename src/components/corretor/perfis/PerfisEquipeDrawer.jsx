"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import { useToast } from "@/contexts/ToastContext";

import {
  Loader2,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Building2,
  Banknote,
  Globe,
  Link as LinkIcon,
  ScrollText,
  UserCog,
  BadgeInfo,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import Modal from "../admin/ui/Modal";

export default function PerfisEquipeDrawer({
  profileId,
  onClose,
  onEdit,
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  const getImageSrc = (foto) => {
    if (!foto || typeof foto !== "string") return "/placeholder-avatar.png";

    if (foto.startsWith("http://") || foto.startsWith("https://")) return foto;
    if (foto.startsWith("/")) return foto;

    return "/" + foto;
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);

      const res = await fetch("/api/perfis/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deleteTarget.id,
          type: "equipe"
        }),
        credentials: "include",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Perfil removido com sucesso!");
      setDeleteTarget(null); // Fecha modal
      onClose(); // Fecha drawer
    } catch (err) {
      toast.error("Erro ao remover: " + err.message);
    } finally {
      setDeleting(false);
    }
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

            {/* AÇÕES DE ROLE */}
            {profile.role !== "admin" && (
              <div className="flex gap-2">

                {/* REMOVER — só corretor */}
                {profile.role === "corretor" && (
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                    onClick={() => setDeleteTarget(profile)}
                  >
                    <Trash2 size={16} className="text-white" />
                    Remover
                  </Button>
                )}

                {/* EDITAR */}
                <Button
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={() => onEdit?.(profile)}
                >
                  <Pencil size={16} />
                  Editar
                </Button>

              </div>
            )}
          </div>
        )}
      </div>
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remover Membro da Equipe"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-1" />
              <div>
                <p>
                  Tem certeza que deseja remover{" "}
                  <strong>{deleteTarget.nome_completo}</strong>?
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cargo: {deleteTarget.role}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="w-1/2" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </Button>

              <Button
                className="w-1/2 bg-red-600 hover:bg-red-700"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Removendo...
                  </>
                ) : (
                  "Confirmar"
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
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
