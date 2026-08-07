import { categoriesService } from "@/lib/services";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys-factory";

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: categoriesService.list,
    staleTime: 60_000,
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesService.create,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof categoriesService.update>[1] }) =>
      categoriesService.update(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: categoriesService.delete,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
};
