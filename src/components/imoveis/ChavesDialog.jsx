"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Input from "@/components/admin/forms/Input";
import { toast } from "@/components/ui/use-toast";

export default function ChavesDialog({ imovelId, open, onClose }) {
  const [localizacao, setLocalizacao] = useState("");
  const [novoLocal, setNovoLocal] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Carregar status atual
  const loadChave = async () => {
    const res = await fetch(`/api/imoveis/${imovelId}/chaves`);
    const json = await res.json();
    if (res.ok) setLocalizacao(json.data?.chaves_localizacao || "Não informado");
  };

  useEffect(() => {
    if (open) loadChave();
  }, [open]);

  // 🔹 Atualizar status
  const atualizarLocal = async () => {
    if (!novoLocal) return toast({ message: "Informe o novo local!", type: "error" });
    setLoading(true);
    try {
      const res = await fetch(`/api/imoveis/${imovelId}/chaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ localizacao: novoLocal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ message: "Localização atualizada!", type: "success" });
      setNovoLocal("");
      loadChave();
    } catch (err) {
      toast({ message: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle>Controle de Chaves</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <strong>Localização atual:</strong>{" "}
            <span className="font-medium text-foreground">{localizacao}</span>
          </p>

          <Input
            placeholder="Ex: Com corretor João / Em visita"
            value={novoLocal}
            onChange={(e) => setNovoLocal(e.target.value)}
          />

          <Button onClick={atualizarLocal} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Atualizar localização"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
