"use client";
import { useEffect, useState } from "react";
import Toast from "@/components/admin/ui/Toast";
import FinanceiroTable from "./FinanceiroTable";
import FinanceiroResumo from "./FinanceiroResumo";
import { Trophy } from "lucide-react";
import Card from "@/components/admin/ui/Card";

export default function ComissoesPanel() {
  const [dados, setDados] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/financeiro?type=comissoes", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDados(json.data || []);
      setMeta(json.meta || {});
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  const ranking = dados.reduce((acc, d) => {
    const nome = d.profile?.nome_completo || "Desconhecido";
    acc[nome] = (acc[nome] || 0) + Number(d.valor || 0);
    return acc;
  }, {});

  const rankingArray = Object.entries(ranking)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Trophy size={18} /> Comissões e Ranking
      </h3>

      <FinanceiroResumo meta={meta} />

      <Card className="p-4">
        <h4 className="font-semibold mb-2 text-foreground">Ranking de Corretores</h4>
        <ul className="space-y-1">
          {rankingArray.map((r, i) => (
            <li key={r.nome} className="flex justify-between text-sm">
              <span>{i + 1}. {r.nome}</span>
              <span className="font-medium">R$ {r.valor.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </Card>

      <FinanceiroTable data={dados} loading={loading} />
    </div>
  );
}
