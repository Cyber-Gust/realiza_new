"use client";

import { useState } from "react";

import { Card } from "@/components/admin/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/Tabs";

import ReceberPanel from "@/components/financeiro/ReceberPanel";
import PagarPanel from "@/components/financeiro/PagarPanel";
import RepassePanel from "@/components/financeiro/RepassePanel";
import InadimplenciaPanel from "@/components/financeiro/InadimplenciaPanel";
import ComissoesPanel from "@/components/financeiro/ComissoesPanel";
import FluxoCaixaPanel from "@/components/financeiro/FluxoCaixaPanel";

export default function FinanceiroPage() {
  const [tab, setTab] = useState("receber");

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Módulo Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Controle total das receitas, despesas, repasses, inadimplências e fluxo de caixa da imobiliária.
        </p>
      </div>

      {/* TABS */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">

        <TabsList className="bg-muted p-1 flex gap-2">

          <TabsTrigger value="receber">
            Receber
          </TabsTrigger>

          <TabsTrigger value="pagar">
            Pagar
          </TabsTrigger>

          <TabsTrigger value="repasse">
            Repasses
          </TabsTrigger>

          <TabsTrigger value="inadimplencia">
            Inadimplência
          </TabsTrigger>

          <TabsTrigger value="comissoes">
            Comissões
          </TabsTrigger>

          <TabsTrigger value="fluxo">
            Fluxo de Caixa
          </TabsTrigger>

        </TabsList>

        {/* CONTENT */}
        <div className="mt-6 space-y-4">

          <TabsContent value="receber">
            <Card className="p-6 space-y-4"><ReceberPanel /></Card>
          </TabsContent>

          <TabsContent value="pagar">
            <Card className="p-6 space-y-4"><PagarPanel /></Card>
          </TabsContent>

          <TabsContent value="repasse">
            <Card className="p-6 space-y-4"><RepassePanel /></Card>
          </TabsContent>

          <TabsContent value="inadimplencia">
            <Card className="p-6 space-y-4"><InadimplenciaPanel /></Card>
          </TabsContent>

          <TabsContent value="comissoes">
            <Card className="p-6 space-y-4"><ComissoesPanel /></Card>
          </TabsContent>

          <TabsContent value="fluxo">
            <Card className="p-6 space-y-4"><FluxoCaixaPanel /></Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
