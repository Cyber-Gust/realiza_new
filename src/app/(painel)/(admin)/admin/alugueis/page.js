"use client";

import { useState } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/Card";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/admin/ui/Tabs";

import {
  Bell,
  Wallet,
  AlertTriangle,
  RefreshCcw,
  DoorOpen,
  Clock,
} from "lucide-react";

import AlertasPanel from "@/components/alugueis/AlertasPanel";
import CarteiraPanel from "@/components/alugueis/CarteiraPanel";
import InadimplenciaPanel from "@/components/alugueis/InadimplenciaPanel";
import RenovacaoPanel from "@/components/alugueis/RenovacaoPanel";
import RescisaoPanel from "@/components/alugueis/RescisaoPanel";
import TimelinePanel from "@/components/alugueis/TimelinePanel";

export default function AlugueisPage() {
  const [tab, setTab] = useState("alertas");

  return (
    <div className="space-y-8 animate-in fade-in duration-150">

      {/* HEADER */}
      <Card className="p-6">
        <CardHeader className="p-0 mb-2">
          <CardTitle className="text-2xl text-center font-bold tracking-tight">
            Aluguéis
          </CardTitle>
        </CardHeader>
      </Card>

      {/* TABS */}
      <Tabs className="w-full">
        <TabsList className="bg-muted rounded-lg p-1 flex flex-wrap md:flex-nowrap gap-2">

          <TabsTrigger
            className="flex items-center gap-2 px-4 py-2"
            onClick={() => setTab("alertas")}
          >
            <Bell size={16} /> Alertas
          </TabsTrigger>

          <TabsTrigger
            className="flex items-center gap-2 px-4 py-2"
            onClick={() => setTab("carteira")}
          >
            <Wallet size={16} /> Carteira
          </TabsTrigger>

          <TabsTrigger
            className="flex items-center gap-2 px-4 py-2"
            onClick={() => setTab("inadimplencia")}
          >
            <AlertTriangle size={16} /> Inadimplência
          </TabsTrigger>

          <TabsTrigger
            className="flex items-center gap-2 px-4 py-2"
            onClick={() => setTab("renovacao")}
          >
            <RefreshCcw size={16} /> Renovação
          </TabsTrigger>

          <TabsTrigger
            className="flex items-center gap-2 px-4 py-2"
            onClick={() => setTab("rescisao")}
          >
            <DoorOpen size={16} /> Rescisão
          </TabsTrigger>

          <TabsTrigger
            className="flex items-center gap-2 px-4 py-2"
            onClick={() => setTab("timeline")}
          >
            <Clock size={16} /> Timeline
          </TabsTrigger>

        </TabsList>

        {/* CONTEÚDO */}
        <div className="mt-6 space-y-6">

          <TabsContent value="alertas" currentValue={tab}>
            <Card className="p-6">
              <AlertasPanel />
            </Card>
          </TabsContent>

          <TabsContent value="carteira" currentValue={tab}>
            <Card className="p-6">
              <CarteiraPanel />
            </Card>
          </TabsContent>

          <TabsContent value="inadimplencia" currentValue={tab}>
            <Card className="p-6">
              <InadimplenciaPanel />
            </Card>
          </TabsContent>

          <TabsContent value="renovacao" currentValue={tab}>
            <Card className="p-6">
              <RenovacaoPanel />
            </Card>
          </TabsContent>

          <TabsContent value="rescisao" currentValue={tab}>
            <Card className="p-6">
              <RescisaoPanel />
            </Card>
          </TabsContent>

          <TabsContent value="timeline" currentValue={tab}>
            <Card className="p-6">
              <TimelinePanel />
            </Card>
          </TabsContent>

        </div>
      </Tabs>
    </div>
  );
}
