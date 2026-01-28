"use client";

import { useState } from "react";
// Removido o useRouter se não for mais navegar para outras páginas
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

import ReceitasLocacaoPanel from "@/components/alugueis/extras/ReceitasLocacaoPanel"
import ContratosPertoVencimento from "@/components/alugueis/extras/ContratosPertoVencimento";
import ControledeConta from "@/components/alugueis/extras/ControledeConta";
import EspelhoCarteira from "@/components/alugueis/extras/EspelhoCarteira";
import EvolucaoFinanceira from "@/components/alugueis/extras/EvolucaoFinanceira";
import GarantiasLocaticias from "@/components/alugueis/extras/GarantiasLocaticias";
import RecebimentoDiario from "@/components/alugueis/extras/RecebimentoDiario";


import { Select } from "@/components/admin/ui/Form";

export default function AlugueisPage() {
  const [tab, setTab] = useState("alertas");
  
  // Função para lidar com a troca de tab via Select
  function handleMaisOpcoes(value) {
    if (!value) return;
    setTab(value); // Agora define a tab ativa em vez de navegar
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Aluguéis
        </h1>
        <p className="text-muted-foreground text-sm max-w-2xl">
          Gestão completa dos contratos de locação.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-muted p-1 flex gap-2 flex-wrap items-center">
          <TabsTrigger value="alertas">Alertas</TabsTrigger>
          <TabsTrigger value="carteira">Carteira</TabsTrigger>
          <TabsTrigger value="inadimplencia">Inadimplência</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>

          <div className="min-w-[220px] ml-auto">
            <Select
              // Se a tab ativa for uma das opções do select, ele mostra o valor, senão fica no "Mais opções"
              value={["renovacao", "rescisao", "reajustes", "garantias", "vistorias"].includes(tab) ? tab : ""}
              onChange={(e) => handleMaisOpcoes(e.target.value)}
            >
              <option value="" disabled>
                Mais opções...
              </option>
              <option value="receitaslocacao">Receitas Locação</option>
              <option value="contratosavencer">Contratos a Vencer</option>
              <option value="controleconta">Controle de Conta</option>
              <option value="espelhocarteira">Espelho da Carteira</option>
              <option value="evolucaofinanceira">Evolução Financeira</option>
              <option value="garantiaslocaticias">Garantias Locatícias</option>
              <option value="recebimentodiario">Recebimento Diário</option>

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

          <TabsContent value="receitaslocacao" currentValue={tab}>
            <Card className="p-6">
              <ReceitasLocacaoPanel />
            </Card>
          </TabsContent>

           <TabsContent value="contratosavencer" currentValue={tab}>
            <Card className="p-6">
              <ContratosPertoVencimento />
            </Card>
           </TabsContent>

           <TabsContent value="controleconta" currentValue={tab}>
            <Card className="p-6">
              <ControledeConta />
            </Card>
           </TabsContent>

           <TabsContent value="espelhocarteira" currentValue={tab}>
            <Card className="p-6">
              <EspelhoCarteira />
            </Card>
           </TabsContent>

            <TabsContent value="evolucaofinanceira" currentValue={tab}>
              <Card className="p-6">
                <EvolucaoFinanceira />
              </Card>
            </TabsContent>

            <TabsContent value="garantiaslocaticias" currentValue={tab}>
              <Card className="p-6">
                <GarantiasLocaticias />
              </Card>
            </TabsContent>
            
            <TabsContent value="recebimentodiario" currentValue={tab}>
              <Card className="p-6">
                <RecebimentoDiario />
              </Card>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
