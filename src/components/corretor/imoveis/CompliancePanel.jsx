"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/admin/ui/Card";

import { Button } from "@/components/admin/ui/Button";
import Modal from "@/components/admin/ui/Modal";
import { Input, Select } from "@/components/admin/ui/Form";
import Badge from "@/components/admin/ui/Badge";
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/admin/ui/Table";

import { useToast } from "@/contexts/ToastContext";
import useModal from "@/hooks/useModal";

import {
  Upload,
  RefreshCw,
  Trash2,
  CalendarDays,
  Loader2,
  Edit,
  Link2,
} from "lucide-react";

import { cn } from "@/lib/utils";

import ComplianceDocDrawer from "./ComplianceDocDrawer";

const DOC_TIPOS = [
  { label: "Laudo", value: "laudo" },
  { label: "ART", value: "art" },
  { label: "AVCB", value: "avcb" },
  { label: "Habite-se", value: "habite_se" },
];

export default function CompliancePanel({ imovelId }) {
  const toast = useToast();

  const [doc, setDoc] = useState({
    tipo: "",
    validade: "",
    file: null,
  });

  const isValid = useMemo(() => !!doc.tipo && !!doc.file, [doc.tipo, doc.file]);

  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);

  const deleteModal = useModal();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [openDrawer, setOpenDrawer] = useState(null);

  const [editDoc, setEditDoc] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchList = useCallback(async () => {
    if (!imovelId) return;

    try {
      setLoading(true);
      const r = await fetch(`/api/imoveis/${imovelId}/compliance`, {
        cache: "no-store",
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Erro ao listar documentos");

      setItens(Array.isArray(j.data) ? j.data : []);
    } catch (err) {
      toast.error("Erro", err.message || "Falha ao carregar documentos.");
    } finally {
      setLoading(false);
    }
  }, [imovelId, toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleUpload = async () => {
    if (!isValid) {
      toast.error("Atenção", "Preencha todos os campos.");
      return;
    }

    try {
      setLoading(true);

      const docId = crypto.randomUUID();
      const ext = doc.file.name.split(".").pop();
      const path = `${imovelId}/${docId}.${ext}`;

      const sign = await fetch(`/api/imoveis?action=sign_compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });

      const signedJson = await sign.json();
      if (!sign.ok) throw new Error(signedJson.error || "Erro ao gerar Signed URL");

      const { url } = signedJson.data;

      const up = await fetch(url, {
        method: "PUT",
        body: doc.file,
      });

      if (!up.ok) throw new Error("Falha ao enviar arquivo");

      const validadeIso = doc.validade
        ? new Date(`${doc.validade}T00:00:00`).toISOString()
        : null;

      const payload = {
        id: docId,
        tipo: doc.tipo,
        validade: validadeIso,
        path,
      };

      const res = await fetch(`/api/imoveis/${imovelId}/compliance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc: payload }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro ao salvar documento");

      toast.success("Sucesso", "Documento enviado!");
      setDoc({ tipo: "", validade: "", file: null });
      fetchList();
    } catch (err) {
      toast.error("Erro", err.message || "Falha ao enviar documento.");
    } finally {
      setLoading(false);
    }
  };

  const requestDelete = (doc) => {
    setSelectedDoc(doc);
    deleteModal.openModal();
  };

  const confirmDelete = async () => {
    if (!selectedDoc) return;

    try {
      setDeleting(true);

      const r = await fetch(`/api/imoveis/${imovelId}/compliance`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_id: selectedDoc.id,
          path: selectedDoc.path,
        }),
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Erro ao remover documento");

      toast.success("Sucesso", "Documento removido!");
      fetchList();
    } catch (err) {
      toast.error("Erro", err.message || "Falha ao remover documento.");
    } finally {
      setDeleting(false);
      deleteModal.closeModal();
      setSelectedDoc(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editDoc) return;

    try {
      setSavingEdit(true);

      let validadeIso = null;
      if (editDoc.validade) {
        const raw = editDoc.validade;
        const base = raw.includes("T") ? raw : `${raw}T00:00:00`;
        validadeIso = new Date(base).toISOString();
      }

      const payload = {
        ...editDoc,
        validade: validadeIso,
      };

      const res = await fetch(`/api/imoveis/${imovelId}/compliance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc: payload }),
      });

      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro ao salvar validade");

      toast.success("Validade atualizada!");
      setEditDoc(null);
      fetchList();
    } catch (err) {
      toast.error("Erro ao salvar", err.message || "Falha ao atualizar validade.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <>
      <Card className="space-y-6">
        <CardHeader>
          <CardTitle>Documentos de Compliance</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              value={doc.tipo}
              onChange={(e) => setDoc({ ...doc, tipo: e.target.value })}
            >
              <option value="">Selecione o tipo</option>
              {DOC_TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>

            <Input
              type="date"
              value={doc.validade || ""}
              onChange={(e) => setDoc({ ...doc, validade: e.target.value })}
              iconLeft={<CalendarDays className="h-4 w-4 opacity-60" />}
            />

            <div className="flex items-center">
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 cursor-pointer bg-accent text-white px-4 py-2 rounded
                          hover:bg-accent/90 transition font-medium shadow-sm"
              >
                <Upload size={16} />
                Selecionar arquivo
              </label>

              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={(e) =>
                  setDoc({ ...doc, file: e.target.files?.[0] ?? null })
                }
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={!isValid || loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {loading ? "Enviando…" : "Enviar"}
            </Button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Documentos anexados
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
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : itens.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum documento cadastrado.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <tbody>
                  {itens.map((d) => {
                    const vencido =
                      d.validade && new Date(d.validade) < new Date();

                    return (
                      <TableRow
                        key={d.id}
                        className="cursor-pointer hover:bg-muted/20"
                        onClick={() => setOpenDrawer(d)}
                      >
                        <TableCell>
                          <Badge status={d.tipo}>{d.tipo?.toUpperCase()}</Badge>
                        </TableCell>

                        <TableCell>
                          {d.validade
                            ? new Date(d.validade).toLocaleDateString("pt-BR")
                            : "—"}
                        </TableCell>

                        <TableCell>
                          <Badge status={vencido ? "vencido" : "valido"}>
                            {vencido ? "Vencido" : "Válido"}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {d.url && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(d.url, "_blank");
                              }}
                              className="text-accent text-sm font-medium hover:text-accent/80 flex items-center gap-1"
                            >
                              <Link2 size={14} className="opacity-80" />
                              Abrir
                            </button>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditDoc(d);
                              }}
                            >
                              <Edit size={16} />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDelete(d);
                              }}
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={deleteModal.open}
        onClose={deleteModal.closeModal}
        title="Excluir documento"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={deleteModal.closeModal}>
              Cancelar
            </Button>

            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
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
        }
      >
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja excluir{" "}
          <strong>{selectedDoc?.tipo?.toUpperCase()}</strong>? Esta ação é
          permanente.
        </p>
      </Modal>

      <Modal
        isOpen={!!editDoc}
        onClose={() => setEditDoc(null)}
        title="Editar validade"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditDoc(null)}>
              Cancelar
            </Button>

            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        }
      >
        {editDoc && (
          <div className="space-y-3">
            <p className="text-sm">{editDoc.tipo.toUpperCase()}</p>

            <Input
              type="date"
              value={editDoc.validade ? editDoc.validade.slice(0, 10) : ""}
              onChange={(e) =>
                setEditDoc({
                  ...editDoc,
                  validade: e.target.value,
                })
              }
            />
          </div>
        )}
      </Modal>

      {openDrawer && (
        <ComplianceDocDrawer
          doc={openDrawer}
          onClose={() => setOpenDrawer(null)}
          onEdit={(doc) => {
            setEditDoc(doc);
            setOpenDrawer(null);
          }}
          onDelete={(doc) => {
            requestDelete(doc);
            setOpenDrawer(null);
          }}
        />
      )}
    </>
  );
}
