import { useQuery } from "@tanstack/react-query";
import { type DashboardStats } from "@shared/schema";

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30s
  });
}
