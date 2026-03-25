"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CreditCard, 
  Receipt, 
  ExternalLink,
  ChevronRight,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const transactions = [
  { id: "TX_154", date: "Mar 20, 2026", pack: "Pro Pack", amount: "$40.00", status: "success", credits: "+50,000" },
  { id: "TX_121", date: "Feb 12, 2026", pack: "Starter Pack", amount: "$10.00", status: "success", credits: "+10,000" },
  { id: "TX_094", date: "Jan 05, 2026", pack: "Starter Pack", amount: "$10.00", status: "failed", credits: "0" },
];

export default function BillingPage() {
  return (
    <div className="space-y-10 pb-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Credits</h1>
        <p className="text-muted-foreground mt-1">Manage your credit balance, view invoices, and buy packs.</p>
      </header>

      {/* Credit Balance Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card md:col-span-2 bg-primary/10 border-primary/20 p-8 flex items-center justify-between relative overflow-hidden group">
           <div className="absolute top-0 right-1/4 h-full w-full bg-gradient-to-r from-transparent via-primary/5 to-transparent skew-x-12 animate-in fade-in" />
           <div className="space-y-4 relative z-10">
              <div className="text-[10px] font-bold text-primary uppercase tracking-widest">Available Balance</div>
              <div className="text-5xl font-extrabold tracking-tight">54,020 <span className="text-sm font-bold text-muted-foreground uppercase opacity-50 ml-2">Credits Remaining</span></div>
              <p className="text-xs text-muted-foreground max-w-sm">Credits are used for replay parsing and telemetry streams. They never expire.</p>
           </div>
           <div className="relative z-10 hidden sm:block">
              <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold rounded-xl px-10 h-14 shadow-2xl shadow-primary/40">
                Purchase Pack
              </Button>
           </div>
        </Card>

        <Card className="glass-card bg-card/10 border-white/5 p-6 flex flex-col justify-center gap-4">
           <div className="space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Spent this month</div>
              <div className="text-2xl font-bold">12,492 <span className="text-[10px] opacity-40 uppercase ml-1">Credits</span></div>
           </div>
           <div className="h-px bg-white/5 w-full" />
           <div className="space-y-1">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg daily burn</div>
              <div className="text-2xl font-bold">410 <span className="text-[10px] opacity-40 uppercase ml-1">Credits</span></div>
           </div>
        </Card>
      </div>

      {/* Credit Packs */}
      <div className="space-y-6">
         <h2 className="text-xl font-bold opacity-80 pl-2">Available Credit Packs</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Starter", credits: "10,000", price: "$10", bonus: "0%" },
              { name: "Pro", credits: "50,000", price: "$40", bonus: "10%", popular: true },
              { name: "Elite", credits: "150,000", price: "$100", bonus: "20%" },
            ].map((p, i) => (
              <Card key={i} className={`glass-card bg-card/5 border-white/5 p-6 flex flex-col transition-all hover:border-primary/20 ${p.popular ? 'bg-primary/[0.02] border-primary/20' : ''}`}>
                 <div className="flex justify-between items-start mb-4">
                    <div className="text-lg font-bold">{p.name}</div>
                    {p.bonus !== "0%" && <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px]">{p.bonus} BONUS</Badge>}
                 </div>
                 <div className="text-3xl font-bold tracking-tight mb-1">{p.price}</div>
                 <div className="text-xs text-primary font-bold">{p.credits} Credits</div>
                 <Button className="w-full mt-6 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold" variant="outline">
                    Buy with Stripe
                 </Button>
              </Card>
            ))}
         </div>
      </div>

      {/* Transaction History */}
      <Card className="glass-card bg-card/5 border-white/5">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
           <div>
              <CardTitle className="text-sm font-bold opacity-80 uppercase tracking-widest">Invoicing & History</CardTitle>
              <div className="text-xs text-muted-foreground mt-1">Download official receipts for your records</div>
           </div>
           <Button variant="ghost" className="text-[10px] text-muted-foreground uppercase h-8 hover:bg-white/5">
              Download All <Receipt className="ml-2 h-3.5 w-3.5" />
           </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="pl-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground py-4">Transaction ID</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pack</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Credits</TableHead>
                <TableHead className="pr-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t, i) => (
                <TableRow key={i} className="hover:bg-white/[0.02] border-white/5 transition-colors group">
                  <TableCell className="pl-6 font-mono text-[11px] opacity-70 group-hover:opacity-100 transition-opacity">{t.id}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
                  <TableCell className="text-xs font-bold">{t.pack}</TableCell>
                  <TableCell className="text-xs font-bold">{t.amount}</TableCell>
                  <TableCell className="text-xs font-bold text-emerald-400">{t.credits}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 rounded-lg group-hover:scale-110 transition-transform">
                       <ExternalLink className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Support CTA */}
      <footer className="pt-12 flex flex-col items-center">
         <div className="glass-card bg-emerald-500/5 border-emerald-500/20 p-6 flex flex-col md:flex-row items-center gap-6 max-w-3xl w-full">
            <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
               <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
               <div className="font-bold text-emerald-400 text-sm mb-0.5">Payment Security</div>
               <p className="text-[10px] text-muted-foreground leading-relaxed">Payments are processed securely via Stripe. We do not store your credit card information on our servers.</p>
            </div>
            <Link href="https://stripe.com" className="opacity-40 hover:opacity-100 transition-opacity">
               <Badge variant="ghost" className="text-[10px] font-bold border-white/10">POWERED BY STRIPE</Badge>
            </Link>
         </div>
      </footer>
    </div>
  );
}
