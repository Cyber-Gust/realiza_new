"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import Modal from "@/components/admin/ui/Modal";
import LeadForm from "./LeadForm";
import { Trash2, PencilLine, Filter } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Tabela de Leads — versão integrada com o painel principal
 * Recebe os dados e handlers via props (fonte única de verdade)
 */
export default function LeadTable({ data = [], loading, onReload, onCreate, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <Card title="Gestão de Leads" className="space-y-4">
      {/* 🔹 Cabeçalho */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Filter size={16} className="text-accent" /> Leads
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1"
        >
          <PencilLine size={14} /> Novo
        </Button>
      </div>

      {/* 🔹 Corpo */}
      {loading ? (
        <p className="text-center text-muted-foreground py-6 animate-pulse">
          Carregando...
        </p>
      ) : data.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">
          Nenhum lead encontrado.
        </p>
      ) : (
        <motion.div layout className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Telefone</th>
                <th className="px-4 py-3 text-left">Corretor</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Origem</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map((lead, i) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-t border-border hover:bg-muted/10 transition-all duration-150"
                >
                  <td className="px-4 py-3">{lead.nome}</td>
                  <td className="px-4 py-3">{lead.telefone}</td>
                  <td className="px-4 py-3">{lead.corretor?.nome_completo || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        lead.status === "concluido"
                          ? "success"
                          : lead.status === "perdido"
                          ? "destructive"
                          : "default"
                      }
                      className="capitalize"
                    >
                      {lead.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{lead.origem || "-"}</td>

                  {/* 🔹 Botão de excluir */}
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await onDelete(lead.id);
                        await onReload(); 
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* 🔹 Modal Novo Lead */}
      <Modal open={open} onOpenChange={setOpen} title="Novo Lead">
        <LeadForm
          onSave={async (lead) => {
            await onCreate(lead);
            setOpen(false);
            await onReload();
          }}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </Card>
  );
}
