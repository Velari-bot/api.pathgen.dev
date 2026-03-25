"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Key, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Terminal,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaskedKey } from "@/components/masked-key";
import { CreateKeyModal } from "@/components/create-key-modal";
import { Badge } from "@/components/ui/badge";

const apiKeys = [
  { id: "rs_35402b9d...", name: "Production App", lastUsed: "2 mins ago", created: "Mar 2026", status: "active" },
  { id: "rs_a4f91c2e...", name: "Test Environment", lastUsed: "12 hrs ago", created: "Feb 2026", status: "active" },
  { id: "rs_9821d3f0...", name: "Internal Scripts", lastUsed: "Never", created: "Jan 2026", status: "revoked" },
];

export default function KeysPage() {
  return (
    <div className="space-y-8 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground mt-1">Manage secret keys used to authenticate with PathGen.</p>
        </div>
        <CreateKeyModal />
      </header>

      {/* API Key Security Alert */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card bg-primary/5 border-primary/20 p-4 flex gap-4 items-center"
      >
        <div className="h-10 w-10 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-primary">Key Security Best Practices</div>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
            Never share your secret keys or expose them in client-side code. If you suspect your key has been compromised, revoke it immediately and generate a new one.
          </p>
        </div>
        <Button variant="ghost" size="sm" className="hidden sm:flex text-[10px] text-muted-foreground uppercase tracking-widest gap-2 bg-white/5 hover:bg-white/10 rounded-lg">
           Security Docs <ExternalLink className="h-3 w-3" />
        </Button>
      </motion.div>

      {/* Keys Table Card */}
      <Card className="glass-card bg-card/5 border-white/5 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/5">
           <CardTitle className="text-sm font-bold opacity-80 uppercase tracking-widest">Active Credentials</CardTitle>
           <div className="text-[10px] font-bold text-muted-foreground">3 / 5 KEYS USED</div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground pl-6">Label</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Secret Key</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Usage</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key, i) => (
                <TableRow key={i} className="hover:bg-white/[0.02] border-white/5 transition-colors group">
                  <TableCell className="pl-6">
                    <div className="flex flex-col">
                       <span className="font-bold text-sm tracking-tight">{key.name}</span>
                       <span className="text-[10px] text-muted-foreground">Created {key.created}</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-[45%]">
                    <MaskedKey apiKey={key.id} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <span className="text-xs font-medium opacity-90">{key.lastUsed}</span>
                       <div className="flex items-center gap-1.5 mt-1">
                          <Activity className="h-2.5 w-2.5 text-primary opacity-60" />
                          <span className="text-[10px] text-muted-foreground">1,201 total calls</span>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 opacity-60 transition-all rounded-xl">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sidebar Quick-Access Resources (Hidden on small, Grid flow on large) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {[
           { icon: Terminal, label: "Interactive CLI", desc: "Interact with PathGen from your terminal windows.", color: "text-primary" },
           { icon: ShieldAlert, label: "Account Limits", desc: "View account quotas and request limits per endpoint.", color: "text-amber-400" },
           { icon: Activity, label: "Monitoring", desc: "Real-time logs for all activity using these keys.", color: "text-emerald-400" },
         ].map((r, i) => (
            <Card key={i} className="glass-card bg-white/[0.02] border-white/5 group hover:border-white/10 transition-all">
               <CardHeader className="flex flex-row items-center gap-4 py-4">
                  <div className={`h-10 w-10 flex-shrink-0 bg-white/5 rounded-xl flex items-center justify-center ${r.color}`}>
                     <r.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold opacity-90">{r.label}</CardTitle>
                    <div className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{r.desc}</div>
                  </div>
                  <ChevronRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
               </CardHeader>
            </Card>
         ))}
      </div>
    </div>
  );
}
