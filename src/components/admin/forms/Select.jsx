"use client";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function FormSelect({ label, options = [], value, onValueChange }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-muted-foreground">{label}</label>}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="border border-input rounded-md bg-background text-foreground">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent className="bg-panel-card text-panel-foreground">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
