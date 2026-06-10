import { Link, useNavigate } from "@tanstack/react-router";
import { Flame, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, isAdmin, isBanda, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: "/", label: "Início" },
    { to: "/eventos", label: "Eventos" },
    { to: "/bandas", label: "Bandas" },
    { to: "/ranking", label: "Ranking" },
  ];

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Flame className="h-6 w-6 text-primary" />
          <span className="display text-xl font-bold tracking-wider">
            UNIÃO DAS <span className="text-gold">BANDAS</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-muted-foreground transition hover:text-gold"
              activeProps={{ className: "text-gold" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">Admin</Link>
            </Button>
          )}
          {isBanda && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/minha-banda">Minha Banda</Link>
            </Button>
          )}
          {user ? (
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1 h-4 w-4" /> Sair
            </Button>
          ) : (
            <Button asChild size="sm" className="bg-fire text-primary-foreground hover:opacity-90">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
        </div>

        <button
          className="md:hidden"
          aria-label="Menu"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="flex flex-col p-4">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="py-2 text-sm font-medium"
              >
                {l.label}
              </Link>
            ))}
            {isAdmin && <Link to="/admin" onClick={() => setOpen(false)} className="py-2 text-sm">Admin</Link>}
            {isBanda && <Link to="/minha-banda" onClick={() => setOpen(false)} className="py-2 text-sm">Minha Banda</Link>}
            {user ? (
              <button onClick={handleSignOut} className="py-2 text-left text-sm">Sair</button>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="py-2 text-sm text-gold">Entrar</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
