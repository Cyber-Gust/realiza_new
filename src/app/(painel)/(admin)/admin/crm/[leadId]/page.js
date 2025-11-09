"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import CRMLeadDetailDrawer from "@/components/crm/CRMLeadDetailDrawer";
import Toast from "@/components/admin/ui/Toast";

export default function LeadDetailPage({ params }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const id = params?.leadId;

  const loadLead = async () => {
    try {
      const res = await fetch(`/api/crm/leads/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLead(json.data);
    } catch (err) {
      Toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) loadLead(); }, [id]);

  if (loading)
    return <p className="p-10 text-center text-muted-foreground">Carregando lead...</p>;

  if (!lead)
    return <p className="p-10 text-center text-muted-foreground">Lead não encontrado.</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.nome}
        description={`Status: ${lead.status || "-"} • Origem: ${lead.origem || "-"}`}
      />
      <Card className="p-6">
        <CRMLeadDetailDrawer open={true} onOpenChange={() => {}} leadId={lead.id} />
      </Card>
    </div>
  );
}
