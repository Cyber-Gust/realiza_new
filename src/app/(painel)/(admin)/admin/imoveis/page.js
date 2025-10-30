"use client";

import { useEffect, useState } from "react";
import { Search, Home, MapPin, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import Input from "@/components/admin/forms/Input";
import Select from "@/components/admin/forms/Select";
import Card from "@/components/admin/ui/Card";
import { toast } from "@/components/ui/use-toast";

export default function ImoveisFeedPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [imoveis, setImoveis] = useState([]);
  const [filtros, setFiltros] = useState({
    status: "",
    tipo: "",
    cidade: "",
    busca: "",
  });

  const [loading, setLoading] = useState(false);

  // =====================================================
  // 🔹 Busca os imóveis no Supabase
  // =====================================================
  const loadImoveis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("imoveis")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImoveis(data || []);
    } catch (err) {
      toast({ message: "Erro ao carregar imóveis", type: "error" });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImoveis();
  }, []);

  // =====================================================
  // 🔹 Filtragem local (client-side)
  // =====================================================
  const filtered = imoveis.filter((i) => {
    const matchStatus = !filtros.status || i.status === filtros.status;
    const matchTipo = !filtros.tipo || i.tipo === filtros.tipo;
    const matchCidade =
      !filtros.cidade ||
      i.endereco_cidade?.toLowerCase().includes(filtros.cidade.toLowerCase());
    const matchBusca =
      !filtros.busca ||
      i.titulo?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      i.codigo_ref?.toLowerCase().includes(filtros.busca.toLowerCase());
    return matchStatus && matchTipo && matchCidade && matchBusca;
  });

  // =====================================================
  // 🔹 Função para buscar imagem de capa
  // =====================================================
  const getCapaUrl = async (imovelId) => {
    try {
      const { data } = await supabase.storage
        .from("imoveis_media")
        .list(`${imovelId}/`, { limit: 1 });
      if (data?.length) {
        const { data: url } = supabase.storage
          .from("imoveis_media")
          .getPublicUrl(`${imovelId}/${data[0].name}`);
        return url.publicUrl;
      }
      return "/images/realiza-placeholder.jpg"; // fallback
    } catch {
      return "/images/realiza-placeholder.jpg";
    }
  };

  // =====================================================
  // 🔹 Render
  // =====================================================
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Home className="w-6 h-6 text-accent" /> Imóveis
        </h1>
        <Button
          onClick={() => router.push("/admin/imoveis/new")}
          className="bg-accent text-accent-foreground"
        >
          + Novo Imóvel
        </Button>
      </div>

      {/* FILTROS */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            icon={<Search className="w-4 h-4 text-muted-foreground" />}
            placeholder="Buscar por título ou código..."
            value={filtros.busca}
            onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
          />
          <Select
            label="Status"
            value={filtros.status}
            onValueChange={(v) => setFiltros({ ...filtros, status: v })}
            options={[
              { label: "Todos", value: "" },
              { label: "Disponível", value: "disponivel" },
              { label: "Reservado", value: "reservado" },
              { label: "Alugado", value: "alugado" },
              { label: "Vendido", value: "vendido" },
              { label: "Inativo", value: "inativo" },
            ]}
          />
          <Select
            label="Tipo"
            value={filtros.tipo}
            onValueChange={(v) => setFiltros({ ...filtros, tipo: v })}
            options={[
              { label: "Todos", value: "" },
              { label: "Apartamento", value: "apartamento" },
              { label: "Casa", value: "casa" },
              { label: "Terreno", value: "terreno" },
              { label: "Comercial", value: "comercial" },
              { label: "Rural", value: "rural" },
            ]}
          />
          <Input
            icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
            placeholder="Cidade"
            value={filtros.cidade}
            onChange={(e) => setFiltros({ ...filtros, cidade: e.target.value })}
          />
        </div>
      </Card>

      {/* GRID DE IMÓVEIS */}
      {loading ? (
        <p className="text-muted-foreground text-center py-10">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">
          Nenhum imóvel encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((i) => (
            <div
              key={i.id}
              onClick={() => router.push(`/admin/imoveis/${i.id}`)}
              className="group cursor-pointer rounded-xl overflow-hidden border border-border shadow-sm bg-panel-card hover:shadow-md transition"
            >
              {/* Capa */}
              <div className="relative h-40 bg-muted">
                <img
                  src={`/api/imoveis/${i.id}/cover`}
                  alt={i.titulo}
                  className="object-cover w-full h-full group-hover:opacity-90 transition"
                  onError={(e) => (e.currentTarget.src = "/images/realiza-placeholder.jpg")}
                />
                <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded-md uppercase">
                  {i.status}
                </span>
              </div>

              {/* Conteúdo */}
              <div className="p-4 space-y-1">
                <h2 className="font-semibold text-foreground text-base line-clamp-1">
                  {i.titulo || "Imóvel sem título"}
                </h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {i.tipo}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {i.endereco_cidade}
                </p>
                <p className="font-semibold text-accent">
                  {i.preco_venda
                    ? `R$ ${Number(i.preco_venda).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}`
                    : i.preco_locacao
                    ? `R$ ${Number(i.preco_locacao).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}/mês`
                    : "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
