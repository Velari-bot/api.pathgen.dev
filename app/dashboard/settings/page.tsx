"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { 
  User, 
  Mail, 
  Lock, 
  ShieldAlert, 
  Trash2, 
  ChevronRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-10 pb-20 max-w-4xl">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your professional profile and security preferences.</p>
      </header>

      {/* Profile Section */}
      <section className="space-y-4">
         <h2 className="text-xl font-bold opacity-80 pl-2">Personal Information</h2>
         <Card className="glass-card bg-card/5 border-white/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold opacity-70 uppercase tracking-widest">Public Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block">Display Name</label>
                    <div className="relative">
                       <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-50" />
                       <Input placeholder="Aiden Bender" className="glass pl-10 h-11 rounded-xl border-white/5 focus:ring-primary/40" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase mb-2 block">Email Address</label>
                    <div className="relative">
                       <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-50" />
                       <Input placeholder="aiden@example.com" disabled className="glass pl-10 h-11 rounded-xl border-white/5 opacity-50 select-none" />
                    </div>
                    <p className="text-[8px] text-muted-foreground italic px-2">Managed via Firebase Auth. Contact support to change.</p>
                 </div>
                 <div className="md:col-span-2 pt-2">
                    <Button type="submit" disabled={loading} className="bg-primary rounded-xl px-10 font-bold shadow-lg shadow-primary/20">
                       {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (success ? <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Updated!</div> : "Save Adjustments")}
                    </Button>
                 </div>
              </form>
            </CardContent>
         </Card>
      </section>

      {/* Security Section */}
      <section className="space-y-4">
         <h2 className="text-xl font-bold opacity-80 pl-2">Security</h2>
         <Card className="glass-card bg-card/5 border-white/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold opacity-70 uppercase tracking-widest">Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="flex items-start gap-4">
               <div className="h-10 w-10 flex-shrink-0 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
               </div>
               <div className="flex-1">
                  <div className="text-sm font-bold tracking-tight">Enable 2FA</div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Secure your account with multi-factor authentication. Highly recommended for production environments.</p>
               </div>
               <Button variant="ghost" className="bg-white/5 rounded-xl text-xs font-bold hover:bg-white/10 uppercase tracking-widest px-6">Configure</Button>
            </CardContent>
         </Card>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4 pt-8">
         <h2 className="text-xl font-bold text-rose-500 pl-2 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Danger Zone
         </h2>
         <Card className="glass-card bg-rose-500/5 border-rose-500/20 p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
            <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-rose-500/[0.03] to-transparent pointer-events-none group-hover:w-32 transition-all" />
            <div className="space-y-2 relative z-10">
               <div className="text-lg font-bold text-rose-500 tracking-tight">Delete Account Permanently</div>
               <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                 Once you delete your account, there is no going back. All API keys will be revoked and credits will be forfeited immediately.
               </p>
            </div>
            <Button variant="ghost" className="bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl px-10 h-12 font-bold transition-all flex items-center gap-3 shrink-0 relative z-10">
               <Trash2 className="h-4 w-4" />
               Purge Account Data
            </Button>
         </Card>
      </section>

      {/* Footer Info */}
      <footer className="pt-20 text-center opacity-30 select-none">
         <div className="text-[10px] font-mono tracking-widest uppercase">Platform ID: US-WEST-2-NODE_94</div>
         <div className="text-[9px] mt-1 italic">Last active: {new Date().toLocaleString()}</div>
      </footer>
    </div>
  );
}
