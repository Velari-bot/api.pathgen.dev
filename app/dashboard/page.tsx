"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Zap, 
  CreditCard, 
  Activity, 
  Terminal, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Map as MapIcon,
  Play
} from "lucide-react";
import { UsageChart } from "@/components/usage-chart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const recentRequests = [
  { id: "req_1", endpoint: "/v1/replay/parse", status: 200, credits: 5, date: "2 mins ago" },
  { id: "req_2", endpoint: "/v1/session/stream", status: 200, credits: 12, date: "15 mins ago" },
  { id: "req_3", endpoint: "/v1/replay/meta", status: 403, credits: 0, date: "1 hr ago" },
  { id: "req_4", endpoint: "/v1/game/ranked", status: 200, credits: 1, date: "3 hrs ago" },
  { id: "req_5", endpoint: "/v1/auth/verify", status: 200, credits: 0, date: "Yesterday" },
];

export default function DashboardOverview() {
  const { userData, loading } = useAuth();
  
  const stats = [
    { icon: CreditCard, label: "Balance", value: loading ? "..." : (userData?.credits?.toLocaleString() || "0"), sub: "Credits", color: "text-primary" },
    { icon: Activity, label: "Usage Today", value: "1,248", sub: "Requests", color: "text-accent" },
    { icon: Zap, label: "Avg Latency", value: "124ms", sub: "-12% vs last week", color: "text-emerald-400" },
    { icon: TrendingUp, label: "Efficiency", value: "99.8%", sub: "Service Uptime", color: "text-blue-400" },
  ];

  return (
    <div className="space-y-8 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your API usage and account health.</p>
        </div>
        <div className="flex gap-3">
           <Badge variant="outline" className="glass py-1 px-3 border-emerald-500/20 text-emerald-400 font-normal">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              API Online
           </Badge>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="glass-card bg-card/10 group hover:border-primary/20">
               <CardHeader className="flex flex-row items-center justify-between py-4 pb-1">
                 <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase opacity-80">{stat.label}</CardTitle>
                 <stat.icon className={`h-3 w-3 ${stat.color} opacity-70`} />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">{stat.value}</div>
                 <div className="text-[10px] text-muted-foreground mt-1 font-medium">{stat.sub}</div>
               </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Usage Chart */}
        <Card className="glass-card bg-card/5 lg:col-span-8 border-white/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
               <CardTitle className="text-sm font-bold opacity-80">Network Traffic</CardTitle>
               <div className="text-xs text-muted-foreground mt-1">Account-wide API calls per day</div>
            </div>
            <div className="flex gap-2">
               <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] hover:bg-primary/20">7 DAYS</Badge>
               <Badge variant="ghost" className="text-[10px] opacity-40 hover:opacity-100 transition-opacity">30 DAYS</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <UsageChart />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="glass-card bg-primary/5 border-primary/20 shadow-primary/5">
              <CardHeader className="pb-3">
                 <CardTitle className="text-sm font-bold text-primary">Need more credits?</CardTitle>
                 <div className="text-xs text-muted-foreground">Top up your balance instantly via Stripe.</div>
              </CardHeader>
              <CardContent>
                 <Button className="w-full bg-primary hover:bg-primary/90 text-sm font-bold shadow-lg shadow-primary/20 rounded-xl">
                   Buy Credits Pack
                 </Button>
              </CardContent>
           </Card>

           <Card className="glass-card bg-card/5 border-white/5">
              <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-bold opacity-80">Quick Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 {[
                   { icon: Terminal, label: "Get Started", sub: "Setup your first key" },
                   { icon: MapIcon, label: "Map Telemetry", sub: "View replay data samples" },
                   { icon: Play, label: "Playground", sub: "Test API calls in browser" },
                 ].map((r, i) => (
                   <button key={i} className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-white/5 group transition-colors text-left">
                      <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                         <r.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
                      </div>
                      <div>
                         <div className="text-xs font-bold">{r.label}</div>
                         <div className="text-[10px] text-muted-foreground">{r.sub}</div>
                      </div>
                      <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100" />
                   </button>
                 ))}
              </CardContent>
           </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="glass-card bg-card/5 border-white/5">
        <CardHeader className="pb-2 border-b border-white/5 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold opacity-80">Recent Request Activity</CardTitle>
          <Button variant="ghost" size="sm" className="text-[10px] text-muted-foreground uppercase h-7">
            Explore Logs <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
             <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5">
                   <TableHead className="text-[10px] uppercase font-bold text-muted-foreground w-[40%] pl-6">Endpoint</TableHead>
                   <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Status</TableHead>
                   <TableHead className="text-[10px] uppercase font-bold text-muted-foreground text-right">Credits</TableHead>
                   <TableHead className="text-[10px] uppercase font-bold text-muted-foreground text-right pr-6">Timestamp</TableHead>
                </TableRow>
             </TableHeader>
             <TableBody>
                {recentRequests.map((req, i) => (
                  <TableRow key={i} className="hover:bg-white/[0.02] border-white/5 transition-colors group">
                    <TableCell className="font-mono text-[11px] pl-6 text-foreground/90">{req.endpoint}</TableCell>
                    <TableCell>
                       <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block font-bold ${req.status === 200 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {req.status}
                       </div>
                    </TableCell>
                    <TableCell className="text-[11px] text-right font-bold tabular-nums">-{req.credits} <span className="opacity-30">C</span></TableCell>
                    <TableCell className="text-[10px] text-right text-muted-foreground pr-6 italic">{req.date}</TableCell>
                  </TableRow>
                ))}
             </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
