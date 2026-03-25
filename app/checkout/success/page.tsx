"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-20 w-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
           <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight glow-text mb-4">Payment Successful!</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-10 text-lg">
          Your credit balance has been updated. You can now resume parsing and analytics in the playground.
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-12">
            <Card className="glass-card bg-card/10 p-4 text-center border-emerald-500/20">
               <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Pack Added</div>
               <div className="text-xl font-bold tracking-tight">+50,000</div>
            </Card>
            <Card className="glass-card bg-card/10 p-4 text-center border-white/5">
               <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">New Balance</div>
               <div className="text-xl font-bold tracking-tight">104,020</div>
            </Card>
        </div>

        <Link 
          href="/dashboard" 
          className={cn(buttonVariants({ size: "lg" }), "rounded-xl px-10 h-12 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20")}
        >
          Return to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </motion.div>
    </div>
  );
}
