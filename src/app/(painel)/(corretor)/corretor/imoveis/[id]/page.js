"use client";

import { use } from "react";
import ImovelDetailPageClient from "@/components/imoveis/ImovelDetailPageClient";

export default function Page({ params }) {
  const { id: imovelId } = use(params);

  return <ImovelDetailPageClient imovelId={imovelId} />;
}
