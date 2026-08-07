import { toast } from "sonner";
import {
  Plus,
  Search,
  Star,
  BookOpen,
  Pencil,
  Trash2,
  Eye,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/states";
import { QueryBoundary } from "@/components/data/QueryBoundary";
import { BookGridSkeleton } from "@/components/data/Skeletons";
import { Pagination } from "@/components/ui/pagination";
import { BookFormDialog } from "@/components/books/BookFormDialog";

import { formatCurrency, formatDate, truncate } from "@/lib/utils";
import type { Book } from "@/schemas";
import { useBooks, useDeleteBook } from "@/hooks/queries/books-hooks";
import { useCategories } from "@/hooks/queries/categories-hooks";
import { useAuthors } from "@/hooks/queries/authors_hooks";
import { useEffect, useState } from "react";

export function BooksPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [languageFilter, setLanguageFilter] = useState<
    "all" | "arabic" | "english"
  >("all");
  const [categoryId, setCategoryId] = useState<number | undefined>(
    undefined
  );
  const [authorId, setAuthorId] = useState<number | undefined>(
    undefined
  );
  const [showFilters, setShowFilters] = useState(false);

  const booksQuery = useBooks({
    search: search || undefined,
    language: languageFilter,
    category_id: categoryId,
    author_id: authorId,
    page,
    per_page: 12,
  });
  const { data } = booksQuery;

  const { data: categories = [] } = useCategories();
  const { data: authors = [] } = useAuthors();
  const deleteMutation = useDeleteBook();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);

  // M2 fix: إعادة تعيين فورية عند تغيّر الفلاتر (بدون debounce)
  useEffect(() => {
    setPage(1);
  }, [languageFilter, categoryId, authorId]);

  // M2 fix: debounce فقط على نص البحث (لتفادي طلب لكل حرف)
  useEffect(() => {
    const t = setTimeout(() => setPage(1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const activeFiltersCount = [
    languageFilter !== "all",
    categoryId !== undefined,
    authorId !== undefined,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setLanguageFilter("all");
    setCategoryId(undefined);
    setAuthorId(undefined);
    setSearch("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("تم حذف الكتاب بنجاح");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الحذف");
    }
  };

  return (
    <DashboardLayout
      title="إدارة الكتب"
      subtitle={`${data?.total ?? 0} كتاب في المكتبة`}
    >
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="بحث بالعنوان أو ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-card pr-10 pl-3.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button
          variant={showFilters ? "primary" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <SlidersHorizontal className="h-4 w-4" />
          فلترة
          {activeFiltersCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
              {activeFiltersCount}
            </span>
          )}
        </Button>
        <Button
          onClick={() => {
            setEditingBook(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          إضافة كتاب
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="mb-4 animate-fade-in">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                الفلاتر
              </h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-destructive hover:underline"
                >
                  <X className="h-3 w-3" />
                  مسح الكل
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  اللغة
                </label>
                <Select
                  value={languageFilter}
                  onValueChange={(v) =>
                    setLanguageFilter(v as typeof languageFilter)
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="كل اللغات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل اللغات</SelectItem>
                    <SelectItem value="arabic">عربي</SelectItem>
                    <SelectItem value="english">إنجليزي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  التصنيف
                </label>
                <Select
                  value={categoryId?.toString() ?? "all"}
                  onValueChange={(v) =>
                    setCategoryId(v === "all" ? undefined : Number(v))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="كل التصنيفات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل التصنيفات</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name_ar ?? c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  المؤلف
                </label>
                <Select
                  value={authorId?.toString() ?? "all"}
                  onValueChange={(v) =>
                    setAuthorId(v === "all" ? undefined : Number(v))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="كل المؤلفين" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المؤلفين</SelectItem>
                    {authors.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Books grid */}
      <QueryBoundary
        query={booksQuery}
        isEmpty={!data?.data.length}
        errorTitle="تعذر تحميل الكتب"
        skeleton={<BookGridSkeleton count={8} />}
        empty={
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title="لا توجد كتب"
            description="لم يتم العثور على كتب مطابقة. جرب تعديل الفلاتر أو أضف كتاباً جديداً."
            action={
              <Button
                onClick={() => {
                  setEditingBook(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4" /> إضافة كتاب
              </Button>
            }
          />
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(data?.data ?? []).map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onView={() => setViewingBook(book)}
              onEdit={() => {
                setEditingBook(book);
                setFormOpen(true);
              }}
              onDelete={() => setDeleteTarget(book)}
            />
          ))}
        </div>
        {data && (
          <Pagination
            className="mt-6"
            page={page}
            lastPage={data.last_page}
            total={data.total}
            perPage={data.per_page}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </QueryBoundary>

      {/* Form Modal */}
      <BookFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        book={editingBook}
      />

      {/* View Modal */}
      {viewingBook && (
        <Dialog open onOpenChange={() => setViewingBook(null)}>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>{viewingBook.title}</DialogTitle>
              <DialogDescription>
                ISBN: {viewingBook.isbn}
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 grid grid-cols-1 gap-6 overflow-y-auto p-5 sm:grid-cols-3">
              <div className="sm:col-span-1">
                {viewingBook.image_url ? (
                  <img
                    src={viewingBook.image_url}
                    alt={viewingBook.title}
                    className="aspect-[3/4] w-full rounded-xl object-cover shadow-md"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center rounded-xl bg-muted">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingBook(viewingBook);
                      setViewingBook(null);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    تعديل
                  </Button>
                </div>
              </div>
              <div className="space-y-4 sm:col-span-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      السعر
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(viewingBook.price)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      التقييم
                    </p>
                    <p className="flex items-center gap-1 text-lg font-bold">
                      {viewingBook.ratings_avg ? (
                        <>
                          <Star className="h-4 w-4 fill-secondary text-secondary" />
                          {viewingBook.ratings_avg}
                          <span className="text-xs text-muted-foreground">
                            ({viewingBook.ratings_count})
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      اللغة
                    </p>
                    <Badge
                      variant={
                        viewingBook.language === "arabic"
                          ? "primary"
                          : "secondary"
                      }
                    >
                      {viewingBook.language === "arabic"
                        ? "عربي"
                        : "إنجليزي"}
                    </Badge>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="mb-1 text-xs text-muted-foreground">
                      تاريخ النشر
                    </p>
                    <p className="text-sm font-semibold">
                      {formatDate(viewingBook.publish_date)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    التصنيفات
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingBook.categories?.length ? (
                      viewingBook.categories.map((c) => (
                        <Badge key={c.id} variant="primary">
                          {c.name_ar ?? c.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    المؤلفون
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingBook.authors?.length ? (
                      viewingBook.authors.map((a) => (
                        <Badge key={a.id} variant="secondary">
                          {a.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-muted-foreground">
                    الوصف
                  </p>
                  <p className="rounded-xl bg-muted/30 p-3 text-sm leading-relaxed text-foreground/80">
                    {viewingBook.description || "لا يوجد وصف"}
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <Dialog open onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>تأكيد الحذف</DialogTitle>
              <DialogDescription>
                لا يمكن التراجع عن هذا الإجراء
              </DialogDescription>
            </DialogHeader>
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <Trash2 className="h-5 w-5" />
                </div>
                <p className="text-sm text-foreground">
                  سيتم حذف الكتاب{" "}
                  <span className="font-bold">
                    "{truncate(deleteTarget.title, 40)}"
                  </span>{" "}
                  نهائياً مع جميع ملفاته.
                </p>
              </div>
            </div>
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
                <Trash2 className="h-4 w-4" />
                حذف نهائي
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}

// ============================================================
// BookCard Component
// ============================================================
function BookCard({
  book,
  onView,
  onEdit,
  onDelete,
}: {
  book: Book;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:border-primary-200 hover:shadow-card-hover">
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        {book.image_url ? (
          <img
            src={book.image_url}
            alt={book.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-1.5">
          <Badge
            variant={book.language === "arabic" ? "primary" : "secondary"}
          >
            {book.language === "arabic" ? "عربي" : "إنجليزي"}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <div className="absolute bottom-3 right-3 left-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-0 bg-card/95 backdrop-blur-sm"
              onClick={onView}
            >
              <Eye className="h-4 w-4" />
              عرض
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-0 bg-card/95 backdrop-blur-sm"
              onClick={onEdit}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="mb-1 line-clamp-1 text-sm font-bold text-foreground">
          {book.title}
        </h3>
        <p className="mb-3 line-clamp-1 text-xs text-muted-foreground">
          {book.authors?.map((a) => a.name).join("، ") || "بدون مؤلف"}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-primary">
              {formatCurrency(book.price)}
            </span>
            {book.ratings_avg ? (
              <Badge variant="warning" size="sm">
                <Star className="h-2.5 w-2.5 fill-current" />
                {book.ratings_avg}
              </Badge>
            ) : null}
          </div>
          {book.sales_count ? (
            <span className="text-[10px] text-muted-foreground">
              {book.sales_count} مبيعة
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
