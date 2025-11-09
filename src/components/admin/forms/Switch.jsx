"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";

export default function FormSwitch({ label, checked, onCheckedChange }) {
  const switchId = React.useId();

  return (
    <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <label
        htmlFor={switchId}
        className="cursor-pointer text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <Switch
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}