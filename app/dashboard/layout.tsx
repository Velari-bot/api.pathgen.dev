"use client";

export const dynamic = "force-dynamic";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userData } = useAuth();
  const lowBalance = userData?.credits < 500;

  return (
    <div className="flex h-screen bg-[#020202] text-foreground antialiased selection:bg-primary/20">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {lowBalance && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-amber-500 animate-in slide-in-from-top duration-500">
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <AlertTriangle className="h-4 w-4" />
                Caution: Low Credit Balance ({userData?.credits})
             </div>
             <Link href="/dashboard/credits" className="text-[10px] font-bold uppercase flex items-center gap-2 hover:underline">
                Top Up Now <ArrowRight className="h-3.5 w-3.5" />
             </Link>
          </div>
        )}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#050505] via-[#020202] to-[#050505]">
          <div className="p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
