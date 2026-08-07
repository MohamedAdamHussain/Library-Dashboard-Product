import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/ui-store";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { navItems } from "@/lib/routes";

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const navigate = useAppNavigate();

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
    >
      <CommandInput placeholder="اكتب اسم الصفحة أو الأمر..." />
      <CommandList>
        <CommandEmpty>لا توجد نتائج مطابقة</CommandEmpty>
        <CommandGroup heading="التنقل">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.to}
                value={`${item.label} ${item.description}`}
                onSelect={() => {
                  navigate(item.to);
                  setCommandPaletteOpen(false);
                }}
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{item.label}</span>
                <span className="mr-auto text-xs text-muted-foreground">
                  {item.description}
                </span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
