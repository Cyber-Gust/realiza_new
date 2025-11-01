"use client";
import Badge from "@/components/admin/ui/Badge";

export default function StatusBadge({ status }) {
  // Mapeia os status da tabela imoveis para os estilos existentes
  const statusMap = {
    disponivel: "disponivel",
    reservado: "reservado",
    alugado: "alugado",
    vendido: "vendido",
    inativo: "inativo",
  };

  const mapped = statusMap[status] || "inativo";

  return <Badge status={mapped}>{status}</Badge>;
}
