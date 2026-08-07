/**
 * HTTP Client (Axios) — Singleton مع interceptors كاملة
 * ───────────────────────────────────────────────────────
 * - Base URL من env vars (مع Zod validation)
 * - Auth token interceptor (Bearer)
 * - 401 auto-logout + redirect
 * - 422 validation errors extraction
 * - Network/timeout error handling
 * - Toast notifications للأخطاء العامة
 */

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";
import { z } from "zod";

// --- Storage keys (مشاركة مع auth store) ---
export const STORAGE_KEYS = {
  token: "library_admin_token",
  user: "library_admin_user",
} as const;

// --- Env validation (إصلاح: لا fallback صامت) ---
const envSchema = z.object({
  VITE_API_URL: z.string().url("VITE_API_URL must be a valid URL"),
});
const parsedEnv = envSchema.safeParse(import.meta.env);
if (!parsedEnv.success) {
  console.warn(
    "[http] VITE_API_URL غير مُعرّف أو غير صحيح. سيتم استخدام /api كـ fallback.",
    parsedEnv.error.flatten().fieldErrors
  );
}

const BASE_URL = parsedEnv.data?.VITE_API_URL ?? "/api";

// --- Types ---
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
}

/**
 * ApiException — استثناء مخصّص يحمل كل تفاصيل خطأ API
 */
export class ApiException extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errors?: Record<string, string[]>,
    public raw?: unknown
  ) {
    super(message);
    this.name = "ApiException";
  }

  get isValidation(): boolean {
    return this.statusCode === 422;
  }
  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }
  get isForbidden(): boolean {
    return this.statusCode === 403;
  }
  get isNotFound(): boolean {
    return this.statusCode === 404;
  }
  get isConflict(): boolean {
    return this.statusCode === 409;
  }
  get isRateLimited(): boolean {
    return this.statusCode === 429;
  }
  get isServerError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 500;
  }
  get isNetworkError(): boolean {
    return this.statusCode === undefined;
  }

  getFieldError(field: string): string | undefined {
    return this.errors?.[field]?.[0];
  }

  getAllFieldErrors(): string[] {
    if (!this.errors) return [];
    return Object.values(this.errors).flat();
  }
}

class HttpClient {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      timeout: 30_000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private setupRequestInterceptor() {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // C9 fix: اقرأ التوكن من localStorage أو sessionStorage (تذكرني معطّل)
        const token =
          localStorage.getItem(STORAGE_KEYS.token) ||
          sessionStorage.getItem(STORAGE_KEYS.token);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private setupResponseInterceptor() {
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError<ApiErrorResponse>) => {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = data?.message || this.getDefaultMessage(error);

        // 401 — انتهاء الجلسة
        if (status === 401) {
          this.handleUnauthorized();
          return Promise.reject(
            new ApiException(message, status, data?.errors, error)
          );
        }

        // 422 — validation (يُترك للـ caller)
        if (status === 422) {
          return Promise.reject(
            new ApiException(message, status, data?.errors, error)
          );
        }

        // 403 — ممنوع (لا نعرض toast للرسائل الخاصة بالـ admin)
        if (status === 403) {
          if (
            !message.toLowerCase().includes("admin") &&
            !message.toLowerCase().includes("unauthorized")
          ) {
            toast.error(message || "لا تملك صلاحية للقيام بهذا الإجراء");
          }
          return Promise.reject(
            new ApiException(message, status, data?.errors, error)
          );
        }

        // 404, 409 — يُترك للـ caller
        if (status === 404 || status === 409) {
          return Promise.reject(
            new ApiException(
              status === 404
                ? message || "المورد غير موجود"
                : message,
              status,
              data?.errors,
              error
            )
          );
        }

        // 429 — rate limit
        if (status === 429) {
          toast.error("طلبات كثيرة. حاول لاحقاً");
          return Promise.reject(
            new ApiException("طلبات كثيرة. حاول لاحقاً", status, data?.errors, error)
          );
        }

        // 5xx — خطأ بالخادم
        if (status && status >= 500) {
          toast.error("حدث خطأ في الخادم. حاول لاحقاً");
          return Promise.reject(
            new ApiException("حدث خطأ في الخادم", status, data?.errors, error)
          );
        }

        // خطأ شبكي (لا يوجد response)
        if (!error.response) {
          const isTimeout = error.code === "ECONNABORTED";
          const msg = isTimeout
            ? "انتهت مهلة الطلب. تحقق من اتصالك"
            : "تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت";
          toast.error(msg);
          return Promise.reject(
            new ApiException(msg, undefined, undefined, error)
          );
        }

        // أي خطأ آخر
        toast.error(message);
        return Promise.reject(
          new ApiException(message, status, data?.errors, error)
        );
      }
    );
  }

  private handleUnauthorized() {
    // C9 fix: امسح من كلا storage (localStorage + sessionStorage)
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.user);
    sessionStorage.removeItem(STORAGE_KEYS.token);
    sessionStorage.removeItem(STORAGE_KEYS.user);
    if (window.location.pathname !== "/login") {
      toast.error("انتهت الجلسة. يرجى تسجيل الدخول مجدداً");
      window.location.href = "/login";
    }
  }

  private getDefaultMessage(error: AxiosError): string {
    if (error.code === "ECONNABORTED") return "انتهت مهلة الطلب";
    if (!error.response) return "تعذر الاتصال بالخادم";
    return "حدث خطأ غير متوقع";
  }

  // ===== Public API =====

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  /** C8 fix: رفع ملفات (FormData) — Content-Type: undefined ليضبطه المتصفح مع boundary */
  async upload<T>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        // اتركها undefined ليضبطها المتصفح مع boundary تلقائياً
        "Content-Type": undefined,
      },
    });
    return response.data;
  }
}

export const http = new HttpClient();
