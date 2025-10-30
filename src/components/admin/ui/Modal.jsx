"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Modal({ open, onOpenChange, title, children }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-panel-card text-panel-foreground rounded-2xl border border-border shadow-2xl">
        <DialogHeader>
          {title && <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>}
        </DialogHeader>
        <div className="mt-3">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
