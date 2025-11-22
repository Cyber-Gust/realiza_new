import { cn } from "@/lib/utils";

const Card = ({ className, children, ...props }) => (
  <div
    className={cn(
      "rounded-2xl border border-border/60 bg-panel-card/95 backdrop-blur-sm shadow-md transition-all duration-300 hover:shadow-lg hover:border-border",
      "will-change-transform hover:-translate-y-[2px]",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ className, children, ...props }) => (
  <div
    className={cn("flex flex-col space-y-2 p-6 pb-2", className)}
    {...props}
  >
    {children}
  </div>
);

const CardTitle = ({ className, children, ...props }) => (
  <h3
    className={cn(
      "font-semibold leading-tight tracking-tight text-xl text-foreground",
      className
    )}
    {...props}
  >
    {children}
  </h3>
);

const CardContent = ({ className, children, ...props }) => (
  <div
    className={cn("p-6 pt-2 text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </div>
);

const CardFooter = ({ className, children, ...props }) => (
  <div
    className={cn(
      "flex items-center justify-end p-6 pt-0 space-x-2",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
