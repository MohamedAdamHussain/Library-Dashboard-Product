import {
  DollarSign,
  ShoppingCart,
  Users,
  BookOpen,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { QueryBoundary } from "@/components/data/QueryBoundary";
import {
  StatsSkeleton,
  ChartSkeleton,
  ListSkeleton,
} from "@/components/data/Skeletons";

import { formatCurrency, formatNumber, timeAgo, getDisplayName } from "@/lib/utils";
import { getOrderStatus } from "@/lib/routes";
import { StatCard } from "@/components/dashboard/StatCard";
import type { Order } from "@/schemas";
import { useDashboardStats, useRecentOrders, useSalesChart, useTopBooks } from "@/hooks/queries/dashboard-hooks";

export function OverviewPage() {
  const statsQuery = useDashboardStats();
  const chartQuery = useSalesChart();
  const topQuery = useTopBooks(5);
  const recentQuery = useRecentOrders(5);
  const stats = statsQuery.data;
  const chart = chartQuery.data;
  const top = topQuery.data;
  const recent = recentQuery.data;

  return (
    <DashboardLayout title="نظرة عامة" subtitle="ملخص أداء النظام">
      {/* KPIs */}
      <QueryBoundary
        query={statsQuery}
        isEmpty={!stats}
        className="mb-6"
        errorTitle="تعذر تحميل الإحصائيات"
        skeleton={<StatsSkeleton count={4} />}
        empty={
          <EmptyState
            icon={<TrendingUp className="h-8 w-8" />}
            title="لا توجد إحصائيات بعد"
            description="ستظهر مؤشرات الأداء هنا بعد تسجيل أول عملية في النظام."
          />
        }
      >
        {stats && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="إجمالي المبيعات"
              value={stats.total_sales}
              format="currency"
              icon={DollarSign}
              trend={stats.sales_growth_percent}
              trendLabel="عن الفترة السابقة"
              iconBg="bg-success/10 text-success"
            />
            <StatCard
              title="إجمالي الطلبات"
              value={stats.total_orders}
              format="number"
              icon={ShoppingCart}
              trend={stats.orders_growth_percent}
              trendLabel="عن الفترة السابقة"
              iconBg="bg-secondary-50 text-secondary-600"
            />
            <StatCard
              title="المستخدمون"
              value={stats.total_users}
              format="number"
              icon={Users}
              trend={stats.users_growth_percent}
              trendLabel="هذا الأسبوع"
              iconBg="bg-primary-50 text-primary"
            />
            <StatCard
              title="الكتب المتاحة"
              value={stats.total_books}
              format="number"
              icon={BookOpen}
              iconBg="bg-primary-50 text-primary"
            />
          </div>
        )}
      </QueryBoundary>

      {/* Charts row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales area chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>المبيعات خلال آخر 30 يوماً</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                إجمالي المبيعات اليومية بالدولار
              </p>
            </div>
            {stats && (
              <Badge variant="success">
                <TrendingUp className="h-3 w-3" />
                {stats.sales_growth_percent}%
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <div className="-ml-2 -mr-2 h-72">
              <QueryBoundary
                query={chartQuery}
                isEmpty={!chart?.length}
                wrap={false}
                className="h-full"
                errorTitle="تعذر تحميل بيانات المبيعات"
                skeleton={<ChartSkeleton height="h-full" />}
                empty={
                  <EmptyState
                    className="h-full py-0"
                    icon={<TrendingUp className="h-7 w-7" />}
                    title="لا توجد مبيعات بعد"
                    description="ستظهر منحنيات المبيعات هنا بمجرد تسجيل أول عملية شراء."
                  />
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chart ?? []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="salesGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-chart-1)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-chart-1)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize: 11,
                        fill: "var(--color-muted-foreground)",
                      }}
                      tickLine={false}
                      axisLine={false}
                      interval={4}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "var(--color-muted-foreground)",
                      }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-card-foreground)",
                        borderRadius: 12,
                        fontSize: 13,
                        boxShadow:
                          "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                      formatter={(v) =>
                        [
                          `$${formatNumber(Number(v))}`,
                          "المبيعات",
                        ] as [string, string]
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--color-chart-1)"
                      strokeWidth={2.5}
                      fill="url(#salesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </QueryBoundary>
            </div>
          </CardContent>
        </Card>

        {/* Orders bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>عدد الطلبات اليومي</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">آخر 7 أيام</p>
          </CardHeader>
          <CardContent>
            <div className="-ml-2 -mr-2 h-72">
              <QueryBoundary
                query={chartQuery}
                isEmpty={!chart?.length}
                wrap={false}
                className="h-full"
                errorTitle="تعذر تحميل بيانات الطلبات"
                skeleton={<ChartSkeleton height="h-full" />}
                empty={
                  <EmptyState
                    className="h-full py-0"
                    icon={<ShoppingCart className="h-7 w-7" />}
                    title="لا طلبات هذا الأسبوع"
                    description="سيتم تحديث الرسم البياني تلقائياً عند وصول طلبات جديدة."
                  />
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(chart ?? []).slice(-7)}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize: 11,
                        fill: "var(--color-muted-foreground)",
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: "var(--color-muted-foreground)",
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-card-foreground)",
                        borderRadius: 12,
                        fontSize: 13,
                      }}
                      formatter={(v) =>
                        [`${v} طلب`, "الطلبات"] as [string, string]
                      }
                    />
                    <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                      {(chart ?? []).slice(-7).map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            i === 6
                              ? "var(--color-chart-1)"
                              : "var(--color-chart-2)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </QueryBoundary>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top selling */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>الكتب الأكثر مبيعاً</CardTitle>
            <Link
              to="/books"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              عرض الكل <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <QueryBoundary
              query={topQuery}
              isEmpty={!top?.length}
              wrap={false}
              errorTitle="تعذر تحميل الكتب الأكثر مبيعاً"
              skeleton={<ListSkeleton rows={5} />}
              empty={
                <EmptyState
                  icon={<BookOpen className="h-7 w-7" />}
                  title="لا مبيعات للكتب بعد"
                  description="أضف كتباً وابدأ البيع لترى قائمة الأكثر مبيعاً هنا."
                  action={
                    <Link
                      to="/books"
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      إدارة الكتب
                    </Link>
                  }
                />
              }
            >
              <div className="space-y-3">
                {(top ?? []).map((book, idx) => (
                  <div
                    key={book.id}
                    className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-accent/50"
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        idx === 0
                          ? "bg-secondary-100 text-secondary-700"
                          : idx === 1
                            ? "bg-primary-50 text-primary-700"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    {book.image_url ? (
                      <img
                        src={book.image_url}
                        alt={book.title}
                        className="h-12 w-9 shrink-0 rounded-md object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-12 w-9 shrink-0 rounded-md bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {book.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {book.sales_count} مبيعة ·{" "}
                        {book.ratings_avg
                          ? `${book.ratings_avg}★`
                          : "بدون تقييم"}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-success">
                      {formatCurrency(book.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            </QueryBoundary>
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>أحدث الطلبات</CardTitle>
            <Link
              to="/orders"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              عرض الكل <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            <QueryBoundary
              query={recentQuery}
              isEmpty={!recent?.length}
              wrap={false}
              errorTitle="تعذر تحميل أحدث الطلبات"
              skeleton={<ListSkeleton rows={5} />}
              empty={
                <EmptyState
                  icon={<ShoppingCart className="h-7 w-7" />}
                  title="لا توجد طلبات"
                  description="ستظهر أحدث الطلبات هنا فور إتمام أول عملية شراء."
                />
              }
            >
              <div className="space-y-2">
                {(recent ?? []).map((order: Order) => {
                  // C3 fix: استخدم getOrderStatus مع fallback آمن
                  const status = getOrderStatus(order.status);
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-accent/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-xs font-bold text-primary">
                        #{order.id}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {order.user ? getDisplayName(order.user) : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.length ?? 0} كتاب ·{" "}
                          {timeAgo(order.created_at)}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-foreground">
                          {formatCurrency(order.total_price)}
                        </p>
                        <Badge variant={status.variant} className="mt-0.5">
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </QueryBoundary>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
