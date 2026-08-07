import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Library,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { ApiException } from "@/lib/http";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginCredentials } from "@/schemas";

export function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  // C9 fix: state لـ "تذكرني"
  const [remember, setRemember] = useState(true);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (values: LoginCredentials) => {
    try {
      // C9 fix: مرّر remember للـ store
      await login(values, remember);
      toast.success("تم تسجيل الدخول بنجاح");
      navigate("/");
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.isForbidden) {
          if (
            err.message.toLowerCase().includes("not verified") ||
            err.message.toLowerCase().includes("verify")
          ) {
            toast.error("يجب تفعيل البريد الإلكتروني أولاً");
          } else if (err.message.toLowerCase().includes("blocked")) {
            toast.error("الحساب محظور. تواصل مع الدعم");
          } else {
            toast.error(err.message);
          }
        } else if (err.isUnauthorized) {
          toast.error("بيانات الدخول غير صحيحة");
        } else if (err.isNetworkError) {
          toast.error(
            "تعذر الاتصال بالخادم. تحقق من تشغيل الـ backend"
          );
        } else {
          toast.error(err.message || "حدث خطأ أثناء تسجيل الدخول");
        }
      } else {
        toast.error("حدث خطأ غير متوقع");
      }
    }
  };

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* Form side */}
      <div className="flex flex-1 items-center justify-center bg-card p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
              <Library className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                لوحة التحكم
              </h1>
              <p className="text-sm text-muted-foreground">
                Reading Community Admin
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="mb-2 text-3xl font-bold text-foreground">
              مرحباً بعودتك
            </h2>
            <p className="text-muted-foreground">
              سجّل دخولك للوصول إلى لوحة الإدارة
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@library.com"
                  className="pr-10"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="px-10"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary"
                />
                تذكرني
              </label>
              <a
                href="/forgot-password"
                className="font-medium text-primary hover:underline"
              >
                نسيت كلمة المرور؟
              </a>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full"
            >
              تسجيل الدخول
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            © 2026 Reading Community · جميع الحقوق محفوظة
          </p>
        </div>
      </div>

      {/* Visual side */}
      {/* <div className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 lg:flex">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute right-20 top-20 h-72 w-72 rounded-full bg-secondary-400 blur-3xl" />
          <div className="absolute bottom-20 left-20 h-96 w-96 rounded-full bg-highlight blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-16 text-white">
          <div className="mb-8">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
              <Library className="h-8 w-8" />
            </div>
            <h2 className="mb-4 text-4xl font-bold leading-tight">
              نظام إدارة المكتبة
              <br />
              <span className="text-secondary-300">
                الإلكترونية المتكامل
              </span>
            </h2>
            <p className="text-lg leading-relaxed text-white/80">
              منصة واحدة لإدارة الكتب والمستخدمين والمبيعات والتقارير المالية
              في بيئة عربية احترافية.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: "إدارة الكتب", value: "CRUD كامل" },
              { label: "تقارير مالية", value: "لحظية" },
              { label: "دعم RTL", value: "كامل" },
              { label: "حماية", value: "Sanctum" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"
              >
                <p className="mb-1 text-xs text-white/60">{item.label}</p>
                <p className="text-lg font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div> */}
    </div>
  );
}
