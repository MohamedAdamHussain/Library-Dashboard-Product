/**
 * Schemas — مصدر واحد للحقيقة عبر Zod
 * مطابقة لـ Resources في Laravel backend
 *
 * إصلاحات المرحلة 1:
 *  - C1: price أصبح يقبل number أو string (API يُرجعه كـ string)
 *  - C2: title أصبح optional مع transform يوحّد title/book_title
 *  - C3: إضافة "completed" إلى order status enum
 *  - C4: payment schema يطابق Stripe (status: succeeded، amount_cents)
 *  - C7: username/name توحيد عبر displayName + helper
 *  - M5:  توحيد amount / amount_cents في paymentSchema
 */

import { z } from "zod";

// ============================================================
// Helper: حقل رقمي يقبل number أو string ويُرجع دائماً number
// (C1 fix — API يُرجع price كـ string مثل "25.00")
// ============================================================
const numericField = z
  .union([z.number(), z.string()])
  .transform((v, ctx) => {
    const n = typeof v === "string" ? parseFloat(v) : v;
    if (Number.isNaN(n)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid number: ${v}`,
      });
      return z.NEVER;
    }
    return n;
  });

// ============================================================
// User (C7: يقبل username أو name)
// ============================================================
export const userSchema = z
  .object({
    id: z.number(),
    username: z.string().optional(),
    name: z.string().optional(), // من /admin/users
    email: z.string().email(),
    role: z.enum(["user", "admin"]).optional(),
    profile_url: z.string().nullable().optional(),
    status: z.enum(["active", "blocked"]).optional(),
    email_verified_at: z.string().nullable().optional(),
    created_at: z.string().optional(),
    last_login_at: z.string().nullable().optional(),
    orders_count: z.number().optional(),
    total_spent: numericField.optional(),
  })
  .transform((data) => ({
    ...data,
    // توحيد اسم العرض من أي مصدر متاح
    displayName: data.username ?? data.name ?? data.email ?? "—",
  }));
export type User = z.infer<typeof userSchema>;

// ============================================================
// Category
// ============================================================
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  name_ar: z.string().nullable().optional(),
  books_count: z.number().optional(),
  created_at: z.string().optional(),
});
export type Category = z.infer<typeof categorySchema>;

// ============================================================
// Author
// ============================================================
export const authorSchema = z.object({
  id: z.number(),
  name: z.string(),
  bio: z.string().nullable().optional(),
  books_count: z.number().optional(),
  created_at: z.string().optional(),
});
export type Author = z.infer<typeof authorSchema>;

// ============================================================
// Book (C1: price numericField، C2: title optional مع transform)
// ============================================================
export const bookSchema = z
  .object({
    id: z.number(),
    // C2 fix: title أصبح optional — الـ API يُرجع book_title وليس title
    title: z.string().optional(),
    book_title: z.string().optional(),
    isbn: z.string().optional(),
    isbn_number: z.string().optional(),
    description: z.string().nullable().optional(),
    short_description: z.string().nullable().optional(),
    // C1 fix: price يقبل number أو string
    price: numericField.optional(),
    publish_date: z.string().optional(),
    image_url: z.string().nullable().optional(),
    pdf_url: z.string().nullable().optional(),
    file_path: z.string().nullable().optional(),
    language: z.enum(["arabic", "english"]).optional(),
    file_type: z.enum(["pdf", "epub"]).optional(),
    categories: z.array(categorySchema).optional().default([]),
    authors: z.array(authorSchema).optional().default([]),
    sales_count: z.number().optional(),
    revenue: z.number().optional(),
    ratings_avg: z.number().optional(),
    ratings_count: z.number().optional(),
  })
  .transform((data) => ({
    ...data,
    // توحيد: استخدم title دائماً (يأتي من book_title لو لم يوجد title)
    price: data.price ?? 0,
    publish_date: data.publish_date ?? "",
    title: data.title ?? data.book_title ?? "",
    isbn: data.isbn ?? data.isbn_number ?? "",
    description: data.description ?? data.short_description ?? "",
  }));
export type Book = z.infer<typeof bookSchema>;

// ============================================================
// Order Item
// ============================================================
export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number().optional(),
  book_id: z.number(),
  // C1 fix: price كـ numericField
  price: numericField,
  book: bookSchema.optional(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

// ============================================================
// Payment (C4 + M5: يطابق Stripe + يقبل amount و amount_cents)
// ============================================================
export const paymentSchema = z
  .object({
    id: z.number(),
    order_id: z.number().optional(),
    // C4/M5 fix: اقبل كلا الحقلين (admin: amount_cents، user: amount)
    amount: z.number().optional(),
    amount_cents: z.number().optional(),
    // C4 fix: status يطابق Stripe
    status: z.enum([
      "succeeded",
      "pending",
      "failed",
      "refunded",
      "canceled",
      // backwards-compat مع قيم قديمة محتملة
      "paid",
    ]),
    paid_at: z.string().nullable().optional(),
    method: z.string().nullable().optional(),
    stripe_payment_intent_id: z.string().nullable().optional(),
    // backwards-compat: transaction_id (قديم)
    transaction_id: z.string().nullable().optional(),
  })
  .transform((data) => ({
    ...data,
    // موحّد: amount_cents دائماً موجود
    amount_cents: data.amount_cents ?? data.amount ?? 0,
    // amount بالدولار (للعرض)
    amount_dollars: (data.amount_cents ?? data.amount ?? 0) / 100,
  }));
export type Payment = z.infer<typeof paymentSchema>;

// ============================================================
// Order (C3: إضافة completed للـ enum)
// ============================================================
export const orderSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  user: userSchema.optional(),
  // C1 fix: total_price كـ numericField
  total_price: numericField,
  // C3 fix: إضافة "completed"
  status: z.enum([
    "pending",
    "paid",
    "completed",
    "failed",
    "refunded",
  ]),
  items: z.array(orderItemSchema).optional().default([]),
  payment: paymentSchema.optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});
export type Order = z.infer<typeof orderSchema>;

// ============================================================
// Dashboard Stats
// ============================================================
export const dashboardStatsSchema = z.object({
  total_sales: numericField,
  total_orders: z.number(),
  total_users: z.number(),
  total_books: z.number(),
  new_users_today: z.number(),
  new_users_this_week: z.number(),
  new_orders_today: z.number(),
  sales_growth_percent: numericField,
  orders_growth_percent: numericField,
  users_growth_percent: numericField,
});
export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

export const salesChartPointSchema = z.object({
  date: z.string(),
  label: z.string(),
  sales: numericField,
  orders: z.number(),
});
export type SalesChartPoint = z.infer<typeof salesChartPointSchema>;

export const topBookSchema = z
  .object({
    id: z.number(),
    title: z.string().optional(),
    book_title: z.string().optional(),
    image_url: z.string().nullable().optional(),
    sales_count: z.number(),
    revenue: numericField,
    ratings_avg: z.number().optional(),
    ratings_count: z.number().optional(),
  })
  .transform((data) => ({
    ...data,
    title: data.title ?? data.book_title ?? "",
  }));
export type TopBook = z.infer<typeof topBookSchema>;

// ============================================================
// Analytics (M3 fix: schema لـ /admin/stats/analytics)
// ============================================================
const ordersByStatusEntrySchema = z
  .object({
    count: z.number().optional(),
    total: numericField.optional(),
  })
  .optional();

export const analyticsSchema = z.object({
  orders_by_status: z
    .object({
      pending: ordersByStatusEntrySchema,
      paid: ordersByStatusEntrySchema,
      completed: ordersByStatusEntrySchema,
      failed: ordersByStatusEntrySchema,
      refunded: ordersByStatusEntrySchema,
    })
    .optional(),
  average_rating: numericField.optional(),
});
export type Analytics = z.infer<typeof analyticsSchema>;

// ============================================================
// Auth Schemas
// ============================================================
export const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});
export type LoginCredentials = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp_code: z
    .string()
    .length(6, "رمز التحقق يجب أن يكون 6 أرقام")
    .regex(/^\d{6}$/, "رمز التحقق يجب أن يكون أرقاماً فقط"),
});
export type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    otp_code: z
      .string()
      .length(6, "رمز التحقق يجب أن يكون 6 أرقام")
      .regex(/^\d{6}$/, "رمز التحقق يجب أن يكون أرقاماً فقط"),
    password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
    password_confirmation: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["password_confirmation"],
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const authResponseSchema = z.object({
  message: z.string(),
  token: z.string(),
  user: userSchema,
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

// ============================================================
// Form Schemas
// ============================================================
export const bookFormSchema = z.object({
  title: z.string().min(1, "العنوان مطلوب").max(255),
  isbn: z
    .string()
    .min(1, "ISBN مطلوب")
    .regex(/^[\d-]+$/, "ISBN يجب أن يحتوي على أرقام وشرطات فقط"),
  description: z.string().optional(),
  price: z.number({ message: "السعر مطلوب" }).min(0, "السعر يجب أن يكون موجباً"),
  language: z.enum(["arabic", "english"]),
  file_type: z.enum(["pdf", "epub"]),
  publish_date: z.string().min(1, "تاريخ النشر مطلوب"),
  categoryIds: z.array(z.number()).min(1, "اختر تصنيفاً واحداً على الأقل"),
  authorIds: z.array(z.number()).min(1, "اختر مؤلفاً واحداً على الأقل"),
});
export type BookFormValues = z.infer<typeof bookFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(255),
  name_ar: z.string().optional(),
});
export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const authorFormSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(255),
  bio: z.string().optional(),
});
export type AuthorFormValues = z.infer<typeof authorFormSchema>;

// ============================================================
// API Helper Types
// ============================================================
export type LaravelPaginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
};

export type Period = "daily" | "weekly" | "monthly" | "all";
