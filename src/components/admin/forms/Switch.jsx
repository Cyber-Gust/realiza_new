"use client";
import { Switch } from "@/components/ui/switch";

export default function FormSwitch({ label, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between border border-border rounded-md px-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
