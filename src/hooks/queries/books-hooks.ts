import { BookCreateInput, BookQuery, booksService, BookUpdateInput } from "@/lib/services";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys-factory";

export const useBooks = (query: BookQuery = {}) =>
  useQuery({
    queryKey: queryKeys.books.list(query),
    queryFn: () => booksService.list(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useBook = (id: number, enabled = true) =>
  useQuery({
    queryKey: queryKeys.books.detail(id),
    queryFn: () => booksService.get(id),
    enabled,
  });

export const useCreateBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: BookCreateInput) => booksService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.books.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
};

export const useUpdateBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: BookUpdateInput }) =>
      booksService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.books.detail(id) });
      qc.invalidateQueries({ queryKey: queryKeys.books.all });
    },
  });
};

export const useDeleteBook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: booksService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.books.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
};
