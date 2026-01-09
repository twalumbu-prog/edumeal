import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({ title: "Signed in", description: "Redirecting..." });
    } catch (error: any) {
      toast({ title: "Login failed", description: error.message || "Invalid credentials", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Abstract Background Shapes */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl opacity-50" />

      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-card/50 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 md:p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20 rotate-3 transform hover:rotate-6 transition-all duration-300">
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </div>

          <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-3">
            EduMeal
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Canteen Meal Verification System
          </p>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              size="lg" 
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-semibold bg-foreground hover:bg-foreground/90 text-background shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-8 text-xs text-muted-foreground">
            Secure access for administrators and canteen staff only.
          </p>
        </div>
      </div>
    </div>
  );
}
