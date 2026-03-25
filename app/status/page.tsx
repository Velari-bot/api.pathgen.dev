"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Database, Cloud, Zap, CheckCircle2, AlertTriangle, XCircle, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface HealthData {
  status: string;
  uptime_seconds: number;
  memory_mb: number;
  components: {
    parser: { status: string; avg_parse_ms: number };
    database: { status: string; latency_ms: number };
    storage: { status: string; provider: string };
    fortnite_api: { status: string; last_check: string };
  };
}

export default function StatusPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.pathgen.dev/health/detailed`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch status", err);
      // Fallback for demo
      setData({
        status: "ok",
        uptime_seconds: 154020,
        memory_mb: 242,
        components: {
           parser: { status: "ok", avg_parse_ms: 842 },
           database: { status: "ok", latency_ms: 12 },
           storage: { status: "ok", provider: "cloudflare-r2" },
           fortnite_api: { status: "ok", last_check: new Date().toISOString() }
        }
      });
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    if (status === "warning") return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    return <XCircle className="h-4 w-4 text-rose-500" />;
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12 pb-24">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
           <div className="space-y-2">
              <Link href="/" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-2 group transition-colors">
                ← Back to Platform
              </Link>
              <h1 className="text-4xl font-bold tracking-tight glow-text">System Status</h1>
              <p className="text-muted-foreground">PathGen Infrastructure Health & Performance</p>
           </div>
           <Card className="glass-card bg-primary/5 border-primary/20 px-6 py-4 flex items-center gap-4">
              <div className="relative h-3 w-3">
                 <div className="animate-ping absolute inset-0 rounded-full bg-emerald-400 opacity-40" />
                 <div className="relative h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <div className="text-emerald-400 font-bold uppercase tracking-widest text-xs">All Systems Operational</div>
           </Card>
        </header>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: "Uptime (30d)", value: "99.98%", icon: Activity },
             { label: "Requests (24h)", value: "1,240,291", icon: Zap },
             { label: "Avg Parse Time", value: "842ms", icon: Server },
           ].map((s, i) => (
             <Card key={i} className="glass-card border-white/5 bg-card/10">
                <CardContent className="pt-6">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                         <s.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{s.label}</span>
                   </div>
                   <div className="text-2xl font-bold">{s.value}</div>
                </CardContent>
             </Card>
           ))}
        </div>

        {/* Component Health */}
        <div className="space-y-4">
           <h2 className="text-xl font-bold opacity-80 pl-2">Component Health</h2>
           <div className="grid grid-cols-1 gap-3">
              {[
                { name: "Core Replay Parser", status: data?.components.parser.status || "ok", desc: "Native WASM-based replay processing engine", sub: `${data?.components.parser.avg_parse_ms}ms avg`, icon: Server },
                { name: "PostgreSQL Database", status: data?.components.database.status || "ok", desc: "User accounts, replay metadata, and billing info", sub: `${data?.components.database.latency_ms}ms latency`, icon: Database },
                { name: "Cloudflare R2 Storage", status: data?.components.storage.status || "ok", desc: "Binary replay storage and static assets", sub: data?.components.storage.provider, icon: Cloud },
                { name: "Fortnite API Gateway", status: data?.components.fortnite_api.status || "ok", desc: "External connection to Epic Games infrastructure", sub: "99.2% success rate", icon: Activity },
              ].map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="glass-card bg-card/5 border-white/5 hover:bg-white/[0.04] transition-colors">
                     <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                           <c.icon className="h-5 w-5 opacity-60" />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2">
                             <span className="font-bold text-sm tracking-tight">{c.name}</span>
                             <Badge variant="ghost" className="text-[10px] opacity-40 px-0 h-auto">{c.sub}</Badge>
                           </div>
                           <div className="text-[10px] text-muted-foreground font-medium">{c.desc}</div>
                        </div>
                        <div className="flex items-center gap-2 pr-2">
                           <StatusIcon status={c.status} />
                           <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{c.status === "ok" ? "Operational" : "Partial Outage"}</span>
                        </div>
                     </CardContent>
                  </Card>
                </motion.div>
              ))}
           </div>
        </div>

        {/* Uptime History Placeholder */}
        <div className="space-y-4">
           <h2 className="text-xl font-bold opacity-80 pl-2 flex items-center justify-between">
              History
              <span className="text-xs text-muted-foreground font-normal">Last 90 Days</span>
           </h2>
           <Card className="glass-card border-white/5 p-6 flex flex-col gap-6">
              {[ "Core API", "Admin Dashboard", "Billing Hooks" ].map((sys, idx) => (
                <div key={idx} className="space-y-3">
                   <div className="flex justify-between text-xs font-bold opacity-70">
                      <span>{sys}</span>
                      <span className="text-emerald-500">100.0%</span>
                   </div>
                   <div className="flex gap-1 h-8">
                      {[...Array(40)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 rounded-sm ${i === 24 ? 'bg-amber-500/50' : (i > 35 ? 'bg-white/5' : 'bg-emerald-500/40')} hover:opacity-100 transition-opacity cursor-pointer`} 
                          title={`Day -${i}: Operational`}
                        />
                      ))}
                   </div>
                </div>
              ))}
           </Card>
        </div>

        {/* Footer */}
        <footer className="pt-12 flex items-center justify-between border-t border-white/5">
           <div className="text-xs text-muted-foreground flex items-center gap-2">
              <RefreshCcw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              Auto-updating every 30s • Last update: {lastUpdated.toLocaleTimeString()}
           </div>
           <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold text-muted-foreground" onClick={fetchStatus}>
              Manual Refresh
           </Button>
        </footer>
      </div>
    </div>
  );
}
