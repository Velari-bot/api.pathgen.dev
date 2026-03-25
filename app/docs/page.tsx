"use client";

import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal, 
  Code, 
  ShieldCheck, 
  Search, 
  BookOpen, 
  ArrowRight,
  ChevronRight,
  Clipboard,
  Zap
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const sections = [
  { id: "intro", label: "Introduction", icon: BookOpen },
  { id: "auth", label: "Authentication", icon: ShieldCheck },
  { id: "replays", label: "Replay Parsing", icon: Zap },
  { id: "sessions", label: "Real-time Sessions", icon: Code },
  { id: "errors", label: "Error Codes", icon: Terminal },
];

export default function DocumentationPage() {
  return (
    <div className="flex h-full bg-background border-t border-white/5">
      {/* Docs Sidebar */}
      <aside className="w-64 border-r border-white/5 p-6 flex flex-col gap-8 sticky top-0 h-[calc(100vh-64px)] overflow-y-auto">
         <div className="relative group">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              placeholder="Search Docs..." 
              className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-primary/40 focus:border-primary/40 focus:outline-none transition-all"
            />
         </div>

         <nav className="flex flex-col gap-1">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">Platform Docs</div>
            {sections.map((s, i) => (
               <button key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all group ${i === 0 ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
                  <s.icon className={`h-4 w-4 ${i === 0 ? 'text-primary' : 'opacity-60'}`} />
                  {s.label}
                  <ChevronRight className={`ml-auto h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ${i === 0 ? 'opacity-100' : ''}`} />
               </button>
            ))}
         </nav>

         <div className="mt-auto pt-6">
            <Card className="glass-card bg-primary/5 border-primary/20 p-4">
               <div className="flex items-center gap-2 mb-2">
                  <Terminal className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Need Help?</span>
               </div>
               <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">Join our Discord for developer support and community discussion.</p>
               <Button variant="ghost" className="w-full h-8 text-[10px] uppercase font-bold bg-white/5 hover:bg-white/10 rounded-lg">Join Discord</Button>
            </Card>
         </div>
      </aside>

      {/* Docs Content */}
      <main className="flex-1 overflow-y-auto p-12 max-w-4xl">
         <div className="space-y-12">
            <motion.header 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
               <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4">
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/20 uppercase text-[10px] font-bold">API v1.0</Badge>
                  <span className="text-muted-foreground h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Stable Release</span>
               </div>
               <h1 className="text-4xl font-bold tracking-tight glow-text">Introduction</h1>
               <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                 Welcome to the PathGen API documentation. PathGen allows you to parse, analyze, and visualize 
                 Fortnite replays with enterprise-grade performance and accuracy.
               </p>
            </motion.header>

            <Alert className="glass-card bg-amber-500/5 border-amber-500/20">
               <Zap className="h-4 w-4 text-amber-500" />
               <AlertTitle className="text-amber-500 font-bold">Quick Start Available</AlertTitle>
               <AlertDescription className="text-xs opacity-70">
                 New to PathGen? Check out our 5-minute <Link href="/docs/quickstart" className="font-bold underline">Quickstart Guide</Link> to make your first API request.
               </AlertDescription>
            </Alert>

            {/* Content Section 1: Endpoints */}
            <section className="space-y-6">
               <h2 className="text-2xl font-bold pt-8 underline decoration-primary/30 underline-offset-8">Parsing Endpoints</h2>
               <p className="text-sm text-muted-foreground">PathGen supports parsing binary replays (.replay) and extracting every piece of telemetry from the game world.</p>
               
               <Card className="glass-card border-white/5 bg-card/10 overflow-hidden">
                  <div className="p-4 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">POST</span>
                        <code className="text-xs font-mono font-bold text-foreground opacity-90">/v1/replay/parse</code>
                     </div>
                     <Badge variant="ghost" className="text-[10px] opacity-40 uppercase font-bold tracking-widest">5 CREDITS / CALL</Badge>
                  </div>
                  <CardContent className="p-6 space-y-6">
                     <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Request Body</h4>
                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative group">
                           <button className="absolute right-4 top-4 h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Clipboard className="h-3.5 w-3.5 text-muted-foreground" />
                           </button>
                           <pre className="text-xs font-mono text-emerald-400 overflow-x-auto">
{`{
  "file": (Binary .replay),
  "options": {
    "extract_positions": true,
    "extract_kills": true,
    "include_inventory": true
  }
}`}
                           </pre>
                        </div>
                     </div>

                     <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Response Example</h4>
                        <div className="bg-black/40 rounded-xl p-4 border border-white/5 relative group">
                           <button className="absolute right-4 top-4 h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Clipboard className="h-3.5 w-3.5 text-muted-foreground" />
                           </button>
                           <pre className="text-xs font-mono text-blue-400 overflow-x-auto">
{`{
  "status": "success",
  "replay_id": "rep_a5f2...",
  "meta": {
    "match_id": "b328-912...",
    "duration_s": 1242,
    "map": "Chapter 5 S2"
  },
  "data": { ... }
}`}
                           </pre>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </section>

            {/* CTA */}
            <footer className="pt-24 pb-12">
               <div className="glass-card bg-primary/5 border-primary/20 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Ready to test it out?</h3>
                    <p className="text-xs text-muted-foreground">Jump into the API playground to explore all endpoints in real-time.</p>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 rounded-xl font-bold h-12 px-8">
                     Open API Playground <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
               </div>
            </footer>
         </div>
      </main>
    </div>
  );
}
