//src/components/perfis/PerfisTable.jsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function PerfisTable({ data = [], type = "", loading }) {
  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Carregando...
      </div>
    );

  if (!Array.isArray(data) || data.length === 0)
    return (
      <p className="p-4 text-center text-muted-foreground">
        Nenhum registro encontrado.
      </p>
    );

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-panel-card shadow-sm">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-muted/60 text-muted-foreground sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 font-medium">Foto</th>
            <th className="px-4 py-3 font-medium">Nome</th>
            <th className="px-4 py-3 font-medium">E-mail</th>
            <th className="px-4 py-3 font-medium">Telefone</th>
            {type === "equipe" && <th className="px-4 py-3 font-medium">Função</th>}
            {type === "personas" && <th className="px-4 py-3 font-medium">Tipo</th>}
            {type === "leads" && <th className="px-4 py-3 font-medium">Status</th>}
            <th className="px-4 py-3 font-medium text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className="border-t border-border hover:bg-muted/20 transition-colors"
            >
              {/* Foto / Miniatura */}
              <td className="px-4 py-3">
                <div className="relative w-10 h-10">
                  <Image
                    src={item.avatar_url || "/placeholder-avatar.png"}
                    alt={item.nome_completo || item.nome || "Foto"}
                    fill
                    className="rounded-full object-cover border border-border"
                  />
                </div>
              </td>

              {/* Nome */}
              <td className="px-4 py-3 font-medium">
                {item.nome_completo || item.nome || "-"}
              </td>

              {/* Email */}
              <td className="px-4 py-3 text-muted-foreground">
                {item.email || "-"}
              </td>

              {/* Telefone */}
              <td className="px-4 py-3">{item.telefone || "-"}</td>

              {/* Campos condicionais */}
              {type === "equipe" && (
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.role === "admin"
                        ? "bg-green-700 text-white"
                        : "bg-purple-700 text-white"
                    }`}
                  >
                    {item.role}
                  </span>
                </td>
              )}

              {type === "personas" && (
                <td className="px-4 py-3 capitalize">{item.tipo || "-"}</td>
              )}

              {type === "leads" && (
                <td className="px-4 py-3 capitalize">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "concluido"
                        ? "bg-green-700 text-white"
                        : item.status === "perdido"
                        ? "bg-red-700 text-white"
                        : "bg-blue-700 text-white"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              )}

              {/* Botão de ação */}
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/perfis/${item.id}?type=${type}`}
                  className="inline-block"
                >
                  <Button size="sm" variant="default" className="rounded-lg shadow-sm">
                    Ver Detalhes
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
