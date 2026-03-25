"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Heart, Shield, Zap, ArrowRight, ArrowDown } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const packs = [
  { 
    name: "Starter", 
    credits: "10,000", 
    price: "$10", 
    desc: "Perfect for hobbyists and side projects.",
    features: ["All API endpoints", "Standard parsing", "Shared infrastructure", "Community support"],
    id: "pack_starter"
  },
  { 
    name: "Pro", 
    credits: "50,000", 
    price: "$40", 
    desc: "For serious developers and competitive teams.",
    features: ["10% bonus credits", "Priority processing", "Dedicated support", "Early access features"],
    id: "pack_pro",
    popular: true
  },
  { 
    name: "Elite", 
    credits: "150,000", 
    price: "$100", 
    desc: "Enterprise-grade data infrastructure.",
    features: ["20% bonus credits", "99.9% uptime SLA", "Dedicated infrastructure", "Webhook support"],
    id: "pack_elite"
  }
];

const costs = [
  { endpoint: "/v1/replay/parse", desc: "Full binary parsing", cost: 5 },
  { endpoint: "/v1/replay/meta", desc: "Meta-only extraction", cost: 1 },
  { endpoint: "/v1/session/stream", desc: "Live session hook", cost: 12 },
  { endpoint: "/v1/game/ranked", desc: "Ranked data lookup", cost: 1 },
  { endpoint: "/v1/auth/verify", desc: "Key verification", cost: 0 },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero */}
      <section className="pt-24 pb-12 px-6 text-center max-w-5xl mx-auto space-y-6">
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
        >
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-4 px-4 py-1 h-auto text-xs font-bold uppercase tracking-widest">Pricing Strategy</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight glow-text">Pay only for what you parse.</h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto italic">"No monthly subscriptions. Just simple, transparent credits that never expire."</p>
        </motion.div>
        <ArrowDown className="mx-auto h-6 w-6 text-primary animate-bounce opacity-40 mt-8" />
      </section>

      {/* Credit Packs */}
      <section className="px-6 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto py-12">
        {packs.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
             <Card className={`glass-card relative h-full flex flex-col group ${p.popular ? 'border-primary ring-1 ring-primary/20 bg-primary/[0.03]' : 'border-white/5 bg-card/10'}`}>
                {p.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                )}
                <CardHeader className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                       {p.name === "Elite" ? <Shield className="h-5 w-5" /> : (p.name === "Pro" ? <Zap className="h-5 w-5" /> : <Heart className="h-5 w-5" />)}
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">{p.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs leading-relaxed min-h-[40px]">{p.desc}</CardDescription>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-5xl font-bold tracking-tight">{p.price}</span>
                    <span className="text-muted-foreground font-medium">/One-time</span>
                  </div>
                  <div className="mt-2 text-primary text-sm font-bold">{p.credits} Credits</div>
                </CardHeader>
                <CardContent className="px-8 pb-8 flex-1">
                   <ul className="space-y-4">
                      {p.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-3 text-sm text-foreground/80">
                           <CheckCircle2 className="h-4 w-4 text-primary opacity-60 shrink-0" />
                           {f}
                        </li>
                      ))}
                   </ul>
                </CardContent>
                <CardFooter className="p-8 pt-0">
                   <Button className={`w-full h-12 rounded-xl font-bold shadow-lg transition-all ${p.popular ? 'bg-primary shadow-primary/20' : 'bg-white/5 variant-outline hover:bg-white/10'}`} asChild>
                      <Link href="/signup">Purchase {p.name} Pack</Link>
                   </Button>
                </CardFooter>
             </Card>
          </motion.div>
        ))}
      </section>

      {/* Endpoint Table */}
      <section className="px-6 py-24 max-w-4xl mx-auto space-y-12">
         <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Endpoint Cost Breakdown</h2>
            <p className="text-muted-foreground mt-2">Credits are deducted per successful API call.</p>
         </div>

         <Card className="glass-card bg-card/10 border-white/5 overflow-hidden">
            <Table>
               <TableHeader>
                  <TableRow className="hover:bg-transparent border-white/5 bg-white/[0.02]">
                    <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-4">API Endpoint</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Description</TableHead>
                    <TableHead className="pr-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Cost</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {costs.map((c, i) => (
                    <TableRow key={i} className="hover:bg-white/[0.02] border-white/5 transition-colors group">
                       <TableCell className="pl-6 py-4 font-mono text-[11px] opacity-80">{c.endpoint}</TableCell>
                       <TableCell className="text-xs text-muted-foreground">{c.desc}</TableCell>
                       <TableCell className="pr-6 text-right font-bold text-sm text-primary tabular-nums">
                         {c.cost} <span className="text-[10px] font-normal text-muted-foreground opacity-50 uppercase ml-1 tracking-tighter">Credits</span>
                       </TableCell>
                    </TableRow>
                  ))}
               </TableBody>
            </Table>
         </Card>

         <div className="text-center p-8 glass bg-emerald-500/5 border-emerald-500/20 rounded-3xl">
            <div className="font-bold text-emerald-400 text-sm mb-1 uppercase tracking-widest">Enterprise volume?</div>
            <p className="text-xs text-muted-foreground mb-4">Parsing over 1M replays? We offer custom volume discounts for teams and platforms.</p>
            <Button variant="outline" className="h-10 rounded-xl px-8 border-emerald-500/20 hover:bg-emerald-500/10 text-emerald-400 font-bold">Contact Sales Support</Button>
         </div>
      </section>
    </div>
  );
}
