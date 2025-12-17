"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import clsx from "clsx";
import imageCompression from "browser-image-compression";
import { Loader2, Trash2, Upload, AlertTriangle } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/admin/ui/Card";

import { Button, buttonVariants } from "@/components/admin/ui/Button";
import Modal from "@/components/admin/ui/Modal";
import { Input, Label } from "../admin/ui/Form";
import { useToast } from "@/contexts/ToastContext";

/* ------------------------- DND KIT ------------------------- */
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

/* ------------------------------------------------------------
   SORTABLE ITEM
------------------------------------------------------------ */
function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------
   COMPONENTE PRINCIPAL
------------------------------------------------------------ */
export default function MidiaPanel({ imovel }) {
  const toast = useToast();

  const [files, setFiles] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [principal, setPrincipal] = useState(imovel.imagem_principal);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  

  const prefix = `imovel_${imovel.id}/`;
  

  /* ============================================================
     DERIVAÇÕES SIMPLES
  ============================================================ */
  const principalFile = useMemo(
    () => files.find(f => f.url === principal),
    [files, principal]
  );

  /* ============================================================
     🔄 REFRESH
  ============================================================ */
  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/imoveis?action=storage&prefix=${encodeURIComponent(prefix)}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const storageFiles = json.data || [];
      const ordered = [];

      if (principal) {
        const p = storageFiles.find(f => f.url === principal);
        if (p) ordered.push(p);
      }

      (imovel.midias || []).forEach(url => {
        const f = storageFiles.find(s => s.url === url);
        if (f && !ordered.some(o => o.url === f.url)) ordered.push(f);
      });

      storageFiles.forEach(f => {
        if (!ordered.some(o => o.url === f.url)) ordered.push(f);
      });

      setFiles(ordered);
    } catch {
      toast.error("Erro ao carregar mídias.");
    } finally {
      setLoading(false);
    }
  }, [prefix, principal, imovel.midias, toast]);

  useEffect(() => {
    refresh();
  }, []);

  /* ============================================================
     🔁 SINCRONIZA GALERIA (REGRA DO DND KIT)
  ============================================================ */
  useEffect(() => {
    setGallery(files.filter(f => f.url !== principal));
  }, [files, principal]);

  /* ============================================================
     ⭐ DEFINIR PRINCIPAL
  ============================================================ */
  const handleSetPrincipal = async (url) => {
    const principalFile = files.find(f => f.url === url);
    if (!principalFile) return;

    const rest = files.filter(f => f.url !== url);
    const newFiles = [principalFile, ...rest];
    const newMidias = rest.map(f => f.url);

    setPrincipal(url);
    setFiles(newFiles);

    await fetch("/api/imoveis", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: imovel.id,
        imagem_principal: url,
        midias: newMidias
      })
    });

    imovel.onChange?.({
      ...imovel,
      imagem_principal: url,
      midias: newMidias
    });

    toast.success("Imagem principal atualizada");
  };

  /* ============================================================
     🔼 UPLOAD
  ============================================================ */
  const handleUpload = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    setUploading(true);

    try {
      const uploadedUrls = [];

      for (const file of selected) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1600,
          useWebWorker: true
        });

        const signRes = await fetch("/api/imoveis?action=sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: prefix + file.name,
            type: compressed.type
          })
        });

        const { data } = await signRes.json();
        await fetch(data.uploadUrl, { method: "PUT", body: compressed });
        uploadedUrls.push(data.publicUrl);
      }

      const newPrincipal = principal || uploadedUrls[0];
      const newMidias = [
        ...files.map(f => f.url).filter(u => u !== newPrincipal),
        ...uploadedUrls.filter(u => u !== newPrincipal)
      ];

      setPrincipal(newPrincipal);

      await fetch("/api/imoveis", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: imovel.id,
          imagem_principal: newPrincipal,
          midias: newMidias
        })
      });

      imovel.onChange?.({
        ...imovel,
        imagem_principal: newPrincipal,
        midias: newMidias
      });

      refresh();
      toast.success("Upload concluído 🚀");
    } catch {
      toast.error("Erro no upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  /* ============================================================
     🖐️ DRAG & DROP
  ============================================================ */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = gallery.findIndex(f => f.url === active.id);
    const newIndex = gallery.findIndex(f => f.url === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(gallery, oldIndex, newIndex);
    setGallery(reordered);

    const newFiles = principalFile
      ? [principalFile, ...reordered]
      : reordered;

    setFiles(newFiles);

    const newMidias = reordered.map(f => f.url);

    await fetch("/api/imoveis", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: imovel.id,
        imagem_principal: principal,
        midias: newMidias
      })
    });

    imovel.onChange?.({
      ...imovel,
      imagem_principal: principal,
      midias: newMidias
    });

    toast.success("Ordem atualizada");
  };

  /* ============================================================
     🗑 REMOVER
  ============================================================ */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await fetch("/api/imoveis?action=storage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deleteTarget.name,
          prefix
        })
      });

      const remaining = files.filter(f => f.url !== deleteTarget.url);
      const newPrincipal =
        deleteTarget.url === principal ? remaining[0]?.url || null : principal;

      setPrincipal(newPrincipal);
      setFiles(remaining);

      await fetch("/api/imoveis", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: imovel.id,
          imagem_principal: newPrincipal,
          midias: remaining
            .filter(f => f.url !== newPrincipal)
            .map(f => f.url)
        })
      });

      toast.success("Mídia removida");
    } catch {
      toast.error("Erro ao remover");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* ============================================================
     🔽 RENDER (INALTERADO)
  ============================================================ */
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mídia e Publicação</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Gerencie fotos e a ordem de exibição
          </span>

          <Label
            htmlFor="midiaUploader"
            className={clsx(
              buttonVariants({ variant: "secondary" }),
              "cursor-pointer gap-2"
            )}
          >
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            Enviar
            <Input
              id="midiaUploader"
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
          </Label>
        </div>

        {loading ? (
          <div className="h-40 bg-muted animate-pulse rounded" />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={gallery.map(f => f.url)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* PRINCIPAL */}
                {principalFile && (
                  <div className="border rounded overflow-hidden relative">
                    <Image
                      src={principalFile.url}
                      alt={principalFile.name}
                      width={300}
                      height={200}
                      className="object-cover w-full h-40"
                    />

                    <span className="absolute top-2 left-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded">
                      Principal
                    </span>

                    <div className="flex justify-between p-2">
                      <span />
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteTarget(principalFile)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                )}

                {/* GALERIA */}
                {gallery.map(f => (
                  <SortableItem key={f.url} id={f.url}>
                    <div className="border rounded overflow-hidden relative">
                      <Image
                        src={f.url}
                        alt={f.name}
                        width={300}
                        height={200}
                        className="object-cover w-full h-40"
                      />

                      <div className="flex justify-between p-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSetPrincipal(f.url)}
                        >
                          Tornar principal
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTarget(f)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Excluir mídia"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <AlertTriangle className="text-red-500" />
            Tem certeza?
          </div>

          <Button
            className="w-full"
            variant="destructive"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? "Removendo..." : "Confirmar"}
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
