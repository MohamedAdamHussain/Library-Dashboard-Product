import * as React from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  onFilesSelected?: (files: File[]) => void;
  className?: string;
  label?: string;
  hint?: string;
  preview?: { type: "image" | "file"; url?: string; name?: string } | null;
  onClear?: () => void;
}

export function Dropzone({
  accept = { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024,
  onFilesSelected,
  className,
  label = "اسحب الملفات هنا أو اضغط للاختيار",
  hint,
  preview,
  onClear,
}: DropzoneProps) {
  const [errors, setErrors] = React.useState<string[]>([]);

  const onDrop = React.useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setErrors([]);
      if (rejectedFiles.length > 0) {
        const msgs = rejectedFiles
          .map((r) =>
            r.errors.map((e) => {
              if (e.code === "file-too-large")
                return `الملف "${r.file.name}" أكبر من ${Math.round(maxSize / 1024 / 1024)}MB`;
              if (e.code === "file-invalid-type")
                return `نوع الملف "${r.file.name}" غير مسموح`;
              return e.message;
            })
          )
          .flat();
        setErrors(msgs);
        return;
      }
      onFilesSelected?.(acceptedFiles);
    },
    [maxSize, onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept,
      maxFiles,
      maxSize,
    });

  if (preview) {
    return (
      <div className={cn("relative", className)}>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {preview.type === "image" && preview.url ? (
            <img
              src={preview.url}
              alt="معاينة"
              className="h-40 w-full object-cover"
            />
          ) : (
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {preview.name ?? "ملف"}
                </p>
                <p className="text-xs text-muted-foreground">تم اختيار الملف</p>
              </div>
            </div>
          )}
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90"
            type="button"
            aria-label="إزالة"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          isDragActive && !isDragReject
            ? "border-primary bg-primary/5"
            : "border-border hover:bg-accent/50",
          isDragReject && "border-destructive bg-destructive/5"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {accept["image/*"] ? (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          ) : (
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="text-sm font-medium">
            {isDragActive ? "أفلت الملف هنا" : label}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      {errors.length > 0 && (
        <ul className="space-y-1">
          {errors.map((err, i) => (
            <li key={i} className="text-xs font-medium text-destructive">
              • {err}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
