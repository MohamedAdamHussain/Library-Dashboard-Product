/**
 * useAppNavigate — تنقّل مبسّط بمسار نصّي مع الحفاظ على أمان الأنواع
 */

import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import type { AppRoute } from "@/lib/routes";

export function useAppNavigate() {
  const navigate = useNavigate();
  return useCallback(
    (to: AppRoute, options?: { replace?: boolean }) =>
      navigate(to, { replace: options?.replace ?? false }),
    [navigate]
  );
}
