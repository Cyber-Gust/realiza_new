"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import Card from "@/components/admin/ui/Card";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";
import Modal from "@/components/admin/ui/Modal";
import useModal from "@/hooks/useModal";
import {
  Upload,
  RefreshCw,
  Trash2,
  FileText,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const DOC_TIPOS = [
  { label: "Laudo", value: "laudo" },
  { label: "ART", value: "art" },
  { label: "AVCB", value: "avcb" },
  { label: "Habite-se", value: "habite_se" },
];

export default function CompliancePanel({ imovelId }) {
  const [doc, setDoc] = useState({ tipo: "", validade: "", file: null });
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const deleteModal = useModal();
  const isValid = useMemo(() => !!doc.tipo && !!doc.file, [doc]);

  // 🔹 Lista documentos
  const fetchList = useCallback(async () => {
    if (!imovelId) return;
    try {
      setLoading(true);
      const r = await fetch(`/api/imoveis/${imovelId}/compliance`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao carregar documentos");
      setItens(Array.isArray(j?.data) ? j.data : []);
    } catch (e) {
      Toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [imovelId]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  // 🔹 Upload
  const handleUpload = async () => {
    if (!isValid) return Toast.error("Preencha todos os campos.");
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("file", doc.file);
      fd.append("tipo", doc.tipo);
      if (doc.validade)
        fd.append("validade", new Date(doc.validade).toISOString());

      const r = await fetch(`/api/imoveis/${imovelId}/compliance`, {
        method: "POST",
        body: fd,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha no upload");
      Toast.success("Documento enviado com sucesso!");
      setDoc({ tipo: "", validade: "", file: null });
      setItens(Array.isArray(j?.data) ? j.data : []);
    } catch (e) {
      Toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Excluir (abre modal)
  const requestDelete = (doc) => {
    setSelectedDoc(doc);
    deleteModal.openModal();
  };

  // 🔹 Confirmar exclusão
  const confirmDelete = async () => {
    if (!selectedDoc) return;
    try {
      setDeleting(true);
      const r = await fetch(`/api/imoveis/${imovelId}/compliance`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedDoc.id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao remover documento");
      setItens(Array.isArray(j?.data) ? j.data : []);
      Toast.success("Documento removido com sucesso!");
    } catch (e) {
      Toast.error(e.message);
    } finally {
      setDeleting(false);
      deleteModal.closeModal();
      setSelectedDoc(null);
    }
  };

  return (
    <>
      <Card title="📑 Documentos de Compliance" className="space-y-6">
        {/* 🔹 Formulário de upload */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Tipo</label>
            <select
              value={doc.tipo}
              onChange={(e) => setDoc({ ...doc, tipo: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-panel-card px-3 text-sm text-foreground focus:ring-2 focus:ring-accent"
            >
              <option value="" disabled hidden>
                Selecione...
              </option>
              {DOC_TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-4 w-4 opacity-70" />
              Validade
            </label>
            <input
              type="date"
              value={
                doc.validade ? format(new Date(doc.validade), "yyyy-MM-dd") : ""
              }
              onChange={(e) => setDoc({ ...doc, validade: e.target.value })}
              className="h-10 w-full rounded-md border border-border bg-panel-card px-3 text-sm text-foreground focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Arquivo</label>
            <input
              type="file"
              onChange={(e) =>
                setDoc({ ...doc, file: e.target.files?.[0] ?? null })
              }
              className="flex h-10 w-full rounded-md border border-dashed border-border bg-panel-card px-3 py-2 text-sm text-foreground file:mr-2 file:rounded-md file:border-0 file:bg-panel-active file:text-panel-active-foreground file:px-3 file:py-1 file:cursor-pointer hover:file:brightness-110"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={handleUpload}
              disabled={!isValid || loading}
              className="w-full flex items-center justify-center gap-2 bg-panel-active hover:brightness-110 text-panel-active-foreground"
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <Upload size={16} />
              )}
              {loading ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>

        {/* 🔹 Lista de documentos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Lista de documentos enviados
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchList}
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCw size={14} /> Atualizar
            </Button>
          </div>

          {loading && itens.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
          ) : itens.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">
              Nenhum documento cadastrado ainda.
            </p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {itens.map((d) => {
                const vencido = d.validade
                  ? new Date(d.validade) < new Date()
                  : false;
                return (
                  <li
                    key={d.id || d.url}
                    className="p-4 rounded-xl border border-border bg-panel-card shadow-sm flex flex-col justify-between transition hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-panel-active" />
                        <span className="font-medium text-sm">
                          {d.tipo?.toUpperCase() || "Documento"}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {d.validade
                          ? `Validade: ${new Date(
                              d.validade
                            ).toLocaleDateString("pt-BR")}`
                          : "Sem validade"}
                      </span>
                      {d.url && (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline text-accent mt-2 inline-block"
                        >
                          Abrir arquivo
                        </a>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span
                        className={cn(
                          "text-xs px-2 py-1 rounded-full border font-medium",
                          vencido
                            ? "border-red-300 text-red-700 bg-red-50"
                            : "border-emerald-300 text-emerald-700 bg-emerald-50"
                        )}
                      >
                        {vencido ? "Vencido" : "Válido"}
                      </span>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => requestDelete(d)}
                      >
                        <Trash2 size={14} /> Remover
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      {/* 🔹 Modal de confirmação de exclusão */}
      <Modal
        open={deleteModal.open}
        onOpenChange={deleteModal.closeModal}
        title="Excluir documento"
      >
        <p className="text-sm text-muted-foreground mb-6">
          Tem certeza que deseja excluir{" "}
          <strong>{selectedDoc?.tipo?.toUpperCase()}</strong> permanentemente?  
          Essa ação não poderá ser desfeita.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={deleteModal.closeModal}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Excluindo...
              </>
            ) : (
              "Excluir"
            )}
          </Button>
        </div>
      </Modal>
    </>
  );
}
