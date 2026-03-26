"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Mail, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!auth) {
        setError("Authentication not initialized");
        return;
      }
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="glass-card shadow-2xl p-4">
          <CardHeader className="text-center">
            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              {sent ? "Check your inbox for instructions." : "Enter your email to receive a reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-start gap-3">
                 <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                 <p className="text-xs leading-relaxed">If an account exists for {email}, you will receive a password reset link shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="name@company.com"
                    type="email"
                    required
                    className="pl-10 h-11 glass border-white/5 rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-xs text-rose-400 px-1">{error}</p>}
                <Button className="w-full h-11 rounded-xl font-bold bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="justify-center border-t border-white/5 mt-4 pt-6">
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
               <ArrowLeft className="h-3 w-3" /> Back to login
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
