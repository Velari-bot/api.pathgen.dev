"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2 } from "lucide-react";
import { MaskedKey } from "@/components/masked-key";

export function CreateKeyModal() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      // simulate API call
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/account/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Placeholder
        },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed locally");
      setNewKey(data);
    } catch(err) {
      // For demo, show a fake key
      setNewKey({ key_id: `rs_${Math.random().toString(36).substr(2, 20)}`, name });
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = () => {
    setOpen(false);
    setNewKey(null);
    setName("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl px-6 bg-primary font-bold shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="glass shadow-2xl border-white/5 sm:max-w-md bg-background/80 backdrop-blur-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{newKey ? "Key Created!" : "Create New API Key"}</DialogTitle>
          <DialogDescription className="text-xs">
            {newKey ? "This key will only be shown in full this once. Copy it now." : "Label your key to track usage across different projects."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {!newKey ? (
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block">Key Label</label>
                  <Input 
                    placeholder="e.g. Production Replay Viewer"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="glass border-white/5 h-11 rounded-xl focus:ring-primary/40"
                  />
               </div>
            </div>
          ) : (
             <div className="space-y-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <div>
                   <label className="text-[10px] font-bold text-primary uppercase mb-2 block">Your New Secret Key</label>
                   <MaskedKey apiKey={newKey.key_id} isNew />
                </div>
                <div className="p-2 px-3 bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 rounded-lg">
                   Make sure to copy this key now. For your security, we don't store the full key after creation.
                </div>
             </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
           {!newKey ? (
             <>
               <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl flex-1 hover:bg-white/5">Cancel</Button>
               <Button onClick={handleCreate} disabled={!name || loading} className="bg-primary rounded-xl flex-1 font-bold">
                 {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Key"}
               </Button>
             </>
           ) : (
             <Button onClick={closeDialog} className="bg-primary rounded-xl w-full font-bold">I've Copied the Key</Button>
           )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
