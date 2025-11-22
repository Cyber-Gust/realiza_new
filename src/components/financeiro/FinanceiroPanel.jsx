"use client";

import { useState } from "react";

import { Card } from "@/components/admin/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/Tabs";

import { 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Users, 
  Wallet 
} from "lucide-react";

import ReceberPanel from "./ReceberPanel";
import PagarPanel from "./PagarPanel";
import RepassePanel from "./RepassePanel";
import InadimplenciaPanel from "./InadimplenciaPanel";
import ComissoesPanel from "./ComissoesPanel";
import FluxoCaixaPanel from "./FluxoCaixaPanel";

export default function FinanceiroPanel() {
  const [tab, setTab] = useState("receber");

  return (
    <div className="space-y-6">

      {/* Substituindo PageHeader inexistente */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestão Financeira</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie receitas, despesas, repasses e fluxo de caixa da imobiliária.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        
        <TabsList className="bg-muted rounded-lg p-1 flex flex-wrap md:flex-nowrap gap-2">
          <TabsTrigger 
            value="receber" 
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <TrendingUp size={16} /> Receber
          </TabsTrigger>

          <TabsTrigger 
            value="pagar" 
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <TrendingDown size={16} /> Pagar
          </TabsTrigger>

          <TabsTrigger 
            value="repasse" 
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <Banknote size={16} /> Repasse
          </TabsTrigger>

          <TabsTrigger 
            value="inadimplencia" 
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <Wallet size={16} /> Inadimplência
          </TabsTrigger>

          <TabsTrigger 
            value="comissoes" 
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <Users size={16} /> Comissões
          </TabsTrigger>

          <TabsTrigger 
            value="fluxo" 
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <BarChart3 size={16} /> Fluxo
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          <TabsContent value="receber">
            <Card className="p-6"><ReceberPanel /></Card>
          </TabsContent>

          <TabsContent value="pagar">
            <Card className="p-6"><PagarPanel /></Card>
          </TabsContent>

          <TabsContent value="repasse">
            <Card className="p-6"><RepassePanel /></Card>
          </TabsContent>

          <TabsContent value="inadimplencia">
            <Card className="p-6"><InadimplenciaPanel /></Card>
          </TabsContent>

          <TabsContent value="comissoes">
            <Card className="p-6"><ComissoesPanel /></Card>
          </TabsContent>

          <TabsContent value="fluxo">
            <Card className="p-6"><FluxoCaixaPanel /></Card>
          </TabsContent>
        </div>

      </Tabs>
    </div>
  );
}
