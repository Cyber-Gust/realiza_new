"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import Modal from "@/components/admin/ui/Modal";
import LeadForm from "./LeadForm";
import { useLeads } from "@/hooks/useLeads";
import { Trash2, PencilLine, Filter } from "lucide-react";
import { motion } from "framer-motion";

export default function LeadTable() {
  const { leads, loading, createLead, deleteLead } = useLeads();
  const [open, setOpen] = useState(false);

  return (
    <Card title="Gestão de Leads" className="space-y-4">
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

      {loading ? (
        <p className="text-center text-muted-foreground py-6 animate-pulse">
          Carregando...
        </p>
      ) : leads.length === 0 ? (
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
              {leads.map((lead, i) => (
                <motion.tr
                  key={lead.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="
                    border-t border-border hover:bg-muted/10 transition-all duration-150
                  "
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
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteLead(lead.id)}
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

      <Modal open={open} onOpenChange={setOpen} title="Novo Lead">
        <LeadForm onSave={createLead} onClose={() => setOpen(false)} />
      </Modal>
    </Card>
  );
}
