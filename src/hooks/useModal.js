"use client";
import { useState } from "react";

export default function useModal() {
  const [open, setOpen] = useState(false);
  return { open, openModal: () => setOpen(true), closeModal: () => setOpen(false), setOpen };
}
