"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Card } from "@/components/admin/ui/Card";
import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/contexts/ToastContext";

import {
  X,
  FileText,
  CalendarDays,
  Download,
  Trash2,
  Edit,
  Info,
  Loader2,
  Link2,
} from "lucide-react";

export default function ComplianceDocDrawer({ doc, onClose, onEdit, onDelete }) {
  const toast = useToast();

  const [mounted, setMounted] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !doc) return null;

  const root = document.getElementById("drawer-root");
  if (!root) return null;

  const validadeDate = doc.validade ? new Date(doc.validade) : null;
  const vencido = validadeDate ? validadeDate < new Date() : false;

  const handleDownload = async () => {
    if (!doc.url) {
      toast.error("Arquivo não disponível.");
      return;
    }

    try {
      setLoadingDownload(true);
      window.open(doc.url, "_blank");
    } catch (err) {
      toast.error("Erro ao abrir arquivo: " + err.message);
    } finally {
      setLoadingDownload(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full sm:w-[500px] h-full bg-panel-card border-l border-border shadow-xl overflow-y-auto animate-slide-left flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <FileText size={18} />
            {doc.tipo?.toUpperCase()}
          </h2>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-6 text-sm">

          {/* CARD PRINCIPAL */}
          <Card className="p-4 space-y-2">
            <p className="font-medium flex items-center gap-2 text-base">
              <Info size={16} /> Informações do Documento
            </p>

            <div className="grid grid-cols-1 gap-3 text-sm">

              <Field
                label="Tipo"
                value={doc.tipo?.toUpperCase()}
                icon={<FileText size={14} />}
              />

              <Field
                label="Status"
                value={vencido ? "Vencido" : "Válido"}
                icon={<Info size={14} />}
              />

              <Field
                label="Validade"
                value={
                  validadeDate
                    ? validadeDate.toLocaleDateString("pt-BR")
                    : "Sem validade"
                }
                icon={<CalendarDays size={14} />}
              />

              <Field
                label="ID do Documento"
                value={doc.id}
                icon={<Info size={14} />}
              />

              <Field
                label="Path no bucket"
                value={doc.path}
                icon={<Link2 size={14} />}
              />

              {doc.url && (
                <div className="text-xs text-muted-foreground break-all">
                  <span className="flex items-center gap-1 mt-1 font-medium">
                    <Link2 size={12} /> URL Assinada:
                  </span>
                  <a
                    href={doc.url}
                    target="_blank"
                    className="underline text-accent text-[11px] break-words"
                  >
                    {doc.url}
                  </a>
                </div>
              )}
            </div>
          </Card>

          {/* AÇÕES */}
          <Card className="p-4 space-y-3">
            <p className="font-medium text-sm">Ações</p>

            <div className="grid grid-cols-1 gap-3">

              {/* DOWNLOAD */}
              <Button
                className="flex items-center gap-2"
                onClick={handleDownload}
                disabled={loadingDownload}
              >
                {loadingDownload ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Baixar arquivo
              </Button>

              {/* EDITAR VALID */}
              <Button
                className="flex items-center gap-2"
                variant="secondary"
                onClick={() => onEdit?.(doc)}
              >
                <Edit size={16} /> Editar validade
              </Button>

              {/* REMOVER */}
              <Button
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => onDelete?.(doc)}
              >
                <Trash2 size={16} /> Remover documento
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </div>,
    root
  );
}

/* ===========================================================================
    COMPONENTE DE CAMPO
=========================================================================== */
function Field({ label, value, icon }) {
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="font-medium break-all">{value || "-"}</p>
    </div>
  );
}
