/**
 * error-message — استخراج رسالة خطأ قابلة للعرض للمستخدم
 */

import { ApiException } from "@/lib/http";

export function getErrorMessage(
  err: unknown,
  fallback = "حدث خطأ غير متوقع"
): string {
  if (err instanceof ApiException) {
    if (err.isNetworkError)
      return "تعذر الاتصال بالخادم. تحقق من تشغيل الـ backend";
    return err.message || fallback;
  }
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "string") return err;
  return fallback;
}
