/**
 * Routes — مصدر واحد لمسارات التطبيق وعناصر التنقل
 * أي صفحة جديدة تُضاف هنا فقط، فتظهر تلقائياً في القائمة الجانبية ولوحة الأوامر.
 */

import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Users,
  ShoppingCart,
  BarChart3,
  PenTool,
} from "lucide-react";

export type AppRoute =
  | "/"
  | "/books"
  | "/categories"
  | "/authors"
  | "/orders"
  | "/users"
  | "/reports"
  | "/login"
  | "/forgot-password";

export interface NavItem {
  to: AppRoute;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

export const navItems: NavItem[] = [
  {
    to: "/",
    label: "نظرة عامة",
    description: "ملخص الأداء والمؤشرات",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/books",
    label: "الكتب",
    description: "إدارة الكتب والمخزون",
    icon: BookOpen,
  },
  {
    to: "/categories",
    label: "التصنيفات",
    description: "تنظيم أقسام المكتبة",
    icon: FolderTree,
  },
  {
    to: "/authors",
    label: "المؤلفون",
    description: "سجل المؤلفين",
    icon: PenTool,
  },
  {
    to: "/orders",
    label: "الطلبات",
    description: "متابعة الطلبات والمبيعات",
    icon: ShoppingCart,
  },
  {
    to: "/users",
    label: "المستخدمون",
    description: "حسابات القراء والمشرفين",
    icon: Users,
  },
  {
    to: "/reports",
    label: "التقارير",
    description: "تحليلات وإحصائيات",
    icon: BarChart3,
  },
];

/** C3 fix: إضافة "completed" + fallback آمن لأي حالة غير معروفة مستقبلاً */

export const ORDER_STATUS_LABELS = {
  paid: "مدفوع",
  completed: "مكتمل",
  pending: "قيد الانتظار",
  failed: "فشل",
  refunded: "مسترجع",
} as const;

export type OrderStatusVariant =
  | "success"
  | "warning"
  | "destructive"
  | "default";

interface OrderStatusInfo {
  label: string;
  variant: OrderStatusVariant;
}

export const orderStatusMap: Record<string, OrderStatusInfo> = {
  paid: { label: "مدفوع", variant: "success" },
  completed: { label: "مكتمل", variant: "success" },
  pending: { label: "قيد الانتظار", variant: "warning" },
  failed: { label: "فشل", variant: "destructive" },
  refunded: { label: "مسترجع", variant: "default" },
};

/** Helper آمن: يُرجع معلومات الحالة مع fallback لأي حالة غير معروفة */
export function getOrderStatus(status: string): OrderStatusInfo {
  return (
    orderStatusMap[status] ?? {
      label: status,
      variant: "default" as const,
    }
  );
}
