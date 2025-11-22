// src/components/Header.jsx
"use client";

import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Loader2, User as UserIcon } from "lucide-react";

export function Header({ user, profile }) {
  const avatarUrl = profile?.avatar_url || "/placeholder-avatar.png";
  const userName =
    profile?.nome_completo ||
    profile?.nome ||
    user?.user_metadata?.nome_completo ||
    user?.user_metadata?.nome ||
    user?.email?.split("@")[0] ||
    "Usuário";
  const role = profile?.role || user?.user_metadata?.role || "Online";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-panel-card/80 backdrop-blur-md px-6 h-16 flex items-center transition-all">
      {/* LEFT */}
      <div className="flex-1 flex items-center gap-4">
        <h2 className="text-sm font-medium text-muted-foreground hidden md:block">
          Painel Administrativo
        </h2>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="h-6 w-px bg-border mx-1" />

        <div className="group relative flex items-center gap-3">
          <button className="relative h-9 w-9 overflow-hidden rounded-full border border-border transition-all hover:ring-2 hover:ring-ring focus:outline-none focus:ring-2 focus:ring-ring">
            <Image
              src={avatarUrl}
              alt={userName}
              fill
              className="object-cover"
              sizes="36px"
            />
          </button>

          <div className="hidden lg:block text-right">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}