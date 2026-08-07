import * as React from "react";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { QueryBoundary } from "@/components/data/QueryBoundary";
import {
  StatsSkeleton,
  ChartSkeleton,
} from "@/components/data/Skeletons";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ORDER_STATUS_LABELS, getOrderStatus } from "@/lib/routes";
import type { Period } from "@/schemas";
import { useSalesReport } from "@/hooks/queries/orders-hooks";
import { useAnalytics, useSalesChart } from "@/hooks/queries/dashboard-hooks";

// M4 fix: خريطة الأيام لكل period
const DAYS_PER_PERIOD: Record<Period, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  all: 365,
};

// M3 fix: ألوان الـ pie chart لكل حالة
const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: "var(--color-warning)",
  paid: "var(--color-success)",
  completed: "var(--color-chart-1)",
  failed: "var(--color-destructive)",
  refunded: "var(--color-muted-foreground)",
};

export function ReportsPage() {
  const [period, setPeriod] = React.useState<Period>("monthly");
  const reportQuery = useSalesReport(period);
  const report = reportQuery.data;

  // M4 fix: استخدم daysMap ديناميكي حسب الـ period
  const { data: chart = [] } = useSalesChart(DAYS_PER_PERIOD[period]);

  // M3 fix: استخدم endpoint analytics لبيانات الـ pie chart
  const { data: analytics } = useAnalytics();

  const periodLabels: Record<Period, string> = {
    daily: "يومي",
    weekly: "أسبوعي",
    monthly: "شهري",
    all: "كلي",
  };

  // M4 fix: البيانات تأتي معدة من الـ API لكل period
  const chartData = React.useMemo(() => chart, [chart]);

  // M3 fix: استخدم بيانات analytics الكاملة للـ pie chart
  const statusPie = React.useMemo(() => {
    if (!analytics?.orders_by_status) return [];
    return Object.entries(analytics.orders_by_status)
      .filter(([, v]) => v && v.count && v.count > 0)
      .map(([key, v]) => ({
        name: ORDER_STATUS_LABELS[key as keyof typeof ORDER_STATUS_LABELS] ?? key,
        value: v!.count!,
        color: ORDER_STATUS_COLORS[key] ?? "var(--color-chart-2)",
      }));
  }, [analytics]);

  const handleExportPDF = () => {
    // M8 fix: نستخدم window.print مع print CSS مخصص (راجع index.css)
    window.print();
  };

  return (
    <DashboardLayout title="التقارير المالية" subtitle="تحليل أداء المبيعات">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(["daily", "weekly", "monthly", "all"] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? "primary" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {periodLabels[p]}
          </Button>
        ))}
        <div className="flex-1" />
        <Button variant="outline" onClick={handleExportPDF}>
          <Download className="h-4 w-4" />
          تصدير PDF
        </Button>
      </div>

      <QueryBoundary
        query={reportQuery}
        isEmpty={!report}
        errorTitle="تعذر تحميل التقرير"
        skeleton={
          <>
            <StatsSkeleton count={4} className="mb-6 grid-cols-2 lg:grid-cols-4" />
            <Card>
              <CardContent className="p-5">
                <ChartSkeleton />
              </CardContent>
            </Card>
          </>
        }
        empty={
          <EmptyState
            icon={<BarChart3 className="h-8 w-8" />}
            title="لا توجد بيانات لهذه الفترة"
            description="اختر فترة زمنية أخرى أو انتظر تسجيل مبيعات جديدة."
          />
        }
      >
        {report && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">إجمالي المبيعات</span>
                  </div>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(report.summary.total_sales)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    خلال فترة {periodLabels[period]}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-xs">إجمالي الطلبات</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatNumber(report.summary.total_orders_count)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {report.summary.paid_orders_count} مدفوع
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs">متوسط قيمة الطلب</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(report.summary.avg_order_value)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    لكل طلب مدفوع
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-xs">الطلبات المسترجعة</span>
                  </div>
                  <p className="text-2xl font-bold text-destructive">
                    {report.summary.refunded_orders_count}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {report.summary.total_orders_count
                      ? `${((report.summary.refunded_orders_count / report.summary.total_orders_count) * 100).toFixed(1)}% من الإجمالي`
                      : "0%"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>اتجاه المبيعات</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    تطور الإيرادات والطلبات
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="-ml-2 -mr-2 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="rSales"
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
                          }}
                          formatter={(v, n) =>
                            n === "sales"
                              ? ([
                                  `$${formatNumber(Number(v))}`,
                                  "المبيعات",
                                ] as [string, string])
                              : ([
                                  `${v} طلب`,
                                  "الطلبات",
                                ] as [string, string])
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="sales"
                          stroke="var(--color-chart-1)"
                          strokeWidth={2.5}
                          fill="url(#rSales)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>توزيع حالات الطلبات</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    حسب الحالة
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="-ml-2 -mr-2 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPie}
                          cx="50%"
                          cy="45%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {statusPie.map((entry, i) => (
                            <Cell
                              key={i}
                              fill={entry.color}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            color: "var(--color-card-foreground)",
                            borderRadius: 12,
                            fontSize: 13,
                          }}
                          formatter={(v, name) =>
                            [`${v} طلب`, name as string] as [string, string]
                          }
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          formatter={(value) => (
                            <span className="text-xs text-foreground">
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>أحدث المعاملات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-muted/50">
                      <tr>
                        <th className="p-3 text-right font-semibold text-muted-foreground">
                          الطلب
                        </th>
                        <th className="p-3 text-right font-semibold text-muted-foreground">
                          المبلغ
                        </th>
                        <th className="p-3 text-center font-semibold text-muted-foreground">
                          الحالة
                        </th>
                        <th className="p-3 text-center font-semibold text-muted-foreground">
                          التاريخ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.data.slice(0, 10).map((o) => {
                        const status = getOrderStatus(o.status);
                        return (
                          <tr
                            key={o.id}
                            className="border-b border-border last:border-0"
                          >
                            <td className="p-3 font-bold text-primary">
                              #{o.id}
                            </td>
                            <td className="p-3 font-semibold">
                              {formatCurrency(o.total_price)}
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant={status.variant}>
                                {status.label}
                              </Badge>
                            </td>
                            <td className="p-3 text-center text-xs text-muted-foreground">
                              {new Date(o.created_at).toLocaleDateString(
                                "ar"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </QueryBoundary>
    </DashboardLayout>
  );
}
