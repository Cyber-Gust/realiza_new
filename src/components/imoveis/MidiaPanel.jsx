"use client";

import { useEffect, useState, useCallback } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/admin/ui/Card";

import { Button, buttonVariants } from "@/components/admin/ui/Button";
import Modal from "@/components/admin/ui/Modal";

import { useToast } from "@/contexts/ToastContext";
import clsx from "clsx";
import Image from "next/image";
import { Loader2, Trash2, Upload, AlertTriangle } from "lucide-react";
import { Input, Label } from "../admin/ui/Form";

export default function MidiaPanel({ imovel }) {
  const toast = useToast();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  /* ----------------------------------------------------------
     ⭐ ESTADO LOCAL PARA IMAGEM PRINCIPAL   <<<<<<<<<<<<
     (Não depende mais do pai para atualizar a UI)
  ---------------------------------------------------------- */
  const [principal, setPrincipalState] = useState(imovel.imagem_principal);

  useEffect(() => {
    setPrincipalState(imovel.imagem_principal);
  }, [imovel.imagem_principal]);

  const isPrincipal = (f) => principal === f.url;

  const prefix = `imovel_${imovel.id}/`;

  /* ============================================================
     🔄 LISTAR STORAGE + ORDENAR
  ============================================================ */
  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/imoveis?action=storage&prefix=${encodeURIComponent(prefix)}`
      );
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      const lista = json.data || [];

      const ordered = [
        ...lista.filter((f) => isPrincipal(f)),
        ...lista.filter((f) => !isPrincipal(f))
      ];

      setFiles(ordered);
    } catch {
      toast.error("Erro ao carregar arquivos.");
    } finally {
      setLoading(false);
    }
  }, [prefix, principal]);

  useEffect(() => {
    if (imovel?.id) refresh();
  }, [imovel?.id, refresh]);

  /* ============================================================
     ⭐ TROCAR PRINCIPAL — COM UPDATE IMEDIATO
  ============================================================ */
  const setPrincipal = async (url) => {
    try {
      const novaPrincipal = url;
      setPrincipalState(novaPrincipal); // <-- atualiza badge e botão na hora

      const outras = files
        .map((f) => f.url)
        .filter((u) => u !== url);

      const updateRes = await fetch(`/api/imoveis`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: imovel.id,
          imagem_principal: novaPrincipal,
          midias: outras.map((u) => ({ url: u }))
        })
      });

      if (!updateRes.ok) {
        const json = await updateRes.json();
        throw new Error(json.error);
      }

      imovel.onChange?.({
        ...imovel,
        imagem_principal: novaPrincipal,
        midias: outras.map((u) => ({ url: u }))
      });

      setFiles((prev) => [
        ...prev.filter((f) => f.url === novaPrincipal),
        ...prev.filter((f) => f.url !== novaPrincipal)
      ]);

      toast.success("Imagem principal atualizada!");
    } catch (err) {
      toast.error(err.message || "Erro ao definir principal.");
    }
  };

  /* ============================================================
     🔼 UPLOAD MÚLTIPLO
  ============================================================ */
  const handleUpload = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    setUploading(true);

    try {
      const uploaded = [];

      for (const file of selected) {
        const signRes = await fetch(`/api/imoveis?action=sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: prefix + file.name,
            type: file.type
          })
        });

        const signJson = await signRes.json();
        if (!signRes.ok) throw new Error(signJson.error);

        const { uploadUrl, publicUrl } = signJson.data;

        const up = await fetch(uploadUrl, {
          method: "PUT",
          body: file
        });

        if (!up.ok) throw new Error("Falha ao enviar arquivo.");

        uploaded.push({ name: file.name, url: publicUrl });
      }

      const urls = uploaded.map((u) => u.url);
      const newPrincipal = principal || urls[0];

      setPrincipalState(newPrincipal); // <-- atualiza imediatamente

      const newMidias = [
        ...files.map((f) => f.url).filter((u) => u !== newPrincipal),
        ...urls.filter((u) => u !== newPrincipal)
      ];

      const updateRes = await fetch(`/api/imoveis`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: imovel.id,
          imagem_principal: newPrincipal,
          midias: newMidias.map((u) => ({ url: u }))
        })
      });

      if (!updateRes.ok) {
        const json = await updateRes.json();
        throw new Error(json.error);
      }

      setFiles((prev) => {
        const merged = [...uploaded, ...prev];
        return [
          ...merged.filter((f) => f.url === newPrincipal),
          ...merged.filter((f) => f.url !== newPrincipal)
        ];
      });

      imovel.onChange?.({
        ...imovel,
        imagem_principal: newPrincipal,
        midias: newMidias.map((u) => ({ url: u }))
      });

      toast.success("Arquivos enviados!");
    } catch (err) {
      toast.error(err.message || "Erro ao enviar arquivos.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  /* ============================================================
     🗑 REMOVER MÍDIA
  ============================================================ */
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    const file = deleteTarget;

    try {
      const res = await fetch(`/api/imoveis?action=storage`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          prefix: prefix
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      let newMidias = files.map((f) => f.url).filter((u) => u !== file.url);

      let newPrincipal = principal;
      if (file.url === newPrincipal) {
        newPrincipal = newMidias[0] || null;
        newMidias = newMidias.slice(1);
      }

      setPrincipalState(newPrincipal); // <-- atualização instantânea

      const up = await fetch(`/api/imoveis`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: imovel.id,
          midias: newMidias.map((u) => ({ url: u })),
          imagem_principal: newPrincipal
        })
      });

      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson.error);

      setFiles((prev) => {
        const filtered = prev.filter((f) => f.url !== file.url);

        if (!newPrincipal) return filtered;

        return [
          ...filtered.filter((f) => f.url === newPrincipal),
          ...filtered.filter((f) => f.url !== newPrincipal)
        ];
      });

      imovel.onChange?.({
        ...imovel,
        midias: newMidias.map((u) => ({ url: u })),
        imagem_principal: newPrincipal
      });

      toast.success("Mídia removida!");
    } catch (err) {
      toast.error(err.message || "Erro ao remover arquivo.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const Shimmer = () => (
    <div className="w-full h-40 bg-muted/50 animate-pulse rounded-lg" />
  );

  /* ============================================================
     🔽 RENDER
  ============================================================ */
  return (
    <>
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Mídia e Publicação</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Gerencie fotos e defina a imagem principal.
            </div>

            <Label
              htmlFor="midiaUploader"
              className={clsx(
                buttonVariants({ variant: "secondary" }),
                "cursor-pointer gap-2",
                uploading && "opacity-50 cursor-not-allowed"
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Enviar arquivos
                </>
              )}

              <Input
                id="midiaUploader"
                type="file"
                multiple
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </Label>
          </div>

          {/* MEDIA GRID */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Shimmer key={i} />
              ))}
            </div>
          ) : files.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {files.map((f) => (
                <figure
                  key={f.url}
                  className="group rounded-xl overflow-hidden border border-border bg-panel-card relative"
                >
                  <div className="relative w-full h-40">
                    <Image
                      src={f.url}
                      alt={f.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />

                    {isPrincipal(f) && (
                      <span className="absolute top-2 left-2 inline-flex items-center justify-center
                                       rounded-full px-2.5 py-0.5
                                       text-xs font-semibold whitespace-nowrap capitalize
                                       border shadow-sm transition-all duration-200
                                       bg-emerald-200 text-emerald-800 border-emerald-300">
                        Principal
                      </span>
                    )}
                  </div>

                  <figcaption className="flex items-center justify-between p-2 text-xs gap-2">
                    <span className="truncate max-w-[45%]" title={f.name}>
                      {f.name}
                    </span>

                    <div className="flex gap-2">
                      {!isPrincipal(f) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 px-2"
                          onClick={() => setPrincipal(f.url)}
                        >
                          Tornar principal
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-6 px-2"
                        onClick={() => setDeleteTarget(f)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma mídia enviada ainda.
            </p>
          )}
        </CardContent>
      </Card>

      {/* MODAL DELETE */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir Mídia"
      >
        {deleteTarget && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-red-500 mt-1" />
              <div>
                <p>
                  Tem certeza que deseja remover{" "}
                    <strong>{deleteTarget.name}</strong>?
                </p>

                {isPrincipal(deleteTarget) && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta é a imagem principal. A próxima será definida automaticamente.
                  </p>
                )}
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
                className="w-1/2 bg-red-600 hover:bg-red-700"
                onClick={confirmDelete}
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
    </>
  );
}
