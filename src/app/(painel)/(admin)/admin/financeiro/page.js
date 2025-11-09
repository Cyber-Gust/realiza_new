"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Banknote,
  Wallet,
  Users,
  BarChart3,
} from "lucide-react";

import ReceberPanel from "@/components/financeiro/ReceberPanel";
import PagarPanel from "@/components/financeiro/PagarPanel";
import RepassePanel from "@/components/financeiro/RepassePanel";
import InadimplenciaPanel from "@/components/financeiro/InadimplenciaPanel";
import ComissoesPanel from "@/components/financeiro/ComissoesPanel";
import FluxoCaixaPanel from "@/components/financeiro/FluxoCaixaPanel";

/**
 * 💰 Página principal do módulo Financeiro
 * Controla as abas, renderiza os painéis e integra com a rota /api/financeiro
 */
export default function FinanceiroPage() {
  const [tab, setTab] = useState("receber");

  return (
    <div className="space-y-6">
      {/* 🔹 Cabeçalho da página */}
      <PageHeader
        title="Módulo Financeiro"
        description="Controle total das receitas, despesas, repasses, inadimplências e fluxo de caixa da imobiliária."
      />

      {/* 🔹 Abas principais */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted rounded-lg p-1 flex flex-wrap md:flex-nowrap gap-2">
          <TabsTrigger
            value="receber"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2 rounded-md text-sm font-medium transition-all"
          >
            <TrendingUp size={16} /> Receber
          </TabsTrigger>

          <TabsTrigger
            value="pagar"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2 rounded-md text-sm font-medium transition-all"
          >
            <TrendingDown size={16} /> Pagar
          </TabsTrigger>

          <TabsTrigger
            value="repasse"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2 rounded-md text-sm font-medium transition-all"
          >
            <Banknote size={16} /> Repasses
          </TabsTrigger>

          <TabsTrigger
            value="inadimplencia"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2 rounded-md text-sm font-medium transition-all"
          >
            <Wallet size={16} /> Inadimplência
          </TabsTrigger>

          <TabsTrigger
            value="comissoes"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2 rounded-md text-sm font-medium transition-all"
          >
            <Users size={16} /> Comissões
          </TabsTrigger>

          <TabsTrigger
            value="fluxo"
            className="flex items-center gap-2 data-[state=active]:bg-foreground data-[state=active]:text-background px-4 py-2 rounded-md text-sm font-medium transition-all"
          >
            <BarChart3 size={16} /> Fluxo de Caixa
          </TabsTrigger>
        </TabsList>

        {/* 🔹 Conteúdo de cada aba dentro de Cards */}
        <div className="mt-6 space-y-4">
          <TabsContent value="receber">
            <Card className="p-6 space-y-4">
              <ReceberPanel />
            </Card>
          </TabsContent>

          <TabsContent value="pagar">
            <Card className="p-6 space-y-4">
              <PagarPanel />
            </Card>
          </TabsContent>

          <TabsContent value="repasse">
            <Card className="p-6 space-y-4">
              <RepassePanel />
            </Card>
          </TabsContent>

          <TabsContent value="inadimplencia">
            <Card className="p-6 space-y-4">
              <InadimplenciaPanel />
            </Card>
          </TabsContent>

          <TabsContent value="comissoes">
            <Card className="p-6 space-y-4">
              <ComissoesPanel />
            </Card>
          </TabsContent>

          <TabsContent value="fluxo">
            <Card className="p-6 space-y-4">
              <FluxoCaixaPanel />
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
