"use client";

import { motion } from "framer-motion";
import { XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CheckoutCancelledPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="h-16 w-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
           <XCircle className="h-8 w-8 text-rose-400" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight mb-3">Payment Cancelled</h1>
        <p className="text-muted-foreground max-w-sm mx-auto mb-10">
          No charges were made to your account. If you experienced any issues, please reach out to our support team.
        </p>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link 
            href="/dashboard/billing" 
            className={cn(buttonVariants({ size: "lg" }), "rounded-xl h-12 bg-primary hover:bg-primary/90 font-bold")}
          >
            Try Again <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link 
            href="/dashboard" 
            className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl h-12 bg-white/5 hover:bg-white/10")}
          >
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
