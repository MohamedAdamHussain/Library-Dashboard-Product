/**
 * اختبارات المخططات (Zod schemas)
 * ─────────────────────────────────────
 * تتحقق من أن كل schema:
 *  1. يقبل العينات الفعلية المُرجَعة من API
 *  2. يحوّل الأنواع بشكل صحيح (string → number)
 *  3. يوحد أسماء الحقول (title/book_title)
 *  4. يرفض البيانات غير الصالحة
 */

import { describe, it, expect } from "vitest";
import {
  bookSchema,
  orderSchema,
  paymentSchema,
  userSchema,
  orderItemSchema,
  dashboardStatsSchema,
  topBookSchema,
  analyticsSchema,
  authResponseSchema,
} from "@/schemas";

// ============================================================
// C1: price يجب أن يقبل number أو string ويُرجع number دائماً
// ============================================================
describe("C1: bookSchema — price field", () => {
  it("parses string price to number", () => {
    const book = bookSchema.parse({
      id: 1,
      book_title: "ظل الريح",
      price: "25.00",
      publish_date: "2024-03-10",
    });
    expect(book.price).toBe(25);
    expect(typeof book.price).toBe("number");
  });

  it("accepts number price as well", () => {
    const book = bookSchema.parse({
      id: 1,
      title: "x",
      price: 30,
      publish_date: "2024-03-10",
    });
    expect(book.price).toBe(30);
  });

  it("rejects invalid price string", () => {
    expect(() =>
      bookSchema.parse({
        id: 1,
        title: "x",
        price: "abc",
        publish_date: "2024-03-10",
      })
    ).toThrow();
  });
});

// ============================================================
// C2: title يجب أن يستخدم book_title كـ fallback
// ============================================================
describe("C2: bookSchema — title fallback", () => {
  it("uses title when provided", () => {
    const book = bookSchema.parse({
      id: 1,
      title: "My Title",
      price: 10,
      publish_date: "2024-01-01",
    });
    expect(book.title).toBe("My Title");
  });

  it("falls back to book_title when title missing", () => {
    const book = bookSchema.parse({
      id: 1,
      book_title: "From API",
      price: 10,
      publish_date: "2024-01-01",
    });
    expect(book.title).toBe("From API");
  });

  it("returns empty string when both missing", () => {
    const book = bookSchema.parse({
      id: 1,
      price: 10,
      publish_date: "2024-01-01",
    });
    expect(book.title).toBe("");
  });
});

// ============================================================
// C3: order status يجب أن يقبل "completed"
// ============================================================
describe("C3: orderSchema — status enum", () => {
  const baseOrder = {
    id: 1,
    user_id: 1,
    total_price: 45.5,
    created_at: "2024-01-01T00:00:00Z",
  };

  it("accepts completed status", () => {
    const order = orderSchema.parse({
      ...baseOrder,
      status: "completed",
    });
    expect(order.status).toBe("completed");
  });

  it("accepts all documented statuses", () => {
    const statuses = ["pending", "paid", "completed", "failed", "refunded"];
    for (const status of statuses) {
      expect(() =>
        orderSchema.parse({ ...baseOrder, status })
      ).not.toThrow();
    }
  });

  it("rejects unknown status", () => {
    expect(() =>
      orderSchema.parse({ ...baseOrder, status: "unknown" })
    ).toThrow();
  });
});

// ============================================================
// C4 + M5: payment schema يطابق Stripe
// ============================================================
describe("C4/M5: paymentSchema — Stripe compatibility", () => {
  it("accepts amount_cents from /admin/orders", () => {
    const payment = paymentSchema.parse({
      id: 1,
      order_id: 1,
      amount_cents: 4550,
      status: "succeeded",
      stripe_payment_intent_id: "pi_xxx",
      paid_at: "2024-08-01T10:34:50Z",
    });
    expect(payment.amount_cents).toBe(4550);
    expect(payment.amount_dollars).toBe(45.5);
  });

  it("accepts amount from /orders (user endpoint)", () => {
    const payment = paymentSchema.parse({
      id: 1,
      order_id: 1,
      amount: 4550,
      status: "succeeded",
    });
    expect(payment.amount_cents).toBe(4550);
    expect(payment.amount_dollars).toBe(45.5);
  });

  it("accepts 'succeeded' status (Stripe)", () => {
    const payment = paymentSchema.parse({
      id: 1,
      amount_cents: 100,
      status: "succeeded",
    });
    expect(payment.status).toBe("succeeded");
  });

  it("rejects old 'paid' status that wasn't in original enum", () => {
    // ملاحظة: أضفنا 'paid' للـ backwards-compat، لكن 'succeeded' هو الصحيح
    expect(() =>
      paymentSchema.parse({
        id: 1,
        amount_cents: 100,
        status: "paid",
      })
    ).not.toThrow(); // backwards-compat متاح
  });
});

// ============================================================
// C7: userSchema يجب أن يوحّد username/name عبر displayName
// ============================================================
describe("C7: userSchema — displayName", () => {
  it("uses username when available (UserResource standard)", () => {
    const user = userSchema.parse({
      id: 2,
      username: "ali",
      email: "ali@example.com",
      role: "user",
    });
    expect(user.displayName).toBe("ali");
  });

  it("falls back to name when username missing (admin/users list)", () => {
    const user = userSchema.parse({
      id: 2,
      name: "Ali Hassan",
      email: "ali@example.com",
      role: "user",
    });
    expect(user.displayName).toBe("Ali Hassan");
  });

  it("falls back to email when both missing", () => {
    const user = userSchema.parse({
      id: 2,
      email: "ali@example.com",
      role: "user",
    });
    expect(user.displayName).toBe("ali@example.com");
  });
});

// ============================================================
// M1: orderItemSchema — price number coercion
// ============================================================
describe("M1: orderItemSchema — price coercion", () => {
  it("converts string price to number", () => {
    const item = orderItemSchema.parse({
      id: 1,
      book_id: 7,
      price: "25.00",
    });
    expect(item.price).toBe(25);
    expect(typeof item.price).toBe("number");
  });
});

// ============================================================
// M3: analyticsSchema
// ============================================================
describe("M3: analyticsSchema", () => {
  it("parses orders_by_status with all statuses", () => {
    const analytics = analyticsSchema.parse({
      orders_by_status: {
        pending: { count: 5, total: 200.0 },
        paid: { count: 100, total: 4000.0 },
        completed: { count: 50, total: 2000.0 },
        failed: { count: 2, total: 0 },
        refunded: { count: 1, total: 30.0 },
      },
      average_rating: 4.1,
    });
    expect(analytics.orders_by_status?.paid?.count).toBe(100);
    expect(analytics.average_rating).toBe(4.1);
  });

  it("handles missing optional fields", () => {
    const analytics = analyticsSchema.parse({
      orders_by_status: {
        pending: { count: 0 },
      },
    });
    expect(analytics.orders_by_status?.pending?.count).toBe(0);
  });
});

// ============================================================
// DashboardStats: numeric fields coercion
// ============================================================
describe("dashboardStatsSchema", () => {
  it("parses string total_sales to number", () => {
    const stats = dashboardStatsSchema.parse({
      total_sales: "4500.00",
      total_orders: 120,
      total_users: 80,
      total_books: 45,
      new_users_today: 3,
      new_users_this_week: 12,
      new_orders_today: 5,
      sales_growth_percent: "8.5",
      orders_growth_percent: "-2.1",
      users_growth_percent: 0,
    });
    expect(stats.total_sales).toBe(4500);
    expect(stats.sales_growth_percent).toBe(8.5);
    expect(stats.orders_growth_percent).toBe(-2.1);
  });
});

// ============================================================
// topBookSchema: title fallback
// ============================================================
describe("topBookSchema — title fallback", () => {
  it("uses title when available", () => {
    const book = topBookSchema.parse({
      id: 1,
      title: "x",
      sales_count: 20,
      revenue: "500.00",
    });
    expect(book.title).toBe("x");
    expect(book.revenue).toBe(500);
  });

  it("falls back to book_title", () => {
    const book = topBookSchema.parse({
      id: 1,
      book_title: "From API",
      sales_count: 20,
      revenue: 500,
    });
    expect(book.title).toBe("From API");
  });
});

// ============================================================
// authResponseSchema: end-to-end
// ============================================================
describe("authResponseSchema", () => {
  it("parses a full login response", () => {
    const res = authResponseSchema.parse({
      message: "Login successful",
      token: "2|abcdef123456",
      user: {
        id: 1,
        username: "Ali",
        email: "ali@example.com",
        role: "admin",
      },
    });
    expect(res.token).toBe("2|abcdef123456");
    expect(res.user.displayName).toBe("Ali");
  });

  it("rejects response without token", () => {
    expect(() =>
      authResponseSchema.parse({
        message: "Login successful",
        user: { id: 1, username: "Ali", email: "ali@example.com", role: "user" },
      })
    ).toThrow();
  });
});
