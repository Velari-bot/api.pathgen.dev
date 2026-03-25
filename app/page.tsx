"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Shield, Zap, BarChart3, Globe, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 w-full overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto text-center">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/10 blur-[120px] rounded-full -z-10" />
        <div className="absolute top-40 right-10 w-64 h-64 bg-accent/10 blur-[100px] rounded-full -z-10" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Next-Gen Fortnite Data Infrastructure
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 glow-text">
            Build the future of <br />
            <span className="gradient-text">Competitive Fortnite</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            PathGen provides professional-grade replay parsing, real-time player telemetry, 
            and advanced analytics for developers and teams.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="rounded-full px-8 h-12 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" asChild>
              <Link href="/signup">
                Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base glass hover:bg-glass-border" asChild>
              <Link href="/docs">
                View Documentation
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Hero Visual (Placeholder for now) */}
        <motion.div
          className="mt-20 relative px-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <div className="glass-card aspect-video max-w-5xl mx-auto flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 w-full opacity-40">
               {[...Array(12)].map((_, i) => (
                 <div key={i} className="h-32 bg-primary/5 rounded-lg border border-primary/10 animate-pulse" />
               ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-20">
               <div className="text-center">
                  <div className="text-primary text-sm font-mono mb-2">TELEMETRY_STREAM_CONNECTED</div>
                  <div className="text-4xl font-mono text-white">rs_35402b9d...</div>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-muted-foreground">Everything you need to build top-tier Fortnite applications.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Lightning Fast Parsing", 
              desc: "Extract every detail from Fortnite replays in milliseconds using our optimized WASM parser.",
              icon: Zap
            },
            { 
              title: "Bank-Grade Security", 
              desc: "Secure API key management and encrypted data transmission keep your data safe.",
              icon: Shield
            },
            { 
              title: "Deep Analytics", 
              desc: "Get insights on player movement, build patterns, and combat efficiency out of the box.",
              icon: BarChart3
            }
          ].map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="glass-card border-white/5 h-full overflow-hidden group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-white/5">
         <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Credit-Based Pricing</h2>
          <p className="text-muted-foreground">No monthly fees. Only pay for what you use.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: "Starter", credits: "10,000", price: "$10", features: ["Full API Access", "Standard Parsing", "Community Support"] },
            { name: "Pro", credits: "50,000", price: "$40", features: ["10% Bonus Credits", "Priority Processing", "Email Support"], recommended: true },
            { name: "Elite", credits: "150,000", price: "$100", features: ["20% Bonus Credits", "Dedicated Infrastructure", "Direct Developer Support"] }
          ].map((p, i) => (
            <Card key={i} className={`glass-card relative overflow-hidden ${p.recommended ? 'ring-2 ring-primary border-transparent' : 'border-white/5'}`}>
              {p.recommended && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{p.name}</CardTitle>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                  <span className="text-muted-foreground">/one-time</span>
                </div>
                <CardDescription className="mt-2 text-primary font-medium">
                  {p.credits} Credits Included
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full rounded-xl ${p.recommended ? 'bg-primary' : 'variant-outline bg-white/5 hover:bg-white/10'}`} asChild>
                   <Link href="/signup">Purchase Pack</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 px-6 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <h2 className="text-3xl font-bold mb-6">Ready to start building?</h2>
        <Button size="lg" className="rounded-full px-12 h-14 text-lg bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40" asChild>
          <Link href="/signup">Join PathGen Platform</Link>
        </Button>
        <div className="mt-12 text-sm text-muted-foreground opacity-50">
           © 2026 PathGen.dev • Built for the Fortnite Developer Community
        </div>
      </section>
    </div>
  );
}
