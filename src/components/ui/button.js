import * as React from "react";
import clsx from "clsx";

/* NOTA: Esta é uma implementação simplificada do botão do shadcn/ui,
  adaptada para usar suas variáveis de CSS do Tailwind e sem 
  depender de 'cva' (class-variance-authority).
*/

const buttonVariants = ({ variant, size }) => {
  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

  // Variantes de Estilo
  const variants = {
    default: "bg-accent text-accent-foreground shadow hover:bg-accent/90",
    ghost: "hover:bg-secondary hover:text-secondary-foreground",
    secondary:
      "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
    link: "text-primary underline-offset-4 hover:underline",
  };

  // Variantes de Tamanho
  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-9 w-9", // Este é o que o ThemeToggle usa
  };

  return clsx(
    base,
    variants[variant] || variants.default,
    sizes[size] || sizes.default
  );
};

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
    const Comp = asChild ? "span" : "button";

    return (
      <Comp
        ref={ref}
        // ✅ evita erro de "onClick = false"
        onClick={typeof onClick === "function" ? onClick : undefined}
        className={clsx(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
