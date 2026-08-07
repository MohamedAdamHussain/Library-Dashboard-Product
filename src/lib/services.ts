/**
 * API Services — طبقة موحّدة لكل الـ API calls
 * ───────────────────────────────────────────────────────
 *
 * إصلاحات المرحلة 2:
 *  - C5:  booksService.list يستخدم /booksSearch عند وجود فلاتر
 *  - M1:  تطبيق Zod schemas فعلياً على كل استجابة (parse بدلاً من cast)
 *  - M3:  إضافة analytics endpoint للـ dashboard
 *  - M6:  إزالة fallback IDs الوهمية في categories/authors
 */

import { z, ZodError } from "zod";
import { http, ApiException } from "@/lib/http";
import { pickBy } from "@/lib/utils";
import type {
  User,
  Category,
  Author,
  Book,
  Order,
  DashboardStats,
  SalesChartPoint,
  TopBook,
  Analytics,
  LoginCredentials,
  AuthResponse,
  Period,
  LaravelPaginated,
  Paginated,
  ForgotPasswordValues,
  VerifyOtpValues,
  ResetPasswordValues,
} from "@/schemas";
import {
  bookSchema,
  categorySchema,
  authorSchema,
  userSchema,
  orderSchema,
  dashboardStatsSchema,
  salesChartPointSchema,
  topBookSchema,
  analyticsSchema,
  authResponseSchema,
} from "@/schemas";

// ============================================================
// Helper: تطبيق schema مع تحويل ZodError → ApiException
// (M1 fix — parsing فعلي بدلاً من cast)
// ============================================================
function parseOrThrow<T>(
  schema: z.ZodType<T>,
  raw: unknown,
  label: string
): T {
  try {
    return schema.parse(raw);
  } catch (e) {
    if (e instanceof ZodError) {
      if (import.meta.env.DEV) {
        console.error(`[${label}] schema parse failed:`, e.issues, "\nRaw:", raw);
      }
      throw new ApiException(
        `Invalid ${label} data from server`,
        500,
        undefined,
        e
      );
    }
    throw e;
  }
}

/** تحويل Laravel pagination → موحّدة */
function toPaginated<T>(laravel: LaravelPaginated<T>): Paginated<T> {
  return {
    data: laravel.data,
    total: laravel.total,
    page: laravel.current_page,
    per_page: laravel.per_page,
    last_page: laravel.last_page,
  };
}

// ============================================================
// Auth Service
// ============================================================
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const raw = await http.post<unknown>("/login", credentials);
    return parseOrThrow(authResponseSchema, raw, "authResponse");
  },

  async logout(): Promise<void> {
    await http.post("/logout");
  },

  async forgotPassword(
    values: ForgotPasswordValues
  ): Promise<{ message: string }> {
    return http.post<{ message: string }>("/forgot-password", values);
  },

  async verifyResetOtp(
    values: VerifyOtpValues
  ): Promise<{ message: string }> {
    return http.post<{ message: string }>("/verify-reset-otp", values);
  },

  async resetPassword(
    values: ResetPasswordValues
  ): Promise<{ message: string }> {
    return http.post<{ message: string }>("/reset-password", values);
  },
};

// ============================================================
// Dashboard Service
// ============================================================
interface DashboardStatsApiResponse {
  success?: boolean;
  data: unknown;
}

export const dashboardService = {
  async stats(): Promise<DashboardStats> {
    const res = await http.get<DashboardStatsApiResponse>(
      "/admin/stats/overview"
    );
    return parseOrThrow(dashboardStatsSchema, res.data, "dashboardStats");
  },

  async salesChart(days = 30): Promise<SalesChartPoint[]> {
    const res = await http.get<{
      success?: boolean;
      data: unknown;
    }>("/admin/stats/sales-chart", { params: { days } });
    return parseOrThrow(
      z.array(salesChartPointSchema),
      res.data,
      "salesChart"
    );
  },

  async topBooks(limit = 5): Promise<TopBook[]> {
    const res = await http.get<{ success?: boolean; data: unknown }>(
      "/admin/stats/top-books",
      { params: { limit } }
    );
    return parseOrThrow(z.array(topBookSchema), res.data, "topBooks");
  },

  async recentOrders(limit = 5): Promise<Order[]> {
    const res = await http.get<{ success?: boolean; data: unknown }>(
      "/admin/orders/recent",
      { params: { limit } }
    );
    return parseOrThrow(z.array(orderSchema), res.data, "recentOrders");
  },

  // M3 fix: endpoint analytics جديد
  async analytics(): Promise<Analytics> {
    const res = await http.get<{ success?: boolean; data: unknown }>(
      "/admin/stats/analytics"
    );
    return parseOrThrow(analyticsSchema, res.data, "analytics");
  },
};

// ============================================================
// Books Service (C5: /booksSearch للفلاتر)
// ============================================================
export interface BookQuery {
  search?: string;
  category_id?: number;
  author_id?: number;
  language?: "arabic" | "english" | "all";
  min_price?: number;
  max_price?: number;
  page?: number;
  per_page?: number;
}

export interface BookCreateInput {
  title: string;
  isbn: string;
  description?: string;
  price: number;
  language: "arabic" | "english";
  file_type: "pdf" | "epub";
  publish_date: string;
  categoryIds: number[];
  authorIds: number[];
  image?: File;
  file?: File;
}

export interface BookUpdateInput extends Partial<BookCreateInput> {
  _method?: "PUT";
}

export const booksService = {
  async list(query: BookQuery = {}): Promise<Paginated<Book>> {
    // C5 fix: استخدم /booksSearch عند وجود أي فلاتر
    const hasFilters = Boolean(
      query.search ||
        query.category_id ||
        query.author_id ||
        query.min_price != null ||
        query.max_price != null
    );

    if (!hasFilters) {
      // بدون فلاتر: /books يقبل page و per_page فقط
      const params = pickBy({
        page: query.page ?? 1,
        per_page: query.per_page ?? 12,
      });
      const res = await http.get<LaravelPaginated<unknown>>("/books", {
        params,
      });
      // M1: parse فعلي لكل عنصر
      const parsed = {
        ...res,
        data: res.data.map((b) => parseOrThrow(bookSchema, b, "book")),
      };
      return toPaginated(parsed);
    }

    // مع فلاتر: /booksSearch مع أسماء المعاملات الصحيحة
    const params = pickBy({
      search: query.search,
      category: query.category_id, // الـ API يقبل ID أو name
      author: query.author_id, // الـ API يقبل ID أو name
      price_from: query.min_price, // الاسم الصحيح (وليس min_price)
      price_to: query.max_price, // الاسم الصحيح (وليس max_price)
      per_page: query.per_page ?? 12,
      page: query.page ?? 1, // نجرب page، إن لم يُدعم سيُتجاهل
    });
    const res = await http.get<LaravelPaginated<unknown>>("/booksSearch", {
      params,
    });
    const parsed = {
      ...res,
      data: res.data.map((b) => parseOrThrow(bookSchema, b, "book")),
    };
    return toPaginated(parsed);
  },

  async get(id: number): Promise<Book> {
    const raw = await http.get<unknown>(`/books/${id}`);
    return parseOrThrow(bookSchema, raw, "book");
  },

  async create(data: BookCreateInput): Promise<Book> {
    const fd = new FormData();
    fd.append("title", data.title);
    fd.append("isbn", data.isbn);
    fd.append("description", data.description ?? "");
    fd.append("price", String(data.price));
    fd.append("language", data.language);
    fd.append("file_type", data.file_type);
    fd.append("publish_date", data.publish_date);
    data.categoryIds.forEach((id) => fd.append("category_id[]", String(id)));
    data.authorIds.forEach((id) => fd.append("author_id[]", String(id)));
    if (data.image) fd.append("image", data.image);
    if (data.file) fd.append("file_path", data.file);
    const raw = await http.upload<unknown>("/books", fd);
    return parseOrThrow(bookSchema, raw, "book");
  },

  async update(id: number, data: BookUpdateInput): Promise<Book> {
    const fd = new FormData();
    // Laravel PUT مع multipart يتطلب _method=POST
    fd.append("_method", "PUT");
    if (data.title !== undefined) fd.append("title", data.title);
    if (data.isbn !== undefined) fd.append("isbn", data.isbn);
    if (data.description !== undefined)
      fd.append("description", data.description);
    if (data.price !== undefined) fd.append("price", String(data.price));
    if (data.language !== undefined) fd.append("language", data.language);
    if (data.file_type !== undefined) fd.append("file_type", data.file_type);
    if (data.publish_date !== undefined)
      fd.append("publish_date", data.publish_date);
    if (data.categoryIds)
      data.categoryIds.forEach((id) => fd.append("category_id[]", String(id)));
    if (data.authorIds)
      data.authorIds.forEach((id) => fd.append("author_id[]", String(id)));
    if (data.image) fd.append("image", data.image);
    if (data.file) fd.append("file_path", data.file);
    const raw = await http.upload<unknown>(`/books/${id}`, fd);
    return parseOrThrow(bookSchema, raw, "book");
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/books/${id}`);
  },
};

// ============================================================
// Categories Service (M6: إزالة fallback الوهمي)
// ============================================================
interface CategoryListResponse {
  data?: unknown[];
  success?: boolean;
}

export const categoriesService = {
  async list(): Promise<Category[]> {
    const res = await http.get<unknown[] | CategoryListResponse>("/categories");
    const arr = Array.isArray(res) ? res : res?.data ?? [];
    return arr.map((c) => parseOrThrow(categorySchema, c, "category"));
  },

  async create(data: {
    name: string;
    name_ar?: string;
  }): Promise<Category> {
    const raw = await http.post<unknown>("/categories", data);
    return parseOrThrow(categorySchema, raw, "category");
  },

  async update(id: number, data: Partial<Category>): Promise<Category> {
    const raw = await http.put<unknown>(`/categories/${id}`, data);
    return parseOrThrow(categorySchema, raw, "category");
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/categories/${id}`);
  },
};

// ============================================================
// Authors Service (M6: إزالة fallback الوهمي)
// ============================================================
interface AuthorListResponse {
  data?: unknown[];
  success?: boolean;
}

export const authorsService = {
  async list(): Promise<Author[]> {
    const res = await http.get<unknown[] | AuthorListResponse>("/authors");
    const arr = Array.isArray(res) ? res : res?.data ?? [];
    return arr.map((a) => parseOrThrow(authorSchema, a, "author"));
  },

  async create(data: { name: string; bio?: string }): Promise<Author> {
    const raw = await http.post<unknown>("/authors", data);
    return parseOrThrow(authorSchema, raw, "author");
  },

  async update(id: number, data: Partial<Author>): Promise<Author> {
    const raw = await http.put<unknown>(`/authors/${id}`, data);
    return parseOrThrow(authorSchema, raw, "author");
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/authors/${id}`);
  },
};

// ============================================================
// Users Service (Admin)
// ============================================================
export interface UserQuery {
  search?: string;
  status?: "active" | "blocked" | "all";
  page?: number;
  per_page?: number;
}

interface AdminUsersApiResponse {
  success?: boolean;
  data: unknown[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
}

export const usersService = {
  async list(query: UserQuery = {}): Promise<Paginated<User>> {
    const params = pickBy({
      search: query.search,
      status: query.status && query.status !== "all" ? query.status : undefined,
      page: query.page ?? 1,
      per_page: query.per_page ?? 10,
    });
    const res = await http.get<AdminUsersApiResponse>("/admin/users", {
      params,
    });
    return {
      data: res.data.map((u) => parseOrThrow(userSchema, u, "user")),
      total: res.total,
      page: res.page,
      per_page: res.per_page,
      last_page: res.last_page,
    };
  },

  async get(id: number): Promise<{ user: User; orders: Order[] }> {
    interface ApiResponse {
      success?: boolean;
      data: { user: unknown; orders: unknown[]; stats?: unknown };
    }
    const res = await http.get<ApiResponse>(`/admin/users/${id}`);
    return {
      user: parseOrThrow(userSchema, res.data.user, "user"),
      orders: (res.data.orders ?? []).map((o) =>
        parseOrThrow(orderSchema, o, "order")
      ),
    };
  },

  async block(id: number): Promise<User> {
    interface ApiResponse {
      success?: boolean;
      data: unknown;
      message: string;
    }
    const res = await http.patch<ApiResponse>(`/admin/users/${id}/block`);
    return parseOrThrow(userSchema, res.data, "user");
  },

  async unblock(id: number): Promise<User> {
    interface ApiResponse {
      success?: boolean;
      data: unknown;
      message: string;
    }
    const res = await http.patch<ApiResponse>(`/admin/users/${id}/unblock`);
    return parseOrThrow(userSchema, res.data, "user");
  },

  async delete(id: number): Promise<void> {
    await http.delete(`/admin/users/${id}`);
  },
};

// ============================================================
// Orders Service
// ============================================================
export interface OrderQuery {
  search?: string;
  status?: Order["status"] | "all";
  period?: Period;
  page?: number;
  per_page?: number;
}

export const ordersService = {
  /** جلب كل الطلبات (للأدمن) */
  async list(query: OrderQuery = {}): Promise<Paginated<Order>> {
    const params = pickBy({
      search: query.search,
      status: query.status && query.status !== "all" ? query.status : undefined,
      period: query.period && query.period !== "all" ? query.period : undefined,
      page: query.page ?? 1,
      per_page: query.per_page ?? 10,
    });
    const res = await http.get<LaravelPaginated<unknown>>("/admin/orders", {
      params,
    });
    const parsed = {
      ...res,
      data: res.data.map((o) => parseOrThrow(orderSchema, o, "order")),
    };
    return toPaginated(parsed);
  },

  async get(id: number): Promise<Order> {
    interface ApiResponse {
      success?: boolean;
      data: unknown;
    }
    const res = await http.get<ApiResponse>(`/admin/orders/${id}`);
    return parseOrThrow(orderSchema, res.data, "order");
  },
};

// ============================================================
// Reports Service
// ============================================================
interface SalesReportResponse {
  success?: boolean;
  report_period: string;
  summary: {
    total_sales: number;
    total_orders_count: number;
    paid_orders_count: number;
    refunded_orders_count: number;
    avg_order_value: number;
  };
  data: unknown[];
}

export const reportsService = {
  async salesReport(period: Period = "monthly"): Promise<{
    summary: SalesReportResponse["summary"];
    data: Order[];
    report_period: string;
  }> {
    const res = await http.get<SalesReportResponse>("/reports/sales", {
      params: { period },
    });
    return {
      report_period: res.report_period,
      summary: res.summary,
      data: (res.data ?? []).map((o) =>
        parseOrThrow(orderSchema, o, "order")
      ),
    };
  },
};

export { ApiException };
