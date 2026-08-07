import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Library,
  Mail,
  ArrowLeft,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authService } from "@/lib/services"
import { ApiException } from "@/lib/http"
import {
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  type ForgotPasswordValues,
  type VerifyOtpValues,
  type ResetPasswordValues,
} from "@/schemas"

// F4 fix: ترجمة رسائل الـ API الإنجليزية للعربية
const API_MESSAGES_AR: Record<string, string> = {
  "User not found.": "البريد الإلكتروني غير مسجّل لدينا",
  "Invalid or expired OTP code.": "رمز التحقق غير صحيح أو منتهي الصلاحية",
  "The provided OTP code is incorrect.": "رمز التحقق غير صحيح",
  "This OTP code has expired. Please request a new one.":
    "انتهت صلاحية الرمز. اطلب رمزاً جديداً",
}

function translateApiMessage(message: string): string {
  // ابحث عن تطابق مباشر
  if (API_MESSAGES_AR[message]) return API_MESSAGES_AR[message]
  // ابحث عن تطابق جزئي (case-insensitive)
  const lower = message.toLowerCase()
  if (lower.includes("user not found"))
    return "البريد الإلكتروني غير مسجّل لدينا"
  if (lower.includes("otp") && lower.includes("expired"))
    return "انتهت صلاحية الرمز. اطلب رمزاً جديداً"
  if (lower.includes("otp") && lower.includes("incorrect"))
    return "رمز التحقق غير صحيح"
  if (lower.includes("invalid") && lower.includes("otp"))
    return "رمز التحقق غير صحيح أو منتهي الصلاحية"
  return message // اترك الرسالة الأصلية إن لم نعرفها
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiException) {
    if (err.isNetworkError)
      return "تعذر الاتصال بالخادم. تحقق من تشغيل الـ backend"
    return translateApiMessage(err.message || fallback)
  }
  if (err instanceof Error) return err.message || fallback
  return fallback
}

type Step = "email" | "otp" | "password" | "success"

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)

  // F1 fix: timer عبر useEffect بدلاً من useRef + setInterval يدوي
  // يتجنّب تحذير "Cannot access refs during render" في React 19
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => {
      setResendCooldown((c) => c - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const startResendCooldown = () => {
    setResendCooldown(30)
  }

  // === Step 1: Email ===
  const emailForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onBlur",
  })

  const onEmailSubmit = async (values: ForgotPasswordValues) => {
  try {
    await authService.forgotPassword(values);
    setEmail(values.email);
    // FIX: املأ email في otpForm لاجتياز verifyOtpSchema
    // (المشكلة: defaultValues.email = "" يجعل Zod يفشل صامتاً)
    otpForm.reset({ email: values.email, otp_code: "" });
    setStep("otp");
    startResendCooldown();
    toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
  } catch (err) {
    toast.error(getErrorMessage(err, "فشل الإرسال"));
  }
};

  // === Step 2: OTP ===
  const otpForm = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: "", otp_code: "" },
    mode: "onBlur",
  })

  const onOtpSubmit = async (values: VerifyOtpValues) => {
    console.log("Verifying OTP:", values)
    try {
      await authService.verifyResetOtp({ ...values, email })
      setOtp(values.otp_code)
      setStep("password")
      toast.success("تم التحقق من الرمز بنجاح")
      // F3 fix: نظّف حقل OTP بعد النجاح
      otpForm.reset({ email: "", otp_code: "" })
    } catch (err) {
      toast.error(getErrorMessage(err, "رمز غير صحيح"))
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    try {
      await authService.forgotPassword({ email })
      startResendCooldown()
      toast.success("تم إعادة إرسال الرمز")
    } catch (err) {
      toast.error(getErrorMessage(err, "فشل إعادة الإرسال"))
    }
  }

  // === Step 3: New Password ===
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const passwordForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      otp_code: "",
      password: "",
      password_confirmation: "",
    },
    mode: "onBlur",
  })

  const onPasswordSubmit = async (values: ResetPasswordValues) => {
    try {
      await authService.resetPassword({
        ...values,
        email,
        otp_code: otp,
      })
      setStep("success")
      toast.success("تم تغيير كلمة المرور بنجاح")
    } catch (err) {
      toast.error(getErrorMessage(err, "فشل التغيير"))
    }
  }

  const steps: { id: Step; label: string }[] = [
    { id: "email", label: "البريد" },
    { id: "otp", label: "التحقق" },
    { id: "password", label: "كلمة المرور" },
  ]
  const currentStepIdx = steps.findIndex((s) => s.id === step)

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* Form side */}
      <div className="flex flex-1 items-center justify-center bg-card p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <a href="/login" className="group mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <Library className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">لوحة التحكم</h1>
              <p className="text-sm text-muted-foreground">
                Reading Community Admin
              </p>
            </div>
          </a>

          {/* Back link */}
          <a
            href="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 rtl-flip" />
            العودة لتسجيل الدخول
          </a>

          {/* Stepper */}
          {step !== "success" && (
            <div className="mb-8 flex items-center justify-between">
              {steps.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex flex-1 items-center last:flex-none"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                        idx <= currentStepIdx
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx < currentStepIdx ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span
                      className={`text-xs ${
                        idx <= currentStepIdx
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`mx-2 mb-5 h-0.5 flex-1 ${
                        idx < currentStepIdx ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step Content */}
          {step === "email" && (
            <div>
              <h2 className="mb-2 text-2xl font-bold text-foreground">
                استعادة كلمة المرور
              </h2>
              <p className="mb-6 text-muted-foreground">
                أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق لإعادة تعيين كلمة
                المرور
              </p>
              <form
                onSubmit={emailForm.handleSubmit(onEmailSubmit)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="fp-email"
                    className="block text-sm font-medium text-foreground"
                  >
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fp-email"
                      type="email"
                      placeholder="admin@library.com"
                      className="pr-10"
                      aria-invalid={!!emailForm.formState.errors.email}
                      {...emailForm.register("email")}
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={emailForm.formState.isSubmitting}
                >
                  إرسال رمز التحقق
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}

          {step === "otp" && (
            <div>
              <h2 className="mb-2 text-2xl font-bold text-foreground">
                التحقق من الرمز
              </h2>
              <p className="mb-6 text-muted-foreground">
                أرسلنا رمزاً مكوّناً من 6 أرقام إلى{" "}
                <span className="font-semibold text-foreground">{email}</span>
              </p>
              <form
                onSubmit={otpForm.handleSubmit(onOtpSubmit)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="fp-otp"
                    className="block text-sm font-medium text-foreground"
                  >
                    رمز التحقق
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fp-otp"
                      inputMode="numeric"
                      placeholder="••••••"
                      dir="ltr"
                      className="pr-10 text-center font-mono text-lg tracking-[0.5em]"
                      maxLength={6}
                      aria-invalid={!!otpForm.formState.errors.otp_code}
                      {...otpForm.register("otp_code")}
                    />
                  </div>
                  {otpForm.formState.errors.otp_code && (
                    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {otpForm.formState.errors.otp_code.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={otpForm.formState.isSubmitting}
                >
                  تحقق
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">لم يصلك الرمز؟ </span>
                  {resendCooldown > 0 ? (
                    <span className="text-muted-foreground">
                      إعادة الإرسال خلال {resendCooldown} ثانية
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" />
                      إعادة إرسال
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {step === "password" && (
            <div>
              <h2 className="mb-2 text-2xl font-bold text-foreground">
                كلمة المرور الجديدة
              </h2>
              <p className="mb-6 text-muted-foreground">
                اختر كلمة مرور قوية لا تقل عن 8 أحرف
              </p>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="fp-pass"
                    className="block text-sm font-medium text-foreground"
                  >
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fp-pass"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="px-10"
                      aria-invalid={!!passwordForm.formState.errors.password}
                      {...passwordForm.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordForm.formState.errors.password && (
                    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {passwordForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="fp-confirm"
                    className="block text-sm font-medium text-foreground"
                  >
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <Lock className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fp-confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="px-10"
                      aria-invalid={
                        !!passwordForm.formState.errors.password_confirmation
                      }
                      {...passwordForm.register("password_confirmation")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordForm.formState.errors.password_confirmation && (
                    <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {
                        passwordForm.formState.errors.password_confirmation
                          .message
                      }
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={passwordForm.formState.isSubmitting}
                >
                  تغيير كلمة المرور
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}

          {step === "success" && (
            <div className="animate-scale-in py-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-foreground">
                تم التغيير بنجاح
              </h2>
              <p className="mb-8 text-muted-foreground">
                تم تغيير كلمة المرور الخاصة بحسابك. يمكنك الآن تسجيل الدخول
                بكلمة المرور الجديدة.
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate("/login")}
              >
                تسجيل الدخول
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

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
          <div>
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="mb-4 text-4xl font-bold leading-tight">
              أمان أولاً
              <br />
              <span className="text-secondary-300">حماية حسابك</span>
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-white/80">
              نحرص على حماية حسابك بإرسال رمز تحقق مؤقت إلى بريدك الإلكتروني
              للتأكد من هويتك.
            </p>
            <div className="space-y-3">
              {[
                "رمز تحقق ينتهي خلال 10 دقائق",
                "تشفير كامل لبياناتك الحساسة",
                "إعادة تعيين آمنة لكلمة المرور",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-white/90"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10">
                    <CheckCircle2 className="h-4 w-4 text-secondary-300" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div> */}
    </div>
  )
}
