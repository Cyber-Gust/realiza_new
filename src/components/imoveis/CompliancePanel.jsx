"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import Card from "@/components/admin/ui/Card";
import DatePicker from "@/components/admin/forms/DatePicker";
import { Button } from "@/components/ui/button";
import Toast from "@/components/admin/ui/Toast";

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

  const isValid = useMemo(() => !!doc.tipo && !!doc.file, [doc]);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const r = await fetch(`/api/imoveis/${imovelId}/compliance`, { cache: "no-store" });
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
    if (imovelId) fetchList();
  }, [imovelId, fetchList]);

  const handleUpload = async () => {
    if (!isValid) return Toast.error("Preencha todos os campos.");
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("file", doc.file);
      fd.append("tipo", doc.tipo);
      if (doc.validade) fd.append("validade", new Date(doc.validade).toISOString());

      const r = await fetch(`/api/imoveis/${imovelId}/compliance`, { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha no upload");
      Toast.success("Documento enviado");
      setDoc({ tipo: "", validade: "", file: null });
      setItens(Array.isArray(j?.data) ? j.data : []);
    } catch (e) {
      Toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idOuUrl) => {
    if (!confirm("Remover este documento?")) return;
    try {
      setLoading(true);
      const r = await fetch(`/api/imoveis/${imovelId}/compliance`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idOuUrl }), // pode ser ID interno ou URL assinada
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Falha ao remover");
      setItens(Array.isArray(j?.data) ? j.data : itens.filter((x) => x.id !== idOuUrl && x.url !== idOuUrl));
      Toast.success("Documento removido");
    } catch (e) {
      Toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Documentos de Compliance" className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">Tipo</label>
          <select
            value={doc.tipo}
            onChange={(e) => setDoc({ ...doc, tipo: e.target.value })}
            className="flex h-10 w-full rounded-md border border-border bg-panel-card px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
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

        <DatePicker
          label="Validade"
          value={doc.validade}
          onChange={(d) => setDoc({ ...doc, validade: d })}
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">Arquivo</label>
          <input
            type="file"
            onChange={(e) => setDoc({ ...doc, file: e.target.files?.[0] ?? null })}
            className="flex h-10 w-full rounded-md border border-dashed border-border bg-panel-card px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="flex items-end">
          <Button onClick={handleUpload} disabled={!isValid || loading} className="w-full">
            {loading ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>

      <hr className="border-border" />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Lista de documentos</p>
          <Button variant="secondary" onClick={fetchList} disabled={loading}>
            Atualizar
          </Button>
        </div>

        {loading && itens.length === 0 ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : itens.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum documento cadastrado.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border overflow-hidden">
            {itens.map((d) => {
              const vencido = d.validade ? new Date(d.validade) < new Date() : false;
              return (
                <li key={d.id || d.url} className="flex items-center justify-between p-3 bg-panel-card">
                  <div className="flex flex-col">
                    <span className="text-foreground text-sm font-medium">
                      {d.tipo?.toUpperCase() || "Documento"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {d.validade ? `Validade: ${new Date(d.validade).toLocaleDateString("pt-BR")}` : "Sem validade"}
                    </span>
                    {d.url && (
                      <a href={d.url} target="_blank" className="text-xs underline mt-1">
                        Abrir arquivo
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${
                        vencido ? "border-red-300 text-red-700" : "border-emerald-300 text-emerald-700"
                      }`}
                    >
                      {vencido ? "Vencido" : "Válido"}
                    </span>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(d.id || d.url)}>
                      Remover
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
