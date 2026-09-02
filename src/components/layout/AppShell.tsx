import { Link } from "@tanstack/react-router";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, type ReactNode } from "react";

import { RumoLogo } from "@/components/brand/RumoLogo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { mobileNavItems, navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex min-h-screen bg-background">
        {/* Sidebar — desktop */}
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex",
            collapsed ? "w-[76px]" : "w-64",
          )}
        >
          <div className="flex h-16 items-center px-4">
            <Link to="/today" className="min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
              <RumoLogo compact={collapsed} className="text-sidebar-foreground" />
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-2">
            {navItems.map(({ to, label, icon: Icon }) => {
              const link = (
                <Link
                  key={to}
                  to={to}
                  activeProps={{
                    className:
                      "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-sidebar-primary",
                  }}
                  inactiveProps={{ className: "text-sidebar-foreground/75 border-l-2 border-transparent" }}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {collapsed && <span className="sr-only">{label}</span>}
                </Link>
              );

              return collapsed ? (
                <Tooltip key={to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            {!collapsed && (
              <p className="px-2 pb-3 text-[11px] leading-relaxed text-sidebar-foreground/60">
                Powered by Método BÚSSOLA™
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((v) => !v)}
              className="w-full justify-center text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" aria-hidden />
              ) : (
                <PanelLeftClose className="size-4" aria-hidden />
              )}
              <span className={cn(collapsed && "sr-only")}>Recolher</span>
            </Button>
          </div>
        </aside>

        {/* Conteúdo */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
            <Link to="/today" className="min-w-0">
              <RumoLogo />
            </Link>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-10">
            {children}
          </main>
        </div>

        {/* Navegação inferior — celular */}
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
          <ul className="mx-auto grid max-w-md grid-cols-4">
            {mobileNavItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  activeProps={{ className: "text-foreground" }}
                  inactiveProps={{ className: "text-muted-foreground" }}
                  className="flex flex-col items-center gap-1 px-1 py-2.5 text-[11px]"
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={cn("size-5", isActive && "text-gold")} aria-hidden />
                      <span className="truncate">{label === "Revisão semanal" ? "Revisão" : label}</span>
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </TooltipProvider>
  );
}
