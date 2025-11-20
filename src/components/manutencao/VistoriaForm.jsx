"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Input from "@/components/admin/forms/Input";
import Toast from "@/components/admin/ui/Toast";
import { Loader2, Upload } from "lucide-react";

export default function VistoriaForm({ vistoria, onClose, onSaved }) {
  const [form, setForm] = useState({
    imovel_id: "",
    contrato_id: "",
    tipo: "",
    data_vistoria: "",
    laudo_descricao: "",
    documento_laudo_url: "",
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imoveis, setImoveis] = useState([]);

  useEffect(() => {
    if (vistoria) setForm(vistoria);
    loadImoveis();
  }, [vistoria]);

  const loadImoveis = async () => {
    try {
      const res = await fetch("/api/imoveis/list", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao buscar imóveis");

      setImoveis(
        (json.data || []).map((i) => ({
          label: i.titulo_curto || i.titulo || i.endereco_cidade || "Sem nome",
          value: i.id,
        }))
      );
    } catch (err) {
      Toast.error("Erro ao carregar imóveis");
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // =======================================================
  // 🔹 Upload direto para o bucket "documentos_vistorias"
  // =======================================================
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const folder = form.contrato_id || form.imovel_id;
      if (!folder) throw new Error("Selecione um imóvel antes de enviar o arquivo.");

      const filePath = `${folder}/vistoria_${Date.now()}_${file.name}`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", filePath);
      formData.append("bucket", "documentos_vistorias");

      const uploadRes = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error);

      setForm((prev) => ({ ...prev, documento_laudo_url: uploadJson.url }));
      Toast.success("Laudo anexado com sucesso!");
    } catch (err) {
      Toast.error("Falha ao enviar arquivo: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // =======================================================
  // 🔹 Submissão
  // =======================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const method = vistoria ? "PUT" : "POST";
      const res = await fetch("/api/manutencao/vistorias", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          contrato_id: form.contrato_id || null,
          documento_laudo_url: form.documento_laudo_url || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao salvar");

      Toast.success(vistoria ? "Vistoria atualizada!" : "Vistoria criada!");
      onSaved?.();
      onClose?.();
    } catch (err) {
      Toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 🔸 Imóvel */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Imóvel</label>
        <select
          name="imovel_id"
          value={form.imovel_id}
          onChange={handleChange}
          required
          className="w-full border border-border rounded-md px-3 py-2 text-sm"
        >
          <option value="">Selecione o imóvel...</option>
          {imoveis.map((i) => (
            <option key={i.value} value={i.value}>
              {i.label}
            </option>
          ))}
        </select>
      </div>

      {/* 🔸 Tipo */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Tipo de vistoria</label>
        <select
          name="tipo"
          value={form.tipo}
          onChange={handleChange}
          required
          className="w-full border border-border rounded-md px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
          <option value="preventiva">Preventiva</option>
          <option value="outra">Outra</option>
        </select>
      </div>

      {/* 🔸 Data */}
      <Input
        label="Data da Vistoria"
        type="date"
        name="data_vistoria"
        value={form.data_vistoria}
        onChange={handleChange}
        required
      />

      {/* 🔸 Descrição */}
      <Input
        label="Descrição do Laudo"
        name="laudo_descricao"
        value={form.laudo_descricao}
        onChange={handleChange}
        textarea
      />

      {/* 🔸 Upload */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Documento do Laudo</label>
        {form.documento_laudo_url ? (
          <div className="flex items-center justify-between border p-2 rounded-md">
            <a
              href={form.documento_laudo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm hover:underline"
            >
              Ver documento
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setForm((p) => ({ ...p, documento_laudo_url: "" }))}
            >
              Remover
            </Button>
          </div>
        ) : (
          <label className="flex items-center justify-center border border-dashed p-4 rounded-md cursor-pointer hover:bg-muted">
            <Upload size={16} className="mr-2" />
            {uploading ? "Enviando..." : "Anexar Laudo (PDF/Imagem)"}
            <input type="file" accept=".pdf,image/*" className="hidden" onChange={handleUpload} />
          </label>
        )}
      </div>

      <Button type="submit" disabled={saving || uploading} className="w-full">
        {saving ? (
          <>
            <Loader2 className="animate-spin mr-2" />
            Salvando...
          </>
        ) : vistoria ? (
          "Atualizar Vistoria"
        ) : (
          "Criar Vistoria"
        )}
      </Button>
    </form>
  );
}
