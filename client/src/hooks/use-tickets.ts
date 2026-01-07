import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type ScanTicketRequest, type ScanResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useScanTicket() {
  return useMutation({
    mutationFn: async (data: ScanTicketRequest): Promise<ScanResponse> => {
      const res = await apiRequest("POST", "/api/tickets/scan", data);
      return res.json();
    },
  });
}

export function useManualOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { studentId: number; reason: string }) => {
      const res = await apiRequest("POST", "/api/tickets/override", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}
