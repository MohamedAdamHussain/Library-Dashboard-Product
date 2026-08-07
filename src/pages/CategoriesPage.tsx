import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, FolderTree, Pencil, Trash2, BookOpen } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/states";
import { QueryBoundary } from "@/components/data/QueryBoundary";
import { CardGridSkeleton } from "@/components/data/Skeletons";

import {
  categoryFormSchema,
  type CategoryFormValues,
  type Category,
} from "@/schemas";
import { formatDate } from "@/lib/utils";
import { useCategories, useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/queries/categories-hooks";

export function CategoriesPage() {
  const categoriesQuery = useCategories();
  const items = categoriesQuery.data ?? [];
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(
    null
  );

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: "", name_ar: "" },
  });

  React.useEffect(() => {
    if (dialogOpen) {
      form.reset({
        name: editing?.name ?? "",
        name_ar: editing?.name_ar ?? "",
      });
    }
  }, [dialogOpen, editing, form]);

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: values });
        toast.success("تم تحديث التصنيف");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("تم إضافة التصنيف");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الحفظ");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("تم حذف التصنيف");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الحذف");
    }
  };

  return (
    <DashboardLayout
      title="إدارة التصنيفات"
      subtitle={`${items.length} تصنيف`}
    >
      <div className="mb-5 flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          إضافة تصنيف
        </Button>
      </div>

      <QueryBoundary
        query={categoriesQuery}
        isEmpty={!items.length}
        errorTitle="تعذر تحميل التصنيفات"
        skeleton={<CardGridSkeleton count={8} height="h-32" />}
        empty={
          <EmptyState
            icon={<FolderTree className="h-8 w-8" />}
            title="لا توجد تصنيفات"
            description="ابدأ بإضافة تصنيفات لتنظيم الكتب"
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> إضافة
              </Button>
            }
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((c) => (
            <Card
              key={c.id}
              className="group transition-all duration-200 hover:border-primary-200 hover:shadow-card-hover"
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                    <FolderTree className="h-6 w-6" />
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setDialogOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="mb-1 font-bold text-foreground">
                  {c.name_ar ?? c.name}
                </h3>
                <p className="mb-3 text-xs text-muted-foreground" dir="ltr">
                  {c.name}
                </p>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <Badge variant="primary">
                    <BookOpen className="h-3 w-3" />
                    {c.books_count ?? 0} كتاب
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(c.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </QueryBoundary>

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>
              {editing ? "تعديل التصنيف" : "إضافة تصنيف جديد"}
            </DialogTitle>
          </DialogHeader>
          <form
            id="cat-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">الاسم (إنجليزي) *</Label>
              <Input
                id="name"
                placeholder="Novel"
                dir="ltr"
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs font-medium text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name_ar">الاسم (عربي)</Label>
              <Input
                id="name_ar"
                placeholder="رواية"
                {...form.register("name_ar")}
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              type="submit"
              form="cat-form"
              loading={form.formState.isSubmitting}
            >
              {editing ? "حفظ التعديلات" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      {deleteTarget && (
        <Dialog open onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>تأكيد الحذف</DialogTitle>
            </DialogHeader>
            <p className="px-5 py-4 text-sm">
              هل أنت متأكد من حذف التصنيف{" "}
              <span className="font-bold">
                "{deleteTarget.name_ar ?? deleteTarget.name}"
              </span>
              ؟ قد يؤثر على الكتب المرتبطة به.
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
                <Trash2 className="h-4 w-4" /> حذف
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
