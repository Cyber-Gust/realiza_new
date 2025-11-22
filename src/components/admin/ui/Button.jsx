import * as React from "react";
import clsx from "clsx";

const buttonVariants = ({ variant, size }) => {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 active:scale-95 shadow-sm";

  const variants = {
    default:
      "bg-accent text-accent-foreground shadow-md hover:bg-accent/90 hover:shadow-lg",
    ghost:
      "bg-transparent hover:bg-secondary/40 text-secondary-foreground border border-transparent hover:border-secondary/60",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-lg",
    link: "text-primary underline-offset-4 hover:underline",
  };

  const sizes = {
    default: "h-10 px-5 text-sm",
    sm: "h-8 px-3 text-xs rounded-lg",
    lg: "h-12 px-8 text-base rounded-xl",
    icon: "h-10 w-10",
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
        onClick={typeof onClick === "function" ? onClick : undefined}
        className={clsx(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
