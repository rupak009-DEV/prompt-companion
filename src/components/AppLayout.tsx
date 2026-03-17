import { Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileDropdown } from "@/components/ProfileDropdown";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-11 sm:h-12 flex items-center justify-between border-b px-3 sm:px-4 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="ml-0" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2 sm:px-3">
                  <Home className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
              <ThemeToggle />
              <ProfileDropdown />
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
          <footer className="border-t px-4 sm:px-6 py-3 sm:py-4 bg-card/30">
            <div className="max-w-6xl mx-auto flex flex-col items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <span>© 2026 Prompt Engineer AI. All rights reserved.</span>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="hover:text-foreground transition-colors">Contact</a>
                <span className="hover:text-foreground transition-colors cursor-pointer">Submit Suggestion</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
