import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  QrCode,
  FileText,
  Link2,
  LogOut,
  Menu,
  UtensilsCrossed
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Sidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/students", icon: Users, label: "Students" },
    { href: "/scanner", icon: QrCode, label: "Ticket Scanner" },
    { href: "/reports", icon: FileText, label: "Reports" },
    { href: "/integrations", icon: Link2, label: "Integrations" },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl tracking-tight">EduMeal</h1>
          <p className="text-xs text-muted-foreground">Admin Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link) => {
          const isActive = location === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                onClick={() => setOpen(false)}
              >
                <link.icon className={`w-5 h-5 ${isActive ? "" : "group-hover:scale-110 transition-transform"}`} />
                <span className="font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t pt-4">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          {user?.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={user.firstName || 'User'} className="w-8 h-8 rounded-full border border-border" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.firstName?.[0] || "A"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-md bg-background">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-6">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r bg-background/50 backdrop-blur-xl p-6">
        <NavContent />
      </div>
    </>
  );
}
