"use client";
import { cn } from "@/lib/utils";

export default function Table({ columns, data, className }) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border", className)}>
      <table className="w-full text-sm text-left">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            {columns.map((col) => (
              <th key={col} className="px-4 py-3 font-medium">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data?.length ? (
            data.map((row, i) => (
              <tr key={i} className="border-t border-border hover:bg-muted/50">
                {Object.values(row).map((val, j) => (
                  <td key={j} className="px-4 py-3">{val}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-5 text-center text-muted-foreground" colSpan={columns.length}>
                Nenhum registro encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
