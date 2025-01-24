import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authStatus } = useQuery<{ isAuthenticated: boolean }>({
    queryKey: ["/api/music/auth-status"],
  });

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/music/logout", {
        method: "POST",
      });

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/music/auth-status"] });
        toast({
          title: "Success",
          description: "Logged out successfully",
        });
        window.location.href = '/';
      } else {
        throw new Error("Logout failed");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout",
      });
    }
  };

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href}>
      <a
        className={cn(
          "px-4 py-2 rounded-md text-sm font-medium transition-colors",
          location === href
            ? "bg-primary text-primary-foreground"
            : "hover:bg-primary/10"
        )}
      >
        {children}
      </a>
    </Link>
  );

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <a className="text-xl font-bold">FileShare</a>
          </Link>
          <div className="flex items-center space-x-2">
            <NavLink href="/">Upload</NavLink>
            {authStatus?.isAuthenticated && (
              <>
                <NavLink href="/downloads">Downloads</NavLink>
                <NavLink href="/notes">Notes</NavLink>
                <NavLink href="/music">Music</NavLink>
              </>
            )}
            {!authStatus?.isAuthenticated && (
              <NavLink href="/login">Login</NavLink>
            )}
            <NavLink href="/about">About</NavLink>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          {authStatus?.isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}