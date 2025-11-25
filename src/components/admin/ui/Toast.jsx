import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from "lucide-react";

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    wrapper: "border-emerald-200 bg-white/95", // Fundo branco translúcido
    iconColor: "text-emerald-500",
    titleColor: "text-emerald-950",
    textColor: "text-slate-600",
    progress: "bg-emerald-500",
  },
  error: {
    icon: AlertCircle,
    wrapper: "border-red-200 bg-white/95",
    iconColor: "text-red-500",
    titleColor: "text-red-950",
    textColor: "text-slate-600",
    progress: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    wrapper: "border-amber-200 bg-white/95",
    iconColor: "text-amber-500",
    titleColor: "text-amber-950",
    textColor: "text-slate-600",
    progress: "bg-amber-500",
  },
  info: {
    icon: Info,
    wrapper: "border-blue-200 bg-white/95",
    iconColor: "text-blue-500",
    titleColor: "text-blue-950",
    textColor: "text-slate-600",
    progress: "bg-blue-500",
  },
};

export default function Toast({ type = "success", title, message, onClose, duration = 5000 }) {
  const [progress, setProgress] = useState(100);
  
  // Seleciona o estilo baseado no tipo, ou usa 'success' como fallback
  const style = VARIANTS[type] || VARIANTS.success;
  const Icon = style.icon;

  // Lógica da animação da barra de tempo
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) return 0;
        // Calcula a redução baseada em updates de 100ms
        return prev - (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(timer);
  }, [duration]);

  return (
    <div className={cn(
      "pointer-events-auto relative w-full max-w-sm overflow-hidden", 
      "rounded-2xl border shadow-2xl shadow-black/5 backdrop-blur-md", // Visual Premium
      "flex flex-col",
      style.wrapper
    )}>
      
      <div className="p-4 flex items-start gap-3">
        {/* Ícone */}
        <div className={cn("flex-shrink-0 mt-0.5", style.iconColor)}>
          <Icon className="h-5 w-5" strokeWidth={2.5} />
        </div>

        {/* Texto */}
        <div className="flex-1">
          <p className={cn("text-sm font-semibold leading-tight", style.titleColor)}>
            {title}
          </p>
          {message && (
            <p className={cn("mt-1 text-sm font-medium leading-relaxed opacity-90", style.textColor)}>
              {message}
            </p>
          )}
        </div>

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="flex-shrink-0 -mt-1 -mr-1 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Barra de progresso animada no rodapé */}
      <div className="h-1 w-full bg-slate-100/50">
        <div 
            className={cn("h-full transition-all ease-linear", style.progress)} 
            style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}