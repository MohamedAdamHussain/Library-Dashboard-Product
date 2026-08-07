import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, ShoppingCart } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/states";
import { QueryBoundary } from "@/components/data/QueryBoundary";
import { TableSkeleton } from "@/components/data/Skeletons";
import { formatCurrency, formatDate, initials, getDisplayName } from "@/lib/utils";
import { getOrderStatus } from "@/lib/routes";
import type { Order, Period } from "@/schemas";
import { useOrder, useOrders } from "@/hooks/queries/orders-hooks";
import { useEffect, useState } from "react";

export function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    Order["status"] | "all"
  >("all");
  const [periodFilter, setPeriodFilter] = useState<
    "all" | Period
  >("all");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<number | null>(null);

  const ordersQuery = useOrders({
    search: search || undefined,
    status: statusFilter,
    period: periodFilter,
    page,
    per_page: 10,
  });
  const { data } = ordersQuery;
  const { data: viewData } = useOrder(viewingId ?? 0, !!viewingId);

  // M2 fix: إعادة تعيين فورية عند تغيّر الفلاتر
  useEffect(() => {
    setPage(1);
  }, [statusFilter, periodFilter]);

  // M2 fix: debounce فقط على نص البحث
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "الطلب",
      cell: ({ row }) => (
        <span className="font-bold text-primary">#{row.original.id}</span>
      ),
    },
    {
      // C7 fix: استخدم getDisplayName بدلاً من user.username
      id: "user",
      header: "العميل",
      cell: ({ row }) => {
        const user = row.original.user;
        const name = user ? getDisplayName(user) : "—";
        return (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              {initials(name)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">
                {name}
              </p>
              <p
                className="truncate text-xs text-muted-foreground"
                dir="ltr"
              >
                {user?.email ?? "—"}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "items_count",
      header: "الكتب",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.items?.length ?? 0}
        </Badge>
      ),
    },
    {
      accessorKey: "total_price",
      header: "المبلغ",
      cell: ({ row }) => (
        <span className="font-bold">
          {formatCurrency(row.original.total_price)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        // C3 fix: استخدم getOrderStatus مع fallback آمن
        const s = getOrderStatus(row.original.status);
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      accessorKey: "created_at",
      header: "التاريخ",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.created_at, true)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setViewingId(row.original.id)}
          aria-label="عرض"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="إدارة الطلبات"
      subtitle={`${data?.total ?? 0} طلب`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="بحث برقم الطلب أو اسم المستخدم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 max-w-md flex-1 rounded-xl border border-input bg-card px-3.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as typeof statusFilter)
          }
          className="h-10 rounded-xl border border-input bg-card px-3.5 text-sm"
        >
          <option value="all">كل الحالات</option>
          <option value="paid">مدفوع</option>
          <option value="pending">قيد الانتظار</option>
          <option value="failed">فشل</option>
          <option value="refunded">مسترجع</option>
        </select>
        <select
          value={periodFilter}
          onChange={(e) =>
            setPeriodFilter(e.target.value as typeof periodFilter)
          }
          className="h-10 rounded-xl border border-input bg-card px-3.5 text-sm"
        >
          <option value="all">كل الفترات</option>
          <option value="daily">آخر 24 ساعة</option>
          <option value="weekly">آخر أسبوع</option>
          <option value="monthly">آخر شهر</option>
        </select>
      </div>

      <QueryBoundary
        query={ordersQuery}
        isEmpty={!data?.data.length}
        errorTitle="تعذر تحميل الطلبات"
        skeleton={<TableSkeleton rows={8} columns={5} />}
        empty={
          <EmptyState
            icon={<ShoppingCart className="h-8 w-8" />}
            title="لا توجد طلبات"
            description="لم يتم العثور على طلبات مطابقة للبحث أو الفلاتر الحالية"
          />
        }
      >
        <DataTable
          columns={columns}
          data={data?.data ?? []}
          pageSize={10}
          // C6 fix: server-side pagination
          serverPagination={
            data
              ? {
                  page: data.page,
                  lastPage: data.last_page,
                  total: data.total,
                  perPage: data.per_page,
                  onPageChange: (p) => setPage(p),
                }
              : undefined
          }
        />
      </QueryBoundary>

      {viewData && (
        <Dialog
          open={!!viewingId}
          onOpenChange={(v) => !v && setViewingId(null)}
        >
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>تفاصيل الطلب #{viewData.id}</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="mb-1 text-xs text-muted-foreground">
                      التاريخ
                    </p>
                    <p className="text-sm font-bold">
                      {formatDate(viewData.created_at, true)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="mb-1 text-xs text-muted-foreground">
                      المبلغ
                    </p>
                    <p className="text-sm font-bold text-success">
                      {formatCurrency(viewData.total_price)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="mb-1 text-xs text-muted-foreground">
                      العناصر
                    </p>
                    <p className="text-sm font-bold">
                      {viewData.items?.length ?? 0}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="mb-1 text-xs text-muted-foreground">
                      الحالة
                    </p>
                    <Badge variant={getOrderStatus(viewData.status).variant}>
                      {getOrderStatus(viewData.status).label}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
              {viewData.user && (
                <div>
                  <h4 className="mb-2 font-bold">العميل</h4>
                  <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                      {initials(getDisplayName(viewData.user))}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {getDisplayName(viewData.user)}
                      </p>
                      <p
                        className="text-sm text-muted-foreground"
                        dir="ltr"
                      >
                        {viewData.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <h4 className="mb-3 font-bold">الكتب المشتراة</h4>
                <div className="space-y-2">
                  {viewData.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3"
                    >
                      {item.book?.image_url ? (
                        <img
                          src={item.book.image_url}
                          alt={item.book.title}
                          className="h-12 w-9 rounded-md object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-12 w-9 rounded-md bg-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {item.book?.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.book?.authors?.map((a) => a.name).join("، ")}
                        </p>
                      </div>
                      <p className="text-sm font-bold">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {viewData.payment && (
                <div>
                  <h4 className="mb-2 font-bold">معلومات الدفع</h4>
                  <div className="space-y-2 rounded-xl border border-border p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        طريقة الدفع
                      </span>
                      <span className="font-semibold uppercase">
                        {viewData.payment.method ?? "بطاقة ائتمان"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        معرف المعاملة
                      </span>
                      <span className="font-mono text-xs" dir="ltr">
                        {viewData.payment.stripe_payment_intent_id ??
                          viewData.payment.transaction_id ??
                          "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        تاريخ الدفع
                      </span>
                      <span className="font-semibold">
                        {formatDate(viewData.payment.paid_at, true)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="font-semibold">الإجمالي</span>
                      <span className="text-base font-bold text-success">
                        {formatCurrency(viewData.payment.amount_dollars)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
