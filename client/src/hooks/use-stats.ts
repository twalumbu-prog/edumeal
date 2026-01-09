import { useQuery } from "@tanstack/react-query";
import { type DashboardStats } from "@shared/schema";

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: ["/api/reports/dashboard"],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when network reconnects
    staleTime: 0, // Always consider data stale to ensure fresh updates
  });
}
