/**
 * useKeyboardShortcuts — اختصارات لوحة المفاتيح العامة
 * - Cmd+K / Ctrl+K → فتح لوحة الأوامر
 */

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";

export function useCommandPaletteShortcut() {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCommandPalette]);
}
