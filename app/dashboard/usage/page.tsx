"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, 
  PieChart, 
  Activity, 
  Terminal, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Database,
  Search,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { UsageChart } from "@/components/usage-chart";
import { Badge } from "@/components/ui/badge";

const usageByEndpoint = [
  { endpoint: "/v1/replay/parse", calls: 12402, credits: 62010, pct: 60 },
  { endpoint: "/v1/session/stream", calls: 2101, credits: 25212, pct: 24 },
  { endpoint: "/v1/replay/meta", calls: 842, credits: 842, pct: 8 },
  { endpoint: "/v1/game/ranked", calls: 104, credits: 104, pct: 4 },
  { endpoint: "/v1/auth/verify", calls: 41, credits: 0, pct: 4 },
];

export default function UsagePage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Usage Deep Dive</h1>
        <p className="text-muted-foreground mt-1">Analyze your API request volume and credit consumption patterns.</p>
      </header>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Requests (30d)", value: "542,021", color: "text-primary" },
          { label: "Credits Consumed", value: "1,240,291", color: "text-accent" },
          { label: "Peak RPS", value: "42.5", color: "text-emerald-400" },
        ].map((s, i) => (
          <Card key={i} className="glass-card bg-card/10 border-white/5 p-6 flex flex-col justify-center gap-2 group hover:border-primary/20 transition-all">
             <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-80 tracking-widest">{s.label}</div>
             <div className={`text-3xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
             <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-4 group-hover:bg-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "65%" }}
                  className="h-full bg-primary/40 group-hover:bg-primary transition-all" 
                />
             </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Usage Chart */}
        <Card className="glass-card bg-card/5 border-white/5 lg:col-span-8 overflow-hidden h-fit">
           <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
              <div>
                 <CardTitle className="text-sm font-bold opacity-80 uppercase tracking-widest">Request Volume</CardTitle>
                 <div className="text-xs text-muted-foreground mt-1">Detailed requests per day (UTC)</div>
              </div>
              <div className="flex gap-2">
                 <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">CURRENT WEEK</Badge>
              </div>
           </CardHeader>
           <CardContent className="pt-8 bg-black/20">
              <UsageChart />
           </CardContent>
        </Card>

        {/* Breakdown Card */}
        <Card className="glass-card bg-card/5 border-white/5 lg:col-span-4 h-fit">
           <CardHeader className="border-b border-white/5 pb-4">
              <CardTitle className="text-sm font-bold opacity-80 uppercase tracking-widest">Resource Split</CardTitle>
              <div className="text-xs text-muted-foreground mt-1">Usage distribution by component</div>
           </CardHeader>
           <CardContent className="pt-6 space-y-6">
              {usageByEndpoint.slice(0, 4).map((e, i) => (
                <div key={i} className="space-y-2">
                   <div className="flex justify-between text-xs font-bold font-mono opacity-80">
                      <span>{e.endpoint}</span>
                      <span className="text-primary">{e.pct}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${e.pct}%` }}
                        className="h-full bg-primary/60" 
                      />
                   </div>
                   <div className="flex justify-between text-[10px] text-muted-foreground italic">
                      <span>{e.calls.toLocaleString()} calls</span>
                      <span>{e.credits.toLocaleString()} Cr</span>
                   </div>
                </div>
              ))}
           </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="glass-card bg-card/5 border-white/5 mt-10">
         <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
            <CardTitle className="text-sm font-bold opacity-80 uppercase tracking-widest">Endpoint Analytics</CardTitle>
            <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase opacity-40">30 Day Window</Badge>
         </CardHeader>
         <CardContent className="p-0">
           <Table>
             <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5 bg-white/[0.02]">
                   <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-4">API Endpoint</TableHead>
                   <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Successful Calls</TableHead>
                   <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Credits</TableHead>
                   <TableHead className="pr-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Error Rate</TableHead>
                </TableRow>
             </TableHeader>
             <TableBody>
                {usageByEndpoint.map((u, i) => (
                  <TableRow key={i} className="hover:bg-white/[0.02] border-white/5 transition-colors group">
                     <TableCell className="pl-6 py-4 font-mono text-[11px] opacity-80 group-hover:text-primary transition-colors">{u.endpoint}</TableCell>
                     <TableCell className="text-xs font-bold">{u.calls.toLocaleString()}</TableCell>
                     <TableCell className="text-xs font-bold text-emerald-400">{u.credits.toLocaleString()} Cr</TableCell>
                     <TableCell className="pr-6 text-right font-mono text-rose-500/60 text-xs">
                       {(Math.random() * 0.5).toFixed(2)}%
                     </TableCell>
                  </TableRow>
                ))}
             </TableBody>
           </Table>
         </CardContent>
      </Card>
    </div>
  );
}
