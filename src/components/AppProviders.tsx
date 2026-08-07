import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useCommandPaletteShortcut } from "@/hooks/use-shortcuts";

// إنشاء QueryClient واحد (singleton على مستوى الوحدة)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * AppProviders
 * ─────────────
 * يلفّ التطبيق بكل الـ providers اللازمة:
 *  - QueryClientProvider (TanStack Query)
 *  - TooltipProvider (Radix Tooltip)
 *  - ErrorBoundary (التقاط الأخطاء)
 *  - Toaster (Sonner للإشعارات)
 *
 * ملاحظة عن Zustand persist:
 *  - في المتصفح، Zustand persist يستعيد الحالة بشكل **متزامن** عند الإقلاع
 *    (لأنه يستخدم localStorage.getItem مباشرة في createJSONStorage).
 *  - لذلك لا حاجة لخطوة hydration منفصلة، فالحالة متاحة فور قراءتها.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  useCommandPaletteShortcut();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={200}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <Toaster position="top-center" richColors closeButton dir="rtl" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
