"use client";
import { Button } from "@/components/ui/button";
import Card from "@/components/admin/ui/Card";
import Badge from "@/components/admin/ui/Badge";
import Modal from "@/components/admin/ui/Modal";
import Input from "@/components/admin/forms/Input";
import Select from "@/components/admin/forms/Select";
import { useLeads } from "@/hooks/useLeads";
import { useState } from "react";
import LeadForm from "./LeadForm";

export default function LeadTable() {
  const { leads, loading, createLead, deleteLead } = useLeads();
  const [open, setOpen] = useState(false);

  return (
    <Card title="Gestão de Leads" className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-foreground">Leads</h3>
        <Button onClick={() => setOpen(true)}>+ Novo Lead</Button>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-6">Carregando...</p>
      ) : leads.length === 0 ? (
        <p className="text-center text-muted-foreground py-6">Nenhum lead encontrado.</p>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl">
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
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-border hover:bg-muted/10">
                  <td className="px-4 py-3">{lead.nome}</td>
                  <td className="px-4 py-3">{lead.telefone}</td>
                  <td className="px-4 py-3">{lead.corretor?.nome_completo || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={lead.status === "concluido" ? "success" : lead.status === "perdido" ? "destructive" : "default"}>
                      {lead.status.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{lead.origem || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => deleteLead(lead.id)}>
                      Excluir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onOpenChange={setOpen} title="Novo Lead">
        <LeadForm onSave={createLead} onClose={() => setOpen(false)} />
      </Modal>
    </Card>
  );
}
