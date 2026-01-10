"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, X } from "lucide-react";
import { navItems } from "@/components/admin/layout/Sidebar";

export function Header({ user, profile }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const avatarUrl = profile?.avatar_url || "/placeholder-avatar.png";

  const userName =
    profile?.nome_completo ||
    profile?.nome ||
    user?.user_metadata?.nome_completo ||
    user?.user_metadata?.nome ||
    user?.email?.split("@")[0] ||
    "Usuário";

  const role = profile?.role || user?.user_metadata?.role || "Admin";

  // FECHAR AO CLICAR FORA
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    }
    if (mobileMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <header
      className="
        sticky top-0 z-40 w-full h-16 px-6 
        flex items-center justify-between
        bg-panel-card/80 backdrop-blur-md 
        border-b border-border/40 shadow-sm
      "
    >
      {/* LEFT */}
      <div className="flex items-center gap-3">

        {/* BOTÃO MOBILE */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`
            lg:hidden p-2 -ml-2 rounded border
            transition-all duration-200

            ${mobileMenuOpen
              ? "border-accent bg-accent text-white"
              : "border-accent text-accent hover:bg-accent/10"
            }
          `}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-white" />
          ) : (
            <Menu className="h-5 w-5 text-accent" />
          )}
        </button>

        {/* ESCONDER TÍTULO NO MOBILE */}
        <h2 className="hidden lg:flex text-sm font-medium text-foreground tracking-tight">
          Painel do Corretor
        </h2>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2 md:gap-4">

        <div className="flex items-center gap-2 pr-2">
          <ThemeToggle />
        </div>

        <div className="h-6 w-px bg-border/40 mx-1 hidden md:block" />

        <button
          className="
            group flex items-center gap-3 pl-1 pr-3 py-1 rounded-full
            border border-transparent hover:border-border/40 hover:bg-muted/40 
            transition-all duration-200
          "
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-full border border-border/60 shadow-sm">
            <Image
              src={avatarUrl}
              alt={userName}
              fill
              className="object-cover"
              sizes="36px"
            />
          </div>

          <div className="hidden lg:flex flex-col items-start text-left">
            <p className="text-sm font-semibold text-foreground leading-none">
              {userName}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">
              {role}
            </p>
          </div>
        </button>
      </div>

      {/* ⚡ DROPDOWN MOBILE */}
      {mobileMenuOpen && (
        <div
          ref={menuRef}
          className="
            absolute top-16 left-0 w-full 
            bg-panel-card/95 backdrop-blur-md 
            border-b border-border/40 shadow-xl 
            z-50 py-3 animate-in fade-in slide-in-from-top-2
          "
        >
          <nav className="flex flex-col px-4 gap-1">

            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="
                  flex items-center gap-3 py-2 px-3 rounded-lg
                  text-sm text-foreground hover:bg-muted/50
                  transition-all font-medium
                "
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}

          </nav>
        </div>
      )}
    </header>
  );
}
