import { OrderQuery, ordersService, reportsService } from "@/lib/services";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "../query-keys-factory";
import { Period } from "@/schemas";

export const useOrders = (query: OrderQuery = {}) =>
  useQuery({
    queryKey: queryKeys.orders.list(query),
    queryFn: () => ordersService.list(query),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

export const useOrder = (id: number, enabled = true) =>
  useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersService.get(id),
    enabled,
  });

// ============================================================
// Reports Hooks
// ============================================================
export const useSalesReport = (period: Period = "monthly") =>
  useQuery({
    queryKey: queryKeys.reports.sales(period),
    queryFn: () => reportsService.salesReport(period),
    staleTime: 60_000,
  });
