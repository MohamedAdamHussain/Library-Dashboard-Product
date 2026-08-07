import { UserQuery, usersService } from "@/lib/services";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys-factory";

export const useUsers = (query: UserQuery = {}) =>
  useQuery({
    queryKey: queryKeys.users.list(query),
    queryFn: () => usersService.list(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useUser = (id: number, enabled = true) =>
  useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersService.get(id),
    enabled,
  });

export const useBlockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersService.block,
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
    },
  });
};

export const useUnblockUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersService.unblock,
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(userId) });
    },
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
};
