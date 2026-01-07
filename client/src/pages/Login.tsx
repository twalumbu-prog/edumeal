import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
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

          <Button 
            size="lg" 
            className="w-full h-12 text-lg font-semibold bg-foreground hover:bg-foreground/90 text-background shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
            onClick={handleLogin}
          >
            Sign In with Replit
          </Button>

          <p className="mt-8 text-xs text-muted-foreground">
            Secure access for administrators and canteen staff only.
          </p>
        </div>
      </div>
    </div>
  );
}
