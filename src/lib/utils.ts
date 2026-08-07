import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** دمج classes Tailwind بشكل ذكي (يزيل التعارضات) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** تنسيق المبالغ المالية */
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** تنسيق الأرقام */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

/** تنسيق التاريخ بالعربية */
export function formatDate(
  date: string | Date | null | undefined,
  withTime = false
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const opts: Intl.DateTimeFormatOptions = withTime
    ? {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    : { year: "numeric", month: "short", day: "numeric" };
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", opts).format(d);
}

/** الوقت النسبي بالعربية */
export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;
  return `منذ ${Math.floor(months / 12)} سنة`;
}

/** اختصار النص */
export function truncate(str: string, max = 50): string {
  if (str.length <= max) return str;
  return str.slice(0, max).trim() + "...";
}

/** الأحرف الأولى من الاسم (defensive ضد undefined/null/empty) */
export function initials(name: string | null | undefined): string {
  if (!name || typeof name !== "string" || name.trim() === "") return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((s) => s[0] ?? "")
    .join("")
    .toUpperCase();
}

/** C7 fix: توحيد اسم العرض من username / name / email */
export function getDisplayName(user: {
  username?: string | null;
  name?: string | null;
  email?: string | null;
}): string {
  return user.username ?? user.name ?? user.email ?? "—";
}

/** إزالة القيم undefined/null/"" من كائن (للاستخدام في query params) */
export function pickBy<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null && v !== "") result[k] = v;
  }
  return result as Partial<T>;
}

/** التحقق من كائن فارغ */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/** تأخير لمحاكاة الشبكة */
export function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

/** تحويل bytes إلى نص مقروء */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
