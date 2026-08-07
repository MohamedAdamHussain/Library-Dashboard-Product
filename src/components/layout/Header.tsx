import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Bell,
  LogOut,
  Sun,
  Moon,
  PanelRightClose,
  PanelRight,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { initials, getDisplayName } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const {
    sidebarCollapsed,
    toggleMobileSidebar,
    toggleSidebar,
    toggleCommandPalette,
    toggleTheme,
    theme,
  } = useUIStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // user قد يكون null أثناء تحميل الـ store
  // C7 fix: استخدم getDisplayName
  const displayName = user ? getDisplayName(user) : "مستخدم";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Right side (RTL): menu + title */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={toggleMobileSidebar}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
            aria-label="فتح القائمة"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={toggleSidebar}
            className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:flex"
            aria-label="طي القائمة الجانبية"
          >
            {sidebarCollapsed ? (
              <PanelRight className="h-5 w-5" />
            ) : (
              <PanelRightClose className="h-5 w-5" />
            )}
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-foreground sm:text-xl">
              {title}
            </h2>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Left side (RTL): search + theme + notifications + user */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleCommandPalette}
            className="flex h-10 min-w-[140px] items-center gap-2 rounded-xl border border-input bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:border-primary-200 hover:bg-card sm:min-w-[240px]"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">بحث سريع...</span>
            <kbd className="mr-auto hidden rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] sm:inline-block">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={toggleTheme}
            className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title={
              theme === "light"
                ? "تفعيل الوضع الداكن"
                : "تفعيل الوضع الفاتح"
            }
            aria-label="تبديل الثيم"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>

          <button
            className="relative rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="الإشعارات"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-secondary-500 ring-2 ring-card" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-accent sm:pl-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {initials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold leading-tight text-foreground">
                    {displayName}
                  </p>
                  <p className="text-xs text-muted-foreground">مدير النظام</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>
                <p className="font-semibold text-foreground">{displayName}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
