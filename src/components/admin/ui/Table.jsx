// ======================================================
// TABLE — RESPONSIVA, SEM OVERFLOW E SEM REGEX DELETANDO CLASSES
// ======================================================

import { cn } from "@/lib/utils";

// WRAPPER (scroll horizontal seguro)
const Table = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-2xl border border-border/60 shadow-md bg-panel-card/95 backdrop-blur-sm transition-all",
        className
      )}
    >
      <table
        className={cn(
          "w-full table-auto caption-bottom text-sm text-left align-middle",
          "break-words", // quebra tudo no mobile
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

// HEADER
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

// ROW
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

// HEAD CELL
const TableHead = ({ className, children, ...props }) => (
  <th
    className={cn(
      "h-12 px-4 align-middle text-muted-foreground/80 font-semibold break-words",
      "[&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  >
    {children}
  </th>
);

// CELL — AGORA FLEX-FRIENDLY E RESPONSIVA
const TableCell = ({ className, children, ...props }) => (
  <td
    className={cn(
      "p-4 align-middle text-foreground/90 break-words",
      "group-hover:text-foreground transition-colors",
      "[&:has([role=checkbox])]:pr-0",
      // sem regex — você controla o layout onde realmente importa
      className
    )}
    {...props}
  >
    {children}
  </td>
);

export { Table, TableHeader, TableRow, TableHead, TableCell };
