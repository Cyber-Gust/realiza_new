import { cn } from "@/lib/utils";

const Table = ({ className, children, ...props }) => (
  <div className="w-full overflow-auto rounded-2xl border border-border/60 shadow-md bg-panel-card/95 backdrop-blur-sm transition-all">
    <table
      className={cn(
        "w-full caption-bottom text-sm text-left align-middle",
        className
      )}
      {...props}
    >
      {children}
    </table>
  </div>
);

const TableHeader = ({ className, children, ...props }) => (
  <thead
    className={cn(
      "bg-muted/40 backdrop-blur-sm",
      "[&_tr]:border-b [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide [&_th]:font-semibold",
      className
    )}
    {...props}
  >
    {children}
  </thead>
);

const TableRow = ({ className, children, ...props }) => (
  <tr
    className={cn(
      "border-b border-border/40 transition-all duration-200",
      "hover:bg-muted/25",
      "data-[state=selected]:bg-primary/10",
      className
    )}
    {...props}
  >
    {children}
  </tr>
);

const TableHead = ({ className, children, ...props }) => (
  <th
    className={cn(
      "h-12 px-4 align-middle text-muted-foreground/80 font-semibold",
      "[&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  >
    {children}
  </th>
);

const TableCell = ({ className, children, ...props }) => (
  <td
    className={cn(
      "p-4 align-middle text-foreground/90",
      "group-hover:text-foreground transition-colors",
      "[&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  >
    {children}
  </td>
);

export { Table, TableHeader, TableRow, TableHead, TableCell };
