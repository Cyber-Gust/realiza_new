"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Card } from "@/components/admin/ui/Card";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/admin/ui/Tabs";

import AlertasPanel from "@/components/alugueis/AlertasPanel";
import CarteiraPanel from "@/components/alugueis/CarteiraPanel";
import InadimplenciaPanel from "@/components/alugueis/InadimplenciaPanel";
import TimelinePanel from "@/components/alugueis/TimelinePanel";

// 👇 importa seu Select de onde ele estiver
import { Select } from "@/components/admin/ui/Form";

export default function AlugueisPage() {
  const [tab, setTab] = useState("alertas");
  const [maisOpcao, setMaisOpcao] = useState(""); // controla o select
  const router = useRouter();

  function handleMaisOpcoes(value) {
    if (!value) return;

    // navega
    router.push(value);

    // reseta o select pra não ficar travado numa opção
    setMaisOpcao("");
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Aluguéis
        </h1>

        <p className="text-muted-foreground text-sm max-w-2xl">
          Gestão completa dos contratos de locação: alertas, carteira, inadimplência e linha do tempo operacional.
        </p>
      </div>

      {/* TABS */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted p-1 flex gap-2 flex-wrap items-center">
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="carteira">Carteira</TabsTrigger>
          <TabsTrigger value="inadimplencia">Inadimplência</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>

          {/* MAIS OPÇÕES (SELECT) */}
          <div className="min-w-[220px] ml-auto">
            <Select
              value={maisOpcao}
              onChange={(e) => handleMaisOpcoes(e.target.value)}
            >
              <option value="" disabled>
                Mais opções...
              </option>

              <option value="/admin/alugueis/renovacao">Renovação</option>
              <option value="/admin/alugueis/rescisao">Rescisão</option>
              <option value="/admin/alugueis/reajustes">Reajustes</option>
              <option value="/admin/alugueis/garantias">Garantias</option>
              <option value="/admin/alugueis/vistorias">Vistorias</option>
            </Select>
          </div>
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
