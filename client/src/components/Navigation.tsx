import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function Navigation() {
  const [location] = useLocation();

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
            <NavLink href="/downloads">Downloads</NavLink>
            <NavLink href="/music">Music</NavLink>
            <NavLink href="/about">About</NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}