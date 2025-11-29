import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

// 1. Label
const Label = forwardRef(({ className, error, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none transition-colors",
      error ? "text-red-500" : "text-foreground",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

// 2. Input
const Input = forwardRef(
  ({ className, error, iconLeft, iconRight, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        
        {iconLeft && (
          <span className="absolute left-3 text-muted-foreground pointer-events-none">
            {iconLeft}
          </span>
        )}

        <input
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xl border bg-background/80 backdrop-blur-sm px-3 py-2 text-sm",
            "placeholder:text-muted-foreground transition-all duration-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
            "hover:border-primary/40 active:scale-[0.99]",
            error
              ? "border-red-500 focus-visible:ring-red-500"
              : "border-input focus-visible:border-primary",
            iconLeft && "pl-10",
            iconRight && "pr-10",
            className
          )}
          {...props} // agora SEM iconLeft, SEM iconRight
        />

        {iconRight && (
          <span className="absolute right-3 text-muted-foreground pointer-events-none">
            {iconRight}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// 3. Textarea
const Textarea = forwardRef(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[90px] w-full rounded-xl border bg-background/80 backdrop-blur-sm px-3 py-2 text-sm",
      "placeholder:text-muted-foreground transition-all duration-300",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
      "hover:border-primary/40 active:scale-[0.99]",
      error
        ? "border-red-500 focus-visible:ring-red-500"
        : "border-input focus-visible:border-primary",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

// 4. Select
const Select = forwardRef(({ className, children, error, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full appearance-none rounded-xl border bg-background/80 backdrop-blur-sm px-3 py-2 text-sm",
        "transition-all duration-300 placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
        "hover:border-primary/40 active:scale-[0.99]",
        error
          ? "border-red-500 focus:ring-red-500"
          : "border-input focus:border-primary",
        className
      )}
      {...props}
    >
      {children}
    </select>

    <ChevronDown
      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60 pointer-events-none transition-all"
    />
  </div>
));
Select.displayName = "Select";

// 5. Form Error
const FormError = ({ message }) => {
  if (!message) return null;

  return (
    <p className="text-sm text-red-500 mt-1 font-medium animate-in fade-in slide-in-from-top-1">
      {message}
    </p>
  );
};

export { Input, Label, Textarea, Select, FormError };
