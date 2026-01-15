"use client";

import { useState } from "react";

import { Card } from "@/components/admin/ui/Card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/admin/ui/Tabs";

/* PAINÉIS NOVOS (UNIFICADOS) */
import ReceitasPanel from "@/components/financeiro-aluguel/ReceitasPanel";
import DespesasPanel from "@/components/financeiro-aluguel/DespesasPanel";
import FluxoCaixaPanel from "@/components/financeiro-aluguel/FluxoCaixaPanel";
import InadimplenciaPanel from "@/components/financeiro-aluguel/InadimplenciaPanel";

export default function FinanceiroAlugueisPage() {
  const [tab, setTab] = useState("fluxo"); // default inteligente

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Financeiro - Aluguéis
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão consolidada das receitas, despesas e saúde financeira da imobiliária.
        </p>
      </div>

      {/* TABS */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">

        <TabsList className="bg-muted p-1 flex flex-wrap gap-2">

          <TabsTrigger value="fluxo">
            Fluxo de Caixa
          </TabsTrigger>

          <TabsTrigger value="receitas">
            Receitas
          </TabsTrigger>

          <TabsTrigger value="despesas">
            Despesas
          </TabsTrigger>

          <TabsTrigger value="inadimplencia">
            Inadimplência
          </TabsTrigger>

        </TabsList>

        {/* CONTENT */}
        <div className="mt-6 space-y-4">

          <TabsContent value="fluxo">
            <Card className="p-6">
              <FluxoCaixaPanel />
            </Card>
          </TabsContent>

          <TabsContent value="receitas">
            <Card className="p-6">
              <ReceitasPanel />
            </Card>
          </TabsContent>

          <TabsContent value="despesas">
            <Card className="p-6">
              <DespesasPanel />
            </Card>
          </TabsContent>

          <TabsContent value="inadimplencia">
            <Card className="p-6">
              <InadimplenciaPanel />
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
