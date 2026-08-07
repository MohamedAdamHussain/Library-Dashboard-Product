import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys-factory";
import { authorsService } from "@/lib/services";

export const useAuthors = () =>
  useQuery({
    queryKey: queryKeys.authors.all,
    queryFn: authorsService.list,
    staleTime: 60_000,
  });

export const useCreateAuthor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authorsService.create,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.authors.all }),
  });
};

export const useUpdateAuthor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof authorsService.update>[1] }) =>
      authorsService.update(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.authors.all }),
  });
};

export const useDeleteAuthor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authorsService.delete,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.authors.all }),
  });
};
