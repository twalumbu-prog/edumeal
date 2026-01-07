import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type InsertStudent, type Student } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useStudents() {
  return useQuery<Student[]>({
    queryKey: ["/api/students"],
  });
}

export function useStudent(id: number) {
  return useQuery<Student>({
    queryKey: [`/api/students/${id}`],
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertStudent) => {
      const res = await apiRequest("POST", "/api/students", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertStudent> & { id: number }) => {
      const res = await apiRequest("PUT", `/api/students/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
  });
}
