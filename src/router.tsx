import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppProviders } from "@/components/AppProviders";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { OverviewPage } from "@/pages/OverviewPage";
import { BooksPage } from "@/pages/BooksPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { AuthorsPage } from "@/pages/AuthorsPage";
import { OrdersPage } from "@/pages/OrdersPage";
import { UsersPage } from "@/pages/UsersPage";
import { ReportsPage } from "@/pages/ReportsPage";

/** 404 — صفحة غير موجودة */
function NotFoundPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4"
      dir="rtl"
    >
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          الصفحة غير موجودة
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-600"
          >
            العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    element: (
      <AppProviders>
        <ProtectedRoute>
          <OverviewPage />
        </ProtectedRoute>
      </AppProviders>
    ),
    path: "/",
  },
  {
    element: (
      <AppProviders>
        <ProtectedRoute>
          <BooksPage />
        </ProtectedRoute>
      </AppProviders>
    ),
    path: "/books",
  },
  {
    element: (
      <AppProviders>
        <ProtectedRoute>
          <CategoriesPage />
        </ProtectedRoute>
      </AppProviders>
    ),
    path: "/categories",
  },
  {
    element: (
      <AppProviders>
        <ProtectedRoute>
          <AuthorsPage />
        </ProtectedRoute>
      </AppProviders>
    ),
    path: "/authors",
  },
  {
    element: (
      <AppProviders>
        <ProtectedRoute>
          <OrdersPage />
        </ProtectedRoute>
      </AppProviders>
    ),
    path: "/orders",
  },
  {
    element: (
      <AppProviders>
        <ProtectedRoute>
          <UsersPage />
        </ProtectedRoute>
      </AppProviders>
    ),
    path: "/users",
  },
  {
    element: (
      <AppProviders>
        <ProtectedRoute>
          <ReportsPage />
        </ProtectedRoute>
      </AppProviders>
    ),
    path: "/reports",
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

// تصدير NotFoundPage لاستخدامها عند الحاجة
export { NotFoundPage };
