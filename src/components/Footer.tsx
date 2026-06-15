import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/40 mt-20">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            <span className="display text-lg tracking-wider"><span className="text-gold">ONESTAGE</span></span>
          </div>
          <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link to="/termos" className="hover:text-gold">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-gold">Privacidade</Link>
            <Link to="/eventos" className="hover:text-gold">Eventos</Link>
            <Link to="/bandas" className="hover:text-gold">Bandas</Link>
            <Link to="/estudios" className="hover:text-gold">Estúdios</Link>
            <Link to="/radios" className="hover:text-gold">Rádios</Link>
          </nav>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} ONESTAGE — One Platform. Every Connection.
        </p>
      </div>
    </footer>
  );
}
