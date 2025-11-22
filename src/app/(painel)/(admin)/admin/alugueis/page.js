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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Aluguéis
        </h1>

        <p className="text-muted-foreground text-sm max-w-2xl">
          Gestão completa dos contratos de locação: alertas, carteira, inadimplência, renovações,
          rescisões e linha do tempo operacional.
        </p>
      </div>  

      {/* TABS */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="bg-muted p-1 flex gap-2">
            <TabsTrigger value="alertas">Alertas</TabsTrigger>
            <TabsTrigger value="carteira">Carteira</TabsTrigger>
            <TabsTrigger value="iandimplencia">Inadimplencia</TabsTrigger>
            <TabsTrigger value="renovacao">Renovacao</TabsTrigger>
            <TabsTrigger value="rescisao">Rescisao</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>

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
