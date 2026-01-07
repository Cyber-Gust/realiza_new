"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
  ClipboardList,
  Loader2,
  X,
  FileText,
  Upload,
  Image as ImageIcon,
  Ban,
} from "lucide-react";

// UI
import { Button } from "@/components/admin/ui/Button";
import { Card } from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import { Textarea } from "@/components/admin/ui/Form";

// Toast
import { useToast } from "@/contexts/ToastContext";

export default function VistoriaDetailDrawer({
  vistoriaId,
  onClose,
  onUpdated,
}) {
  const toast = useToast();

  const [vistoria, setVistoria] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* ===============================
      LOAD
  =============================== */
  const loadVistoria = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/manutencao/vistorias?id=${vistoriaId}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const found = json.data?.[0];
      setVistoria(found || null);
      setDescricao(found?.laudo_descricao || "");
    } catch (err) {
      toast.error("Erro ao carregar vistoria", err.message);
    } finally {
      setLoading(false);
    }
  }, [vistoriaId, toast]);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (vistoriaId) loadVistoria();
  }, [vistoriaId, loadVistoria]);

  if (!mounted || !vistoriaId) return null;

  const root = document.getElementById("drawer-root");
  if (!root) return null;

  /* ===============================
      HELPERS
  =============================== */
  const updateVistoria = async (updates) => {
    try {
      setSaving(true);

      const res = await fetch("/api/manutencao/vistorias", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: vistoria.id,
          ...updates,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success("Vistoria atualizada");
      await loadVistoria();
      onUpdated?.();
    } catch (err) {
      toast.error("Erro ao atualizar vistoria", err.message);
    } finally {
      setSaving(false);
    }
  };

  const uploadArquivo = async (file, tipo) => {
    if (!file) return;

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("id", vistoria.id);
      formData.append("tipo", tipo); // "laudo" | "foto"
      formData.append("file", file);

      const res = await fetch("/api/manutencao/vistorias", {
        method: "PUT",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(
        tipo === "laudo"
          ? "Laudo enviado com sucesso"
          : "Foto adicionada"
      );

      await loadVistoria();
      onUpdated?.();
    } catch (err) {
      toast.error("Erro no upload", err.message);
    } finally {
      setSaving(false);
    }
  };

  const cancelarVistoria = () =>
    updateVistoria({ status: "cancelada" });

  /* ===============================
      UI
  =============================== */
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:w-[520px] h-full bg-panel-card border-l border-border shadow-xl flex flex-col overflow-y-auto">

        {/* HEADER */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-3">
            <ClipboardList size={18} />
            <h2 className="text-lg font-semibold">Vistoria</h2>
            {vistoria?.status && <Badge status={vistoria.status} />}
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        ) : !vistoria ? (
          <div className="p-6 text-center text-muted-foreground">
            Vistoria não encontrada.
          </div>
        ) : (
          <div className="p-6 space-y-6 text-sm">

            {/* INFO */}
            <Card className="p-4 space-y-1">
              <p><strong>Imóvel:</strong> {vistoria.imovel?.titulo}</p>
              <p><strong>Tipo:</strong> {vistoria.tipo}</p>
              <p>
                <strong>Data:</strong>{" "}
                {new Date(vistoria.data_vistoria).toLocaleDateString("pt-BR")}
              </p>
            </Card>

            {/* DESCRIÇÃO */}
            <Card className="p-4 space-y-2">
              <Textarea
                rows={4}
                placeholder="Descrição da vistoria..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={vistoria.status === "cancelada"}
              />
              <Button
                size="sm"
                onClick={() =>
                  updateVistoria({ laudo_descricao: descricao })
                }
                disabled={saving || vistoria.status === "cancelada"}
              >
                Salvar descrição
              </Button>
            </Card>

            {/* LAUDO */}
            <Card className="p-4 space-y-2">
              <h4 className="font-semibold flex items-center gap-1">
                <FileText size={14} /> Laudo
              </h4>

              {vistoria.documento_laudo_url ? (
                <a
                  href={vistoria.documento_laudo_url}
                  target="_blank"
                  className="text-blue-600 text-sm"
                >
                  Abrir documento
                </a>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <Upload size={14} /> Anexar laudo
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    disabled={vistoria.status === "cancelada"}
                    onChange={(e) =>
                      uploadArquivo(e.target.files?.[0], "laudo")
                    }
                  />
                </label>
              )}
            </Card>

            {/* FOTOS */}
            <Card className="p-4 space-y-2">
              <h4 className="font-semibold flex items-center gap-1">
                <ImageIcon size={14} /> Fotos
              </h4>

              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <Upload size={14} /> Adicionar fotos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={vistoria.status === "cancelada"}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach((f) => uploadArquivo(f, "foto"));
                  }}
                />
              </label>

              {vistoria.fotos_json?.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {vistoria.fotos_json.map((f) => (
                    <Image
                      key={f.id}
                      src={f.url}
                      alt="Foto da vistoria"
                      width={300}
                      height={200}
                      className="w-full h-24 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </Card>

            {/* AÇÕES */}
            <Card className="p-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={cancelarVistoria}
                disabled={saving || vistoria.status === "cancelada"}
              >
                <Ban size={16} /> Cancelar vistoria
              </Button>
            </Card>

          </div>
        )}
      </div>
    </div>,
    root
  );
}
