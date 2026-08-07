import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

/**
 * يمنع الوصول للوحة التحكم قبل تسجيل الدخول أو لغير المشرفين.
 *
 * يستخدم حالة `hydrated` محلية للتأكد من استعادة جلسة Zustand من localStorage
 * قبل اتخاذ قرار التوجيه، لتفادي الوميض أو الحلقات اللانهائية.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  // منح دورة واحدة فقط للتأكد من أن Zustand persist قد استعاد الحالة من localStorage
  useEffect(() => {
    // Zustand persist يستعيد الحالة بشكل متزامن من localStorage في المتصفح
    // لكن نمنح إطارًا واحدًا لضمان الاستقرار
    setHydrated(true);
  }, []);

  // أثناء الـ hydration، اعرض شاشة تحميل قصيرة جدًا
  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">جارٍ تحضير لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  // بعد الـ hydration: إذا لم يكن مسجّلاً دخول، وجّه لـ /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // إذا كان مسجّلاً لكن ليس admin، اعرض صفحة الصلاحيات
  if (user && user.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground">
            صلاحيات غير كافية
          </h1>
          <p className="mb-6 text-muted-foreground">
            لا تملك صلاحيات الإدارة للوصول إلى لوحة التحكم.
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              await useAuthStore.getState().logout();
              window.location.href = "/login";
            }}
          >
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
