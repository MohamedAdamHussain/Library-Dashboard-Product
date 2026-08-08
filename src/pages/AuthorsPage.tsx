import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, PenTool, Pencil, Trash2, BookOpen } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  authorFormSchema,
  type AuthorFormValues,
  type Author,
} from "@/schemas";
import { initials } from "@/lib/utils";
import { useAuthors, useCreateAuthor, useDeleteAuthor, useUpdateAuthor } from "@/hooks/queries/authors_hooks";
import { useEffect, useState } from "react";
import AddEditAuthorsDialog from "@/components/Dialogs/Authors/AddEditAuthorsDialog";

export function AuthorsPage() {
  const authorsQuery = useAuthors();
  const items = authorsQuery.data ?? [];
  const createMutation = useCreateAuthor();
  const updateMutation = useUpdateAuthor();
  const deleteMutation = useDeleteAuthor();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Author | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Author | null>(
    null
  );

  const form = useForm<AuthorFormValues>({
    resolver: zodResolver(authorFormSchema),
    defaultValues: { name: "", bio: "" },
  });

  useEffect(() => {
    if (dialogOpen) {
      form.reset({
        name: editing?.name ?? "",
        bio: editing?.bio ?? "",
      });
    }
  }, [dialogOpen, editing, form]);

  const onSubmit = async (values: AuthorFormValues) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: values });
        toast.success("تم تحديث المؤلف");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("تم إضافة المؤلف");
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
      toast.success("تم حذف المؤلف");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الحذف");
    }
  };

  return (
    <DashboardLayout
      title="إدارة المؤلفين"
      subtitle={`${items.length} مؤلف`}
    >
      <div className="mb-5 flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          إضافة مؤلف
        </Button>
      </div>

      <QueryBoundary
        query={authorsQuery}
        isEmpty={!items.length}
        errorTitle="تعذر تحميل المؤلفين"
        skeleton={<CardGridSkeleton count={8} />}
        empty={
          <EmptyState
            icon={<PenTool className="h-8 w-8" />}
            title="لا يوجد مؤلفون"
            description="أضف مؤلفين لربطهم بالكتب"
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
          {items.map((a) => (
            <Card
              key={a.id}
              className="group transition-all duration-200 hover:border-primary-200 hover:shadow-card-hover"
            >
              <CardContent className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 text-lg font-bold text-secondary-foreground">
                    {initials(a.name ?? a.id.toString())}
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditing(a);
                        setDialogOpen(true);
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(a)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <h3 className="mb-1 font-bold text-foreground">{a.name}</h3>
                <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">
                  {a.bio || "لا يوجد سيرة ذاتية"}
                </p>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <Badge variant="secondary">
                    <BookOpen className="h-3 w-3" />
                    {a.books_count ?? 0} كتاب
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </QueryBoundary>

      {/* Form Dialog */}
      <AddEditAuthorsDialog
        dialogOpen={dialogOpen}
        setDialogOpen={setDialogOpen}
        editing={editing}
        form={form}
        onSubmit={onSubmit}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <Dialog open onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>تأكيد الحذف</DialogTitle>
            </DialogHeader>
            <p className="px-5 py-4 text-sm">
              هل أنت متأكد من حذف المؤلف{" "}
              <span className="font-bold">"{deleteTarget.name}"</span>؟ قد
              يؤثر على الكتب المرتبطة به.
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
