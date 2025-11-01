"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import StatusBadge from "./StatusBadge";

export default function ImoveisTable({ data = [], onSelect }) {
  const router = useRouter();

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <p className="p-4 text-center text-muted-foreground">
        Nenhum imóvel encontrado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-panel-card shadow-sm">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-muted/60 text-muted-foreground sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 font-medium">Código</th>
            <th className="px-4 py-3 font-medium">Título</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Cidade</th>
            <th className="px-4 py-3 font-medium">Venda (R$)</th>
            <th className="px-4 py-3 font-medium">Locação (R$)</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {data.map((i) => (
            <tr
              key={i.id}
              className="border-t border-border hover:bg-muted/20 transition-colors"
            >
              <td className="px-4 py-3">{i.codigo_ref || "-"}</td>
              <td className="px-4 py-3 truncate max-w-[180px]">{i.titulo || "-"}</td>
              <td className="px-4 py-3 capitalize">{i.tipo || "-"}</td>
              <td className="px-4 py-3">{i.endereco_cidade || "-"}</td>
              <td className="px-4 py-3">
                {i.preco_venda
                  ? `R$ ${Number(i.preco_venda).toLocaleString("pt-BR")}`
                  : "-"}
              </td>
              <td className="px-4 py-3">
                {i.preco_locacao
                  ? `R$ ${Number(i.preco_locacao).toLocaleString("pt-BR")}`
                  : "-"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={i.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  size="sm"
                  variant="default"
                  className="rounded-lg shadow-sm hover:opacity-90"
                  onClick={() =>
                    onSelect
                      ? onSelect(i)
                      : router.push(`/admin/imoveis/${i.id}`)
                  }
                >
                  Ver Detalhes
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
