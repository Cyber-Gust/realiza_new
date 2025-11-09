"use client";
import { cn } from "@/lib/utils";

export default function Table({ columns = [], data = [], className }) {
  return (
    <div className={cn("relative w-full overflow-auto rounded-lg border", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b bg-muted transition-colors hover:bg-muted/50">
            {columns.map((col, idx) => {
              const key = typeof col === "string" ? col : col.key ?? idx;
              const label = typeof col === "string" ? col : col.label ?? col.key;
              return (
                <th
                  key={key}
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                >
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data?.length ? (
            data.map((row, i) => (
              <tr
                key={i}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                {columns.map((col, j) => {
                  const key = typeof col === "string" ? col : col.key;
                  const val = row[key];
                  return (
                    <td
                      key={`${i}-${key || j}`}
                      className="p-4 align-middle"
                    >
                      {val === null || val === undefined
                        ? ""
                        : typeof val === "object" && val.$$typeof
                          ? val
                          : String(val)}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="p-6 text-center text-muted-foreground"
                colSpan={columns.length}
              >
                Nenhum registro encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}