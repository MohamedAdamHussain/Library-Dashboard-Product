import { dashboardService } from "@/lib/services";
import { queryKeys } from "../query-keys-factory";
import { Analytics } from "@/schemas";
import { useQuery } from "@tanstack/react-query";

export const useDashboardStats = () =>
  useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: dashboardService.stats,
    staleTime: 30_000,
  });

export const useSalesChart = (days = 30) =>
  useQuery({
    queryKey: queryKeys.dashboard.salesChart,
    queryFn: () => dashboardService.salesChart(days),
    staleTime: 60_000,
  });

export const useTopBooks = (limit = 5) =>
  useQuery({
    queryKey: queryKeys.dashboard.topBooks(limit),
    queryFn: () => dashboardService.topBooks(limit),
  });

export const useRecentOrders = (limit = 5) =>
  useQuery({
    queryKey: queryKeys.dashboard.recentOrders(limit),
    queryFn: () => dashboardService.recentOrders(limit),
  });

// M3 fix: hook لـ /admin/stats/analytics
export const useAnalytics = () =>
  useQuery<Analytics>({
    queryKey: queryKeys.dashboard.analytics,
    queryFn: () => dashboardService.analytics(),
    staleTime: 60_000,
  });
