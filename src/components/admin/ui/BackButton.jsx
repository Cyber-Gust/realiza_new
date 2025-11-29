import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="
        inline-flex items-center gap-2
        text-sm font-medium 
        text-muted-foreground hover:text-foreground
        transition-colors
      "
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Voltar</span>
    </button>
  );
}
