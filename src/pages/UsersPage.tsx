import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  Users as UsersIcon,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/states";
import { QueryBoundary } from "@/components/data/QueryBoundary";
import { TableSkeleton } from "@/components/data/Skeletons";

import { formatCurrency, formatDate, initials, timeAgo, getDisplayName } from "@/lib/utils";
import type { User } from "@/schemas";
import { useBlockUser, useDeleteUser, useUnblockUser, useUser, useUsers } from "@/hooks/queries/users-hooks";
import { useEffect, useState } from "react";

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "blocked"
  >("all");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(
    null
  );

  const usersQuery = useUsers({
    search: search || undefined,
    status: statusFilter,
    page,
    per_page: 10,
  });
  const { data } = usersQuery;
  const { data: viewData } = useUser(viewingId ?? 0, !!viewingId);
  const blockMutation = useBlockUser();
  const unblockMutation = useUnblockUser();
  const deleteMutation = useDeleteUser();

  // M2 fix: إعادة تعيين فورية عند تغيّر statusFilter
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // M2 fix: debounce فقط على نص البحث
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const handleToggleBlock = async (user: User) => {
    try {
      if (user.status === "blocked") {
        await unblockMutation.mutateAsync(user.id);
        toast.success("تم إلغاء الحظر");
      } else {
        await blockMutation.mutateAsync(user.id);
        toast.success("تم حظر المستخدم");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("تم حذف المستخدم");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل");
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      // C7 fix: استخدم getDisplayName بدلاً من username المفقود
      id: "displayName",
      header: "المستخدم",
      cell: ({ row }) => {
        const name = getDisplayName(row.original);
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
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
                {row.original.email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "orders_count",
      header: "الطلبات",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.orders_count ?? 0}
        </Badge>
      ),
    },
    {
      accessorKey: "total_spent",
      header: "الإنفاق",
      cell: ({ row }) => (
        <span className="font-semibold text-success">
          {formatCurrency(row.original.total_spent ?? 0)}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "active" ? "success" : "destructive"
          }
        >
          {row.original.status === "active" ? "نشط" : "محظور"}
        </Badge>
      ),
    },
    {
      accessorKey: "created_at",
      header: "التسجيل",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {timeAgo(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setViewingId(row.original.id)}
            aria-label="عرض"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleToggleBlock(row.original)}
            className={
              row.original.status === "blocked"
                ? "text-success hover:text-success"
                : "text-warning hover:text-warning"
            }
            aria-label="حظر/إلغاء حظر"
          >
            {row.original.status === "blocked" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setDeleteTarget(row.original)}
            className="text-destructive hover:text-destructive"
            aria-label="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="إدارة المستخدمين"
      subtitle={`${data?.total ?? 0} مستخدم`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input
          placeholder="بحث بالاسم أو البريد..."
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
          <option value="active">نشط</option>
          <option value="blocked">محظور</option>
        </select>
      </div>

      <QueryBoundary
        query={usersQuery}
        isEmpty={!data?.data.length}
        errorTitle="تعذر تحميل المستخدمين"
        skeleton={<TableSkeleton rows={8} columns={5} />}
        empty={
          <EmptyState
            icon={<UsersIcon className="h-8 w-8" />}
            title="لا يوجد مستخدمون"
            description="لم يتم العثور على مستخدمين مطابقين للبحث أو الفلاتر الحالية"
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

      {/* View user */}
      {viewData && (
        <Dialog
          open={!!viewingId}
          onOpenChange={(v) => !v && setViewingId(null)}
        >
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>ملف المستخدم</DialogTitle>
            </DialogHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
                  {initials(getDisplayName(viewData.user))}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {getDisplayName(viewData.user)}
                  </h3>
                  <p
                    className="text-sm text-muted-foreground"
                    dir="ltr"
                  >
                    {viewData.user.email}
                  </p>
                  <Badge
                    variant={
                      viewData.user.status === "active"
                        ? "success"
                        : "destructive"
                    }
                    className="mt-1"
                  >
                    {viewData.user.status === "active" ? "نشط" : "محظور"}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                      <ShoppingCart className="h-4 w-4" />
                      <span className="text-xs">الطلبات</span>
                    </div>
                    <p className="text-xl font-bold">
                      {viewData.orders.length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-xs">الإنفاق</span>
                    </div>
                    <p className="text-xl font-bold text-success">
                      {formatCurrency(
                        viewData.orders.reduce(
                          (s, o) => s + o.total_price,
                          0
                        )
                      )}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="mb-1 text-xs text-muted-foreground">
                      تاريخ التسجيل
                    </p>
                    <p className="text-sm font-bold">
                      {formatDate(viewData.user.created_at)}
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div>
                <h4 className="mb-3 font-bold">سجل الطلبات</h4>
                {viewData.orders.length === 0 ? (
                  <EmptyState
                    title="لا توجد طلبات"
                    description="هذا المستخدم لم يقم بأي طلبات بعد"
                  />
                ) : (
                  <div className="max-h-72 space-y-2 overflow-y-auto scrollbar-thin">
                    {viewData.orders.map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between rounded-xl border border-border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-primary">
                            #{o.id}
                          </span>
                          <div>
                            <p className="text-sm font-semibold">
                              {o.items?.length ?? 0} كتاب
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(o.created_at, true)}
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold">
                            {formatCurrency(o.total_price)}
                          </p>
                          <Badge
                            variant={
                              o.status === "paid"
                                ? "success"
                                : o.status === "pending"
                                  ? "warning"
                                  : "destructive"
                            }
                          >
                            {o.status === "paid"
                              ? "مدفوع"
                              : o.status === "pending"
                                ? "معلق"
                                : o.status === "failed"
                                  ? "فشل"
                                  : "مسترجع"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {deleteTarget && (
        <Dialog open onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>حذف المستخدم</DialogTitle>
            </DialogHeader>
            <p className="px-5 py-4 text-sm">
              هل أنت متأكد من حذف{" "}
              <span className="font-bold">
                "{getDisplayName(deleteTarget)}"
              </span>
              ؟ سيتم الاحتفاظ بسجل مشترياته لأغراض التدقيق.
            </p>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setDeleteTarget(null)}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                loading={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" /> حذف نهائي
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
