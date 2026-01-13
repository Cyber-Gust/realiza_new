"use client";

import { use } from "react";
import ImovelDetailPageClient from "@/components/corretor/imoveis/ImovelDetailPageClient";

export default function Page({ params }) {
  const { id: imovelId } = use(params);

  return <ImovelDetailPageClient imovelId={imovelId} />;
}
