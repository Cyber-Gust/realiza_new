"use client";

import { useEffect, useState, useCallback } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/admin/ui/Card";

import { Button } from "@/components/admin/ui/Button";
import { Switch } from "@/components/admin/ui/Switch";
import Modal from "@/components/admin/ui/Modal";

import { useToast } from "@/contexts/ToastContext";

import useStorageUpload from "@/hooks/useStorageUpload";
import useModal from "@/hooks/useModal";

import Image from "next/image";

import { Loader2, Trash2, Upload } from "lucide-react";

export default function MidiaPanel({ imovel }) {
  const toast = useToast();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const deleteModal = useModal();
  const { uploadFile, listFiles, removeFile } = useStorageUpload("imoveis_media");

  const prefix = `imovel_${imovel.id}/`;

  // 🔄 Atualiza lista de arquivos
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const arr = await listFiles(prefix);
      setFiles(arr.sort((a, b) => b.name.localeCompare(a.name)));
    } catch (err) {
      toast.error("Erro ao carregar arquivos.");
    } finally {
      setLoading(false);
    }
  }, [listFiles, prefix, toast]);

  // Carrega na montagem
  useEffect(() => {
    if (!imovel?.id) return;

    const fetchFiles = async () => {
      setLoading(true);
      try {
        const arr = await listFiles(prefix);
        setFiles(arr.sort((a, b) => b.name.localeCompare(a.name)));
      } catch {
        toast.error("Erro ao carregar arquivos.");
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [imovel?.id]);

  // 🔼 Upload
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const { url, name } = await uploadFile(file, `${prefix}${file.name}`);
      setFiles((prev) => [{ name, url }, ...prev]);
      toast.success("Arquivo enviado com sucesso!");
    } catch (err) {
      toast.error(err.message || "Erro ao enviar arquivo.");
    } finally {
      e.target.value = "";
      setUploading(false);
    }
  };

  // Modal delete
  const requestDelete = (fileName) => {
    setSelectedFile(fileName);
    deleteModal.openModal();
  };

  const confirmDelete = async () => {
    if (!selectedFile) return;
    try {
      await removeFile(`${prefix}${selectedFile}`);
      setFiles((prev) => prev.filter((f) => f.name !== selectedFile));
      toast.success("Arquivo removido com sucesso!");
    } catch (err) {
      toast.error(err.message || "Erro ao remover arquivo.");
    } finally {
      deleteModal.closeModal();
      setSelectedFile(null);
    }
  };

  const Shimmer = () => (
    <div className="w-full h-40 bg-muted/50 animate-pulse rounded-lg" />
  );

  return (
    <>
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Mídia e Publicação</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={imovel.status === "disponivel"}
                  disabled
                  onCheckedChange={() => {}}
                />
                <span className="text-sm text-muted-foreground">
                  Publicar no site
                </span>
              </div>

              <span className="text-xs text-muted-foreground">
                (controlado pelo status do imóvel)
              </span>
            </div>

            {/* Botão de upload */}
            <label
              htmlFor="midiaUploader"
              className={`inline-flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-md border border-border bg-background transition ${
                uploading ? "opacity-50 cursor-not-allowed" : "hover:bg-muted/50"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Enviar arquivo
                </>
              )}
              <input
                id="midiaUploader"
                type="file"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {/* Conteúdo */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Shimmer key={i} />
              ))}
            </div>
          ) : files?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {files.map((f) => (
                <figure
                  key={`${imovel.id}_${f.name}`}
                  className="group rounded-lg overflow-hidden border border-border bg-panel-card"
                >
                  <div className="relative w-full h-40">
                    <Image
                      src={f.url || "/placeholder-image.jpg"}
                      alt={f.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  </div>

                  <figcaption className="flex items-center justify-between p-2 text-xs">
                    <span className="truncate max-w-[75%]" title={f.name}>
                      {f.name}
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 px-2"
                      onClick={() => requestDelete(f.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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

      {/* Modal excluir */}
      <Modal
        open={deleteModal.open}
        onClose={deleteModal.closeModal}
        title="Excluir arquivo"
      >
        <p className="text-sm text-muted-foreground mb-6">
          Tem certeza que deseja excluir{" "}
          <strong>{selectedFile}</strong> permanentemente?  
          Essa ação não poderá ser desfeita.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={deleteModal.closeModal}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </>
  );
}
