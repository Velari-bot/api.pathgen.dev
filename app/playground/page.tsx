"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Terminal, Upload, Play, Loader2, Database, Zap, FileJson } from "lucide-react";

const ENDPOINTS = [
  { id: "replay_stats", name: "Replay Stats", path: "/v1/replay/stats", method: "POST", cost: 5, type: "file" },
  { id: "replay_parse", name: "Full Parse", path: "/v1/replay/parse", method: "POST", cost: 10, type: "file" },
  { id: "player_lookup", name: "Player Lookup", path: "/v1/game/lookup", method: "GET", cost: 1, type: "query", param: "name" },
  { id: "ranked_data", name: "Ranked Info", path: "/v1/game/ranked", method: "GET", cost: 1, type: "none" },
];

export default function PlaygroundPage() {
  const [selected, setSelected] = useState(ENDPOINTS[0]);
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<Record<string, unknown> | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setResponse(null);
    try {
      // Logic would be: call api.pathgen.dev with the user's first API key
      // For demo, we simulate a response
      await new Promise(r => setTimeout(r, 1200));
      
      if (selected.type === "file" && !file) throw new Error("Please upload a .replay file");
      
      setResponse({
        status: "success",
        credits_deducted: selected.cost,
        timestamp: new Date().toISOString(),
        data: selected.id === "player_lookup" ? { name: query || "Player", level: 142, platform: "PC" } : { match_id: "b1a2c3...", players: 100, eliminations: 4 }
      });
    } catch (err: unknown) {
      setResponse({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto p-6 md:p-12">
      <header>
        <h1 className="text-4xl font-bold tracking-tight glow-text">API Playground</h1>
        <p className="text-muted-foreground mt-2">Test your integration in real-time. Calls use your active API credits.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-6">
           <Card className="glass-card bg-card/10 border-white/5">
              <CardHeader>
                 <CardTitle className="text-sm font-bold opacity-70 uppercase tracking-widest">Request Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Endpoint</label>
                    <Select onValueChange={(val: string | null) => {
                       if (val) setSelected(ENDPOINTS.find(e => e.id === val) || ENDPOINTS[0]);
                    }}>
                       <SelectTrigger className="glass border-white/5 h-11 rounded-xl">
                          <SelectValue placeholder="Select endpoint" />
                       </SelectTrigger>
                       <SelectContent className="glass border-white/5 bg-background">
                          {ENDPOINTS.map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.name} ({e.path})</SelectItem>
                          ))}
                       </SelectContent>
                    </Select>
                 </div>

                 <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Zap className="h-4 w-4 text-primary" />
                       <span className="text-xs font-bold text-primary">Cost per call</span>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-none">{selected.cost} Credits</Badge>
                 </div>

                 {selected.type === "file" && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground uppercase">Replay File</label>
                       <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-primary/40 transition-colors group cursor-pointer relative">
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                          />
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                          <div className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                             {file ? file.name : "Drag & drop .replay or click to browse"}
                          </div>
                       </div>
                    </div>
                 )}

                 {selected.type === "query" && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground uppercase">{selected.param}</label>
                       <Input 
                         placeholder={`Enter ${selected.param}...`} 
                         className="glass h-11 rounded-xl border-white/5" 
                         value={query}
                         onChange={(e) => setQuery(e.target.value)}
                       />
                    </div>
                 )}

                 <Button 
                   onClick={handleSubmit} 
                   disabled={loading}
                   className="w-full h-12 bg-primary hover:bg-primary/90 rounded-xl font-bold shadow-lg shadow-primary/20"
                 >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    Execute Request
                 </Button>
              </CardContent>
           </Card>

           <Card className="glass-card bg-emerald-500/5 border-emerald-500/10 p-4 flex gap-3">
              <Database className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                 Active credentials detected. Your user balance will be debited on success. 
                 <br /><strong>Current Balance: 54,020</strong>
              </div>
           </Card>
        </div>

        {/* Response */}
        <div className="lg:col-span-7 h-full flex flex-col">
           <Card className="glass-card bg-black/40 border-white/5 flex-1 flex flex-col min-h-[500px] overflow-hidden">
              <CardHeader className="border-b border-white/5 py-3 flex flex-row items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-xs font-bold uppercase opacity-60">Response Payload</CardTitle>
                 </div>
                 {response && !response.error && (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-400 font-bold">200 OK</Badge>
                 )}
              </CardHeader>
              <CardContent className="p-0 flex-1 relative overflow-auto font-mono text-xs">
                 {!response && !loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 flex-col gap-4">
                       <FileJson className="h-12 w-12 opacity-10" />
                       <span className="uppercase tracking-widest text-[10px] font-bold">Ready for transmission</span>
                    </div>
                 )}
                 {loading && (
                    <div className="absolute inset-0 bg-background/20 backdrop-blur-sm flex items-center justify-center z-10">
                       <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 text-primary animate-spin" />
                          <span className="text-[10px] font-bold text-primary uppercase animate-pulse">Processing...</span>
                       </div>
                    </div>
                 )}
                 {response && (
                    <pre className={`p-6 whitespace-pre-wrap leading-relaxed ${response.error ? 'text-rose-400' : 'text-emerald-400'}`}>
                       {JSON.stringify(response, null, 2)}
                    </pre>
                 )}
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
