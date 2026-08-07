/**
 * Auth Store (Zustand + persist)
 * ─────────────────────────────────
 * إدارة كاملة لحالة المصادقة:
 * - user data
 * - token persistence (localStorage key: library_admin_token)
 * - login/logout actions
 * - isAuthenticated computed
 * - matches storageKeys in lib/http.ts
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authService } from "@/lib/services";
import { STORAGE_KEYS } from "@/lib/http";
import type { LoginCredentials, User } from "@/schemas";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // C9 fix: remember parameter للتحكم في نوع التخزين
  login: (credentials: LoginCredentials, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // C9 fix: remember يتحكم في localStorage vs sessionStorage
      login: async (credentials, remember = true) => {
        set({ isLoading: true });
        try {
          const res = await authService.login(credentials);
          // C9: localStorage لو "تذكرني"، sessionStorage لو لا
          const storage = remember ? localStorage : sessionStorage;
          storage.setItem(STORAGE_KEYS.token, res.token);
          storage.setItem(
            STORAGE_KEYS.user,
            JSON.stringify(res.user)
          );
          set({
            user: res.user,
            token: res.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // تجاهل الأخطاء في الـ logout (التوكن قد يكون منتهي الصلاحية)
        } finally {
          // C9: امسح من كلا storage
          localStorage.removeItem(STORAGE_KEYS.token);
          localStorage.removeItem(STORAGE_KEYS.user);
          sessionStorage.removeItem(STORAGE_KEYS.token);
          sessionStorage.removeItem(STORAGE_KEYS.user);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
        }
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: "library-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
