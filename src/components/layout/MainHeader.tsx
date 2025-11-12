import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface MainHeaderProps {
  children?: React.ReactNode;
}

export function MainHeader({ children }: MainHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <SidebarTrigger className="h-8 w-8" />
      <Separator orientation="vertical" className="h-6" />
      {children}
    </header>
  );
}
