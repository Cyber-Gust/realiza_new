"use client";

import { useState } from "react";
import PageHeader from "@/components/admin/layout/PageHeader";
import Card from "@/components/admin/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Bell,
  Wallet,
  AlertTriangle,
  RefreshCcw,
  DoorOpen,
  Clock,
} from "lucide-react";

// Painéis do módulo
import AlertasPanel from "@/components/alugueis/AlertasPanel";
import CarteiraPanel from "@/components/alugueis/CarteiraPanel";
import InadimplenciaPanel from "@/components/alugueis/InadimplenciaPanel";
import RenovacaoPanel from "@/components/alugueis/RenovacaoPanel";
import RescisaoPanel from "@/components/alugueis/RescisaoPanel";
import TimelinePanel from "@/components/alugueis/TimelinePanel";

/**
 * ============================================================
 * 🏢 PÁGINA PRINCIPAL DO MÓDULO DE ALUGUÉIS
 * Estrutura unificada de controle:
 * - Alertas
 * - Carteira
 * - Inadimplência
 * - Renovação
 * - Rescisão
 * - Timeline Financeira
 * ============================================================
 */
export default function AlugueisPage() {
  const [tab, setTab] = useState("alertas");

  return (
    <div className="space-y-6">

      {/* =====================================
          🔹 HEAD
      ====================================== */}
      <PageHeader
        title="Módulo de Aluguéis"
        description="Centralização completa dos contratos de locação, inadimplência, carteira ativa, alertas e operações."
      />

      {/* =====================================
          🔹 ABAS
      ====================================== */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted rounded-lg p-1 flex flex-wrap md:flex-nowrap gap-2">

          <TabsTrigger
            value="alertas"
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <Bell size={16} />
            Alertas
          </TabsTrigger>

          <TabsTrigger
            value="carteira"
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <Wallet size={16} />
            Carteira
          </TabsTrigger>

          <TabsTrigger
            value="inadimplencia"
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <AlertTriangle size={16} />
            Inadimplência
          </TabsTrigger>

          <TabsTrigger
            value="renovacao"
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <RefreshCcw size={16} />
            Renovação
          </TabsTrigger>

          <TabsTrigger
            value="rescisao"
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <DoorOpen size={16} />
            Rescisão
          </TabsTrigger>

          <TabsTrigger
            value="timeline"
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all data-[state=active]:bg-foreground data-[state=active]:text-background"
          >
            <Clock size={16} />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* =====================================
            🔹 CONTEÚDOS
        ====================================== */}
        <div className="mt-6 space-y-4">

          {/* ALERTAS */}
          <TabsContent value="alertas">
            <Card className="p-6 space-y-4">
              <AlertasPanel />
            </Card>
          </TabsContent>

          {/* CARTEIRA */}
          <TabsContent value="carteira">
            <Card className="p-6 space-y-4">
              <CarteiraPanel />
            </Card>
          </TabsContent>

          {/* INADIMPLÊNCIA */}
          <TabsContent value="inadimplencia">
            <Card className="p-6 space-y-4">
              <InadimplenciaPanel />
            </Card>
          </TabsContent>

          {/* RENOVAÇÃO */}
          <TabsContent value="renovacao">
            <Card className="p-6 space-y-4">
              <RenovacaoPanel />
            </Card>
          </TabsContent>

          {/* RESCISÃO */}
          <TabsContent value="rescisao">
            <Card className="p-6 space-y-4">
              <RescisaoPanel />
            </Card>
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline">
            <Card className="p-6 space-y-4">
              <TimelinePanel />
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
