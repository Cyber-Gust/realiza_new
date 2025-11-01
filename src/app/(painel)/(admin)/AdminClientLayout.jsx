"use client";

import { useState } from "react";
import clsx from "clsx";
import { Sidebar } from "@/components/admin/layout/Sidebar";
import { Header } from "@/components/admin/layout/Header";
import { Footer } from "@/components/admin/layout/Footer";
import { ToastProvider } from "@/components/ui/use-toast";

export default function AdminClientLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <ToastProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

        <div
          className={clsx(
            "flex flex-1 flex-col transition-all duration-300 ease-in-out",
            isCollapsed ? "pl-20" : "pl-64"
          )}
        >
          <Header />
          <main className="flex-1 overflow-y-auto bg-panel-bg p-6">
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </ToastProvider>
  );
}
