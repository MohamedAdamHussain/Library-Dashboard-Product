# Library Admin Dashboard

لوحة تحكم احترافية لإدارة مكتبة إلكترونية، مبنية بـ React 19 + Vite + TypeScript.

## المكدّس التقني

| الطبقة | التقنية |
|--------|---------|
| الإطار | Vite + React 19 + TypeScript 5 |
| التوجيه | React Router v7 |
| إدارة الحالة | Zustand 5 (persist) |
| جلب البيانات | TanStack React Query 5 |
| النماذج | react-hook-form + Zod 4 |
| HTTP | Axios (مع interceptors) |
| التصميم | Tailwind CSS 4 + shadcn/ui (Radix primitives) |
| الرسوم البيانية | Recharts 3 |
| اللغة | عربي + RTL كامل |

## الإعداد

```sh
# 1. تثبيت الحزم
npm install

# 2. ضبط عنوان الـ API
echo "VITE_API_URL=http://localhost:8000/api" > .env.local

# 3. تشغيل خادم التطوير
npm run dev

# 4. البناء للإنتاج
npm run build
```

## البنية المعمارية

```
src/
├── components/
│   ├── ui/              # مكونات shadcn/ui (button, card, dialog, ...)
│   ├── data/            # QueryBoundary, Skeletons
│   ├── layout/          # DashboardLayout, Sidebar, Header, CommandPalette
│   ├── dashboard/       # StatCard
│   ├── books/           # BookFormDialog
│   ├── AppProviders.tsx
│   ├── ErrorBoundary.tsx
│   └── ProtectedRoute.tsx
├── hooks/
│   ├── queries.ts       # كل React Query hooks
│   ├── use-app-navigate.ts
│   └── use-shortcuts.ts
├── lib/
│   ├── http.ts          # Axios client + ApiException
│   ├── services.ts      # API services (auth, books, users, ...)
│   ├── utils.ts         # cn, formatCurrency, formatDate, ...
│   ├── routes.ts       # navItems + orderStatusMap
│   └── error-message.ts
├── pages/               # الصفحات (Login, Overview, Books, ...)
├── schemas/
│   └── index.ts         # Zod schemas (مصدر واحد للحقيقة)
├── stores/
│   ├── auth-store.ts    # Zustand: user, token, login/logout
│   └── ui-store.ts      # Zustand: sidebar, theme, command palette
├── App.tsx
├── main.tsx
├── router.tsx
└── index.css            # نظام التصميم (OKLCH tokens + RTL)
```

## نقاط محسّنة على المشروع الأصلي

1. **Vite بدلاً من Next.js**: تطبيق React SPA نقي بدون SSR — أبسط وأسرع.
2. **إصلاح bug في `ordersService.list`**: الآن يستخدم `/admin/orders` بدلاً من `/orders`.
3. **إصلاح تعارض `book_title` vs `title`**: توحيد تحت `title` عبر Zod `transform`.
4. **إزالة `any`**: استخدام `unknown` + parsing صريح في `categoriesService` و `authorsService`.
5. **Env validation**: تحقق من `VITE_API_URL` عبر Zod.
6. **StaleTime مناسب**: `30s` للقوائم، `60s` للوحات والمخططات (بدلاً من `0`).
7. **Lazy load للصور**: `loading="lazy"` في كل `<img>`.
8. **Code splitting يدوي**: في `vite.config.ts` (react, query, charts, forms, radix).
9. **404 بالعربية**: بدلاً من النص الإنجليزي في الأصل.
10. **إصلاح حالة "تذكرني"**: مازال checkbox — يحتاج backend support.

## المتغيرات البيئية

```sh
# .env.local
VITE_API_URL=http://localhost:8000/api
```

## الترخيص

MIT
