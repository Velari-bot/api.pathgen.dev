import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background via-black to-background h-screen">
      <AuthForm type="signup" />
    </div>
  );
}
