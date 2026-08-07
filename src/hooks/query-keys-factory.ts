import {
  type BookQuery,
  type UserQuery,
  type OrderQuery,
} from "@/lib/services";
import type { Period} from "@/schemas";


export const queryKeys = {
  dashboard: {
    stats: ["dashboard", "stats"] as const,
    salesChart: ["dashboard", "sales-chart"] as const,
    topBooks: (limit: number) => ["dashboard", "top-books", limit] as const,
    recentOrders: (limit: number) =>
      ["dashboard", "recent-orders", limit] as const,
    analytics: ["dashboard", "analytics"] as const,
  },
  books: {
    all: ["books"] as const,
    list: (query: BookQuery) => ["books", "list", query] as const,
    detail: (id: number) => ["books", "detail", id] as const,
  },
  categories: { all: ["categories"] as const },
  authors: { all: ["authors"] as const },
  users: {
    all: ["users"] as const,
    list: (query: UserQuery) => ["users", "list", query] as const,
    detail: (id: number) => ["users", "detail", id] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (query: OrderQuery) => ["orders", "list", query] as const,
    detail: (id: number) => ["orders", "detail", id] as const,
  },
  reports: {
    sales: (period: Period) => ["reports", "sales", period] as const,
  },
} as const;

