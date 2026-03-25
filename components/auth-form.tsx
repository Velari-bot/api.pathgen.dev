"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Mail, Lock, Loader2, Globe } from "lucide-react";
import Link from "next/link";

interface AuthFormProps {
  type: "login" | "signup";
}

export function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (type === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        // Create Firestore document with 100 credits on first signup
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || email.split('@')[0],
          credits: 100,
          created_at: new Date().toISOString(),
          setup_complete: true,
        });
        
        // Also create an entry in billing collection (optional, depends on model)
        const billingRef = doc(db, "billing", user.email!);
        await setDoc(billingRef, { balance: 100 }, { merge: true });
        
        console.log("User created with 100 free credits");
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="glass-card shadow-2xl p-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{type === "login" ? "Welcome Back" : "Join PathGen"}</CardTitle>
          <CardDescription>
            {type === "login" ? "Unlock professional Fortnite data access." : "Start building with the best replay infrastructure."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Email address"
                  type="email"
                  required
                  className="pl-10 h-11 glass border-white/5 focus:ring-primary/40 focus:border-primary/40 transition-all rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Password"
                  type="password"
                  required
                  className="pl-10 h-11 glass border-white/5 focus:ring-primary/40 focus:border-primary/40 transition-all rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}
            
            <Button className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (type === "login" ? "Sign In" : "Create Account")}
            </Button>
          </form>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background/50 backdrop-blur-sm px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Button variant="outline" className="h-11 rounded-xl glass border-white/10 hover:bg-white/5" onClick={handleGoogle} disabled={loading}>
              <Globe className="mr-2 h-4 w-4" />
              Sign in with Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground mt-4">
          <div>
            {type === "login" ? (
              <>Don&apos;t have an account? <Link href="/signup" className="text-primary hover:underline font-medium">Sign up</Link></>
            ) : (
              <>Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link></>
            )}
          </div>
          <Link href="/reset-password" className="hover:text-foreground transition-colors">Forgot password?</Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
