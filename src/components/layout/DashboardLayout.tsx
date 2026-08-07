import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandPalette } from "./CommandPalette";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function DashboardLayout({
  title,
  subtitle,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={title} subtitle={subtitle} />
        <main className="max-w-full flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
