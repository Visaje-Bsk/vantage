import { SidebarTrigger } from "@/components/ui/sidebar";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, description, actions, children }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur shadow-sm supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center gap-4 p-4 md:p-6">
        <SidebarTrigger className="md:hidden" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
