"use client";
import PageHeader from "@/components/admin/layout/PageHeader";
import ImovelForm from "@/components/imoveis/ImovelForm";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/admin/ui/Toast";

export default function NovoImovelPage() {
  const router = useRouter();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);

  const salvarImovel = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/imoveis/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao cadastrar imóvel");

      Toast.success("Imóvel cadastrado com sucesso!");
      router.push(`/admin/imoveis/${data.data.id}`);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Imóvel"
        description="Preencha os dados para cadastrar um novo imóvel."
        rightSection={
          <Button
            disabled={loading}
            onClick={salvarImovel}
            className="flex items-center gap-2"
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        }
      />

      <ImovelForm data={form} onChange={setForm} />
    </div>
  );
}
