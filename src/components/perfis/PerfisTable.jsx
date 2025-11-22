// src/components/perfis/PerfisTable.jsx

"use client";

import Image from "next/image";
import Link from "next/link";

// DS oficiais
import { Button } from "@/components/admin/ui/Button";
import { Badge } from "@/components/admin/ui/Badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/admin/ui/Table";

import { Loader2 } from "lucide-react";

export default function PerfisTable({ data = [], type = "", loading }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 text-muted-foreground">
        <Loader2 className="animate-spin mr-2" /> Carregando...
      </div>
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <p className="p-4 text-center text-muted-foreground">
        Nenhum registro encontrado.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Foto</TableHead>
          <TableHead>Nome</TableHead>
          <TableHead>E-mail</TableHead>
          <TableHead>Telefone</TableHead>

          {type === "equipe" && <TableHead>Função</TableHead>}
          {type === "personas" && <TableHead>Tipo</TableHead>}
          {type === "leads" && <TableHead>Status</TableHead>}

          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>

      <tbody>
        {data.map((item) => (
          <TableRow key={item.id}>
            {/* Foto */}
            <TableCell>
              <div className="relative w-10 h-10">
                <Image
                  src={item.avatar_url || "/placeholder-avatar.png"}
                  alt={item.nome_completo || item.nome || "Foto"}
                  fill
                  className="rounded-full object-cover border border-border"
                />
              </div>
            </TableCell>

            {/* Nome */}
            <TableCell className="font-medium">
              {item.nome_completo || item.nome || "-"}
            </TableCell>

            {/* Email */}
            <TableCell className="text-muted-foreground">
              {item.email || "-"}
            </TableCell>

            {/* Telefone */}
            <TableCell>{item.telefone || "-"}</TableCell>

            {/* Equipe */}
            {type === "equipe" && (
              <TableCell>
                <Badge status={item.role}>{item.role}</Badge>
              </TableCell>
            )}

            {/* Personas */}
            {type === "personas" && (
              <TableCell className="capitalize">
                <Badge status={item.tipo}>{item.tipo}</Badge>
              </TableCell>
            )}

            {/* Leads */}
            {type === "leads" && (
              <TableCell className="capitalize">
                <Badge status={item.status}>{item.status}</Badge>
              </TableCell>
            )}

            {/* Ações */}
            <TableCell className="text-right">
              <Link
                href={`/admin/perfis/${item.id}?type=${type}`}
                className="inline-block"
              >
                <Button size="sm" variant="default" className="rounded-lg shadow-sm">
                  Ver Detalhes
                </Button>
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}
