"use client";
import { useEffect, useState } from "react";
import Card from "@/components/admin/ui/Card";
import { Button } from "@/components/ui/button";
import Switch from "@/components/admin/forms/Switch";
import Toast from "@/components/admin/ui/Toast";
import useStorageUpload from "@/hooks/useStorageUpload";

export function MidiaPanel({ imovel }) {
  const [files, setFiles] = useState([]);
  const { uploadFile, listFiles, removeFile } = useStorageUpload("imoveis_media");

  const prefix = `imovel_${imovel.id}/`;

  const refresh = async () => {
    try {
      const arr = await listFiles(prefix); // precisa que o hook implemente listagem
      setFiles(arr || []);
    } catch (e) {
      // fallback silencioso
    }
  };

  useEffect(() => {
    if (imovel?.id) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imovel?.id]);

  const handleUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadFile(f, `${prefix}${f.name}`);
      setFiles((prev) => [{ url, name: f.name }, ...prev]);
      Toast.success("Arquivo enviado");
    } catch (e) {
      Toast.error(e.message);
    } finally {
      e.target.value = "";
    }
  };

  const handleDelete = async (nameOrUrl) => {
    if (!confirm("Excluir este arquivo?")) return;
    try {
      await removeFile(`${prefix}${typeof nameOrUrl === "string" && nameOrUrl.includes("http") ? nameOrUrl.split("/").pop() : nameOrUrl}`);
      Toast.success("Arquivo removido");
      refresh();
    } catch (e) {
      Toast.error(e.message);
    }
  };

  return (
    <Card title="Mídia e Publicação" className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Switch label="Publicar no site" checked={imovel.status === "disponivel"} disabled />
          <span className="text-xs text-muted-foreground">(controlado pelo status do imóvel)</span>
        </div>
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="file" onChange={handleUpload} className="hidden" id="midiaUploader" />
          <span className="px-3 py-2 rounded-md border border-border bg-panel-card">Enviar arquivo</span>
        </label>
      </div>

      {files?.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {files.map((f) => (
            <figure key={f.url || f.name} className="group rounded-lg overflow-hidden border border-border bg-panel-card">
              <img src={f.url} alt={f.name} className="w-full h-40 object-cover transition-transform group-hover:scale-105" />
              <figcaption className="flex items-center justify-between p-2 text-xs">
                <span className="truncate" title={f.name}>{f.name}</span>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(f.name)}>
                  Excluir
                </Button>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma mídia enviada ainda.</p>
      )}
    </Card>
  );
}

export default MidiaPanel;