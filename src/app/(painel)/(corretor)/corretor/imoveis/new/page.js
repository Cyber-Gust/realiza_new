"use client";

import ImovelForm from "@/components/corretor/imoveis/ImovelForm";

import { Button } from "@/components/admin/ui/Button";
import { useToast } from "@/contexts/ToastContext";
import { BackButton } from "@/components/admin/ui/BackButton";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NovoImovelPage() {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  const salvarImovel = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/imoveis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao cadastrar imóvel");

      toast.success("Imóvel cadastrado com sucesso!");
      router.push(`/corretor/imoveis/${data.data.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

    {/* Botão de voltar */}
    <BackButton />

    {/* HEADER */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Novo Imóvel
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Preencha os dados para cadastrar um novo imóvel.
        </p>
      </div>

      <Button
        disabled={loading}
        onClick={salvarImovel}
        className="flex items-center gap-2"
      >
        {loading ? "Salvando..." : "Salvar"}
      </Button>
    </div>

      {/* Formulário */}
      <ImovelForm data={form} onChange={setForm} />
    </div>
  );
}
