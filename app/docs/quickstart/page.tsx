"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Terminal, 
  ChevronRight, 
  Terminal as TerminalIcon, 
  ArrowRight,
  Clipboard,
  Key,
  Database,
  Search,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const steps = [
  { 
    title: "Create an Account", 
    desc: "Sign up via email or Google to access your dashboard.",
    detail: "On your first login, an initial API key is automatically generated for you.",
    icon: Key,
    link: "/signup"
  },
  { 
    title: "Retrieve API Key", 
    desc: "Get your secret credential from the keys dashboard.",
    detail: "Head to /dashboard/keys to copy your first rs_ key.",
    icon: ShieldCheck,
    link: "/dashboard/keys"
  },
  { 
    title: "Make First Request", 
    desc: "Use curl or any HTTP client to hit our public endpoints.",
    detail: "Start with a simple status check or player lookup.",
    icon: Search,
    link: "/docs"
  },
];

export default function QuickstartPage() {
  return (
    <div className="flex h-full bg-background border-t border-white/5 p-12 max-w-5xl mx-auto">
      <div className="space-y-16">
         <motion.header
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
         >
            <Link href="/docs" className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-2 mb-6 group transition-colors">
               ← Back to Documentation
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight glow-text leading-tight">Zero to API call <br /> in 5 minutes.</h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl italic opacity-80 border-l-2 border-primary/20 pl-6">
              "Building Fortnite applications shouldn't be complex. PathGen reduces weeks of replay infrastructure work to a single POST request."
            </p>
         </motion.header>

         {/* Step Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
               <Card key={i} className="glass-card bg-card/10 border-white/5 relative group overflow-hidden h-full flex flex-col">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <s.icon className="h-20 w-20" />
                  </div>
                  <CardHeader className="p-8">
                     <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-lg font-bold">{i + 1}</span>
                     </div>
                     <CardTitle className="text-xl font-bold tracking-tight">{s.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 flex-1">
                     <p className="text-sm font-bold text-foreground opacity-90 mb-2">{s.desc}</p>
                     <p className="text-xs text-muted-foreground leading-relaxed">{s.detail}</p>
                  </CardContent>
                  <div className="p-8 pt-0 mt-4">
                     <Button size="sm" variant="ghost" className="text-[10px] uppercase font-bold text-primary group-hover:gap-3 transition-all p-0 h-auto" asChild>
                        <Link href={s.link}>Get Started <ChevronRight className="h-3 w-3" /></Link>
                     </Button>
                  </div>
               </Card>
            ))}
         </div>

         {/* Hands-on Example */}
         <section className="space-y-6 pt-12">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-4">
               <TerminalIcon className="h-6 w-6 text-primary" />
               First Request Example
            </h2>
            <Card className="glass-card border-white/5 bg-black/50 overflow-hidden">
               <CardHeader className="bg-white/[0.03] p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">cURL CLI</div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5">
                     <Clipboard className="h-3.5 w-3.5" />
                  </Button>
               </CardHeader>
               <CardContent className="p-6">
                  <pre className="text-xs font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`curl -X POST https://api.pathgen.dev/v1/replay/parse \\
     -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     -d '{ "file_url": "https://assets.pathgen.dev/samples/replays/FN_REPLAY_S2.replay" }'`}
                  </pre>
               </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm pt-8">
               <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2"><Database className="h-4 w-4 opacity-40" /> What's happening?</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Once received, PathGen spins up a dedicated parser instance, decrypts the replay stream using modern AES-GCM logic, 
                    and extracts high-fidelity telemetry. The result is returned as a structured JSON object.
                  </p>
               </div>
               <div className="space-y-4">
                  <h4 className="font-bold flex items-center gap-2"><ArrowRight className="h-4 w-4 opacity-40 text-primary" /> Next Steps</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Check out the <Link href="/docs" className="text-primary hover:underline">Full API Reference</Link> to see 
                    all available parsing options, session triggers, and real-time data hooks.
                  </p>
               </div>
            </div>
         </section>
      </div>
    </div>
  );
}

// Support Icons not in direct lucide list
function ShieldCheck(props: any) { return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>; }
