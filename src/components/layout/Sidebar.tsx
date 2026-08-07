import { Link, useLocation } from "react-router-dom";
import { Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { navItems } from "@/lib/routes";

export function Sidebar() {
  const { pathname } = useLocation();
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } =
    useUIStore();

  return (
    <>
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col border-l border-sidebar-border bg-sidebar transition-all duration-300 lg:static lg:z-auto",
          sidebarCollapsed ? "w-20" : "w-72",
          mobileSidebarOpen
            ? "translate-x-0"
            : "translate-x-full lg:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-sidebar-border p-5",
            sidebarCollapsed && "justify-center"
          )}
        >
          <div
            className={cn(
              "flex min-w-0 items-center gap-3",
              sidebarCollapsed && "gap-0"
            )}
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary shadow-card">
              <Library className="h-5 w-5 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 animate-fade-in">
                <h1 className="truncate text-base font-bold leading-tight text-sidebar-foreground">
                  لوحة التحكم
                </h1>
                <p className="truncate text-xs text-muted-foreground">
                  Reading Community
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end
              ? pathname === item.to
              : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileSidebarOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                  sidebarCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  )}
                />
                {!sidebarCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {!sidebarCollapsed && (
          <div className="p-4">
            <div className="rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-4 text-center">
              <p className="mb-1 text-xs font-medium text-primary-foreground/80">
                الإصدار 2.0.0
              </p>
              <p className="text-sm font-bold text-primary-foreground">
                © Reading Community
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
