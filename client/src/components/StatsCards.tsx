import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Users, Ticket, CheckCircle2 } from "lucide-react";
import { type DashboardStats } from "@shared/schema";
import { motion } from "framer-motion";

interface StatsCardsProps {
  stats?: DashboardStats;
  loading: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const items = [
    {
      title: "Meals Served Today",
      value: stats?.mealsServedToday || 0,
      icon: Utensils,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      desc: "Total scans today"
    },
    {
      title: "Eligible Students",
      value: stats?.eligibleStudents || 0,
      icon: Users,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      desc: "With active accounts"
    },
    {
      title: "Active Subscriptions",
      value: stats?.activeSubscriptions || 0,
      icon: Ticket,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      desc: "Currently valid plans"
    },
    {
      title: "Verification Rate",
      value: stats?.mealsServedToday && stats.mealsServedToday > 0 ? "100%" : "---",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      desc: "Successful scans"
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover-card border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${item.bg}`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
