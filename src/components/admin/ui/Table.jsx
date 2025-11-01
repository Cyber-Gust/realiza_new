"use client";
import { cn } from "@/lib/utils";

export default function Table({ columns = [], data = [], className }) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border", className)}>
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            {columns.map((col, idx) => {
              // 🧩 Permite string ou objeto { key, label }
              const key = typeof col === "string" ? col : col.key ?? idx;
              const label = typeof col === "string" ? col : col.label ?? col.key;
              return (
                <th key={key} className="px-4 py-3 font-medium whitespace-nowrap">
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data?.length ? (
            data.map((row, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/50">
                {columns.map((col, j) => {
                  const key = typeof col === "string" ? col : col.key;
                  const val = row[key];
                  return (
                    <td key={`${i}-${key || j}`} className="px-4 py-3">
                      {val !== undefined && val !== null ? String(val) : ""}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                className="px-4 py-5 text-center text-muted-foreground"
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
