/**
 * Book Form Component — Professional Layout
 * react-hook-form + zod + Dropzone + multi-select
 * مقسم لأقسام: معلومات أساسية + ملفات + تصنيفات
 */

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  DollarSign,
  UploadCloud,
  BookOpen,
  FolderTree,
  Info,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Dropzone } from "@/components/ui/dropzone";

import {
  bookFormSchema,
  type BookFormValues,
  type Book,
  type Category,
  type Author,
} from "@/schemas";
import { cn } from "@/lib/utils";
import { useCategories } from "@/hooks/queries/categories-hooks";
import { useAuthors } from "@/hooks/queries/authors_hooks";
import { useCreateBook, useUpdateBook } from "@/hooks/queries/books-hooks";

interface BookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book | null;
}

function SectionTitle({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mb-3 flex items-start gap-3 border-b border-border pb-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
    </div>
  );
}

export function BookFormDialog({
  open,
  onOpenChange,
  book,
}: BookFormDialogProps) {
  const isEditing = !!book;
  const { data: categoriesRaw } = useCategories();
  const { data: authorsRaw } = useAuthors();
  const categories: Category[] = Array.isArray(categoriesRaw)
    ? categoriesRaw
    : [];
  const authors: Author[] = Array.isArray(authorsRaw) ? authorsRaw : [];
  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: "",
      isbn: "",
      description: "",
      price: 0,
      language: "arabic",
      file_type: "pdf",
      publish_date: new Date().toISOString().slice(0, 10),
      categoryIds: [],
      authorIds: [],
    },
    mode: "onBlur",
  });

  const [imagePreview, setImagePreview] = React.useState<string | null>(
    book?.image_url ?? null
  );
  const [filePreview, setFilePreview] = React.useState<string | null>(
    book?.file_path ?? null
  );
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [bookFile, setBookFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    if (open) {
      form.reset({
        title: book?.title ?? "",
        isbn: book?.isbn ?? "",
        description: book?.description ?? "",
        price: book?.price ?? 0,
        language: book?.language ?? "arabic",
        file_type: book?.file_type ?? "pdf",
        publish_date:
          book?.publish_date ?? new Date().toISOString().slice(0, 10),
        categoryIds: book?.categories?.map((c) => c.id) ?? [],
        authorIds: book?.authors?.map((a) => a.id) ?? [],
      });
      setImagePreview(book?.image_url ?? null);
      setFilePreview(book?.file_path ?? null);
      setImageFile(null);
      setBookFile(null);
    }
  }, [open, book, form]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = form;
  const watchedCategoryIds = watch("categoryIds");
  const watchedAuthorIds = watch("authorIds");

  const toggleCategory = (id: number) => {
    const current = watchedCategoryIds;
    setValue(
      "categoryIds",
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
      { shouldValidate: true }
    );
  };
  const toggleAuthor = (id: number) => {
    const current = watchedAuthorIds;
    setValue(
      "authorIds",
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
      { shouldValidate: true }
    );
  };

  const onSubmit = async (values: BookFormValues) => {
    try {
      const payload = {
        ...values,
        image: imageFile ?? undefined,
        file: bookFile ?? undefined,
      };
      if (isEditing && book) {
        await updateMutation.mutateAsync({ id: book.id, data: payload });
        toast.success("تم تحديث الكتاب بنجاح");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("تم إضافة الكتاب بنجاح");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "فشل الحفظ"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="xl" className="max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "تعديل كتاب" : "إضافة كتاب جديد"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `تعديل بيانات: ${book?.title}`
              : "املأ بيانات الكتاب الجديد في الأقسام التالية"}
          </DialogDescription>
        </DialogHeader>

        <form
          id="book-form"
          onSubmit={handleSubmit(onSubmit)}
          className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5"
        >
          {/* Section 1: Basic Info */}
          <section>
            <SectionTitle
              icon={Info}
              title="المعلومات الأساسية"
              desc="العنوان، السعر، اللغة وتاريخ النشر"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="title">عنوان الكتاب *</Label>
                <Input
                  id="title"
                  placeholder="مثال: ظل الريح"
                  aria-invalid={!!errors.title}
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="isbn">رقم ISBN *</Label>
                <Input
                  id="isbn"
                  placeholder="978-0-00-000000-0"
                  dir="ltr"
                  aria-invalid={!!errors.isbn}
                  {...register("isbn")}
                />
                {errors.isbn && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.isbn.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">السعر (USD) *</Label>
                <div className="relative">
                  <DollarSign className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pr-10"
                    aria-invalid={!!errors.price}
                    {...register("price", { valueAsNumber: true })}
                  />
                </div>
                {errors.price && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.price.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="language">اللغة *</Label>
                <Select
                  value={watch("language")}
                  onValueChange={(v) =>
                    setValue("language", v as "arabic" | "english", {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arabic">عربي</SelectItem>
                    <SelectItem value="english">إنجليزي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="file_type">نوع الملف *</Label>
                <Select
                  value={watch("file_type")}
                  onValueChange={(v) =>
                    setValue("file_type", v as "pdf" | "epub", {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="file_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="epub">EPUB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="publish_date">تاريخ النشر *</Label>
                <Input
                  id="publish_date"
                  type="date"
                  aria-invalid={!!errors.publish_date}
                  {...register("publish_date")}
                />
                {errors.publish_date && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.publish_date.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">الوصف</Label>
                <Textarea
                  id="description"
                  placeholder="ملخص عن محتوى الكتاب..."
                  rows={3}
                  {...register("description")}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Files */}
          <section>
            <SectionTitle
              icon={UploadCloud}
              title="ملفات الكتاب"
              desc="صورة الغلاف وملف المحتوى"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>صورة الغلاف</Label>
                <div className="flex items-center gap-3">
                  <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="معاينة"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Dropzone
                      accept={{
                        "image/*": [".jpg", ".jpeg", ".png", ".webp"],
                      }}
                      maxSize={2 * 1024 * 1024}
                      hint="JPG, PNG, WebP — 2MB"
                      onFilesSelected={(files) => {
                        if (files[0]) {
                          setImageFile(files[0]);
                          setImagePreview(URL.createObjectURL(files[0]));
                        }
                      }}
                      preview={null}
                      label="اختر صورة"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>ملف الكتاب</Label>
                <Dropzone
                  accept={{
                    "application/pdf": [".pdf"],
                    "application/epub+zip": [".epub"],
                  }}
                  maxSize={10 * 1024 * 1024}
                  hint="PDF أو EPUB — 10MB"
                  onFilesSelected={(files) => {
                    if (files[0]) {
                      setBookFile(files[0]);
                      setFilePreview(files[0].name);
                    }
                  }}
                  preview={
                    filePreview
                      ? { type: "file", name: filePreview }
                      : null
                  }
                  onClear={() => {
                    setBookFile(null);
                    setFilePreview(null);
                  }}
                  label="اختر ملف الكتاب"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Categories & Authors */}
          <section>
            <SectionTitle
              icon={FolderTree}
              title="التصنيفات والمؤلفون"
              desc="اربط الكتاب بالتصنيفات والمؤلفين المناسبين"
            />
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label>التصنيفات *</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCategory(c.id)}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-sm font-medium transition-all",
                        watchedCategoryIds.includes(c.id)
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card text-foreground hover:border-primary-200 hover:bg-accent"
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {watchedCategoryIds.includes(c.id) && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {c.name_ar ?? c.name}
                      </span>
                    </button>
                  ))}
                </div>
                {errors.categoryIds && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.categoryIds.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>المؤلفون *</Label>
                <div className="flex flex-wrap gap-2">
                  {authors.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAuthor(a.id)}
                      className={cn(
                        "rounded-xl border px-3 py-1.5 text-sm font-medium transition-all",
                        watchedAuthorIds.includes(a.id)
                          ? "border-secondary bg-secondary text-secondary-foreground shadow-sm"
                          : "border-border bg-card text-foreground hover:border-secondary-200 hover:bg-accent"
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {watchedAuthorIds.includes(a.id) && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                        {a.name}
                      </span>
                    </button>
                  ))}
                </div>
                {errors.authorIds && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.authorIds.message}
                  </p>
                )}
              </div>
            </div>
          </section>
        </form>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            type="submit"
            form="book-form"
            loading={isSubmitting}
          >
            {isEditing ? "حفظ التعديلات" : "إضافة الكتاب"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
