import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, Trophy, Calendar, ArrowRight, Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "União das Bandas — Ajude a escolher quem sobe ao palco" },
      { name: "description", content: "Apoie bandas independentes via PIX. Cada R$10 vira 1 ponto para sua banda favorita." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: eventos } = useQuery({
    queryKey: ["eventos-proximos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("eventos")
        .select("*")
        .order("data_evento", { ascending: true, nullsFirst: false })
        .limit(3);
      return data ?? [];
    },
  });

  const { data: bandas } = useQuery({
    queryKey: ["bandas-destaque"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bandas")
        .select("*")
        .eq("status", "ativa")
        .order("created_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 20% 30%, oklch(0.55 0.22 25 / 0.5), transparent 50%), radial-gradient(circle at 80% 70%, oklch(0.78 0.16 85 / 0.3), transparent 50%)",
        }} />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs uppercase tracking-widest text-gold">
              <Flame className="h-3 w-3" /> A cena nas mãos do público
            </div>
            <h1 className="display text-5xl font-bold leading-[0.95] sm:text-7xl md:text-8xl">
              Ajude a escolher<br />
              <span className="text-gold glow-text">quem sobe ao palco.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Apoie bandas independentes via PIX. Cada <span className="font-bold text-foreground">R$10</span> apoiados viram <span className="font-bold text-gold">1 ponto</span> de votação para a banda do seu coração.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-fire text-primary-foreground hover:opacity-90 shadow-glow">
                <Link to="/ranking"><Trophy className="mr-2 h-5 w-5" /> Ver Ranking</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gold/40">
                <Link to="/bandas"><Music2 className="mr-2 h-5 w-5" /> Conhecer Bandas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Próximos eventos */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold">Agenda</p>
            <h2 className="display text-4xl font-bold">Próximos Eventos</h2>
          </div>
          <Link to="/eventos" className="hidden text-sm text-muted-foreground hover:text-gold sm:flex sm:items-center sm:gap-1">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {eventos && eventos.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {eventos.map((e) => (
              <Link
                key={e.id}
                to="/eventos/$id"
                params={{ id: e.id }}
                className="group rounded-xl border border-border bg-card p-6 transition hover:border-gold/50 hover:shadow-glow"
              >
                <Calendar className="h-6 w-6 text-gold" />
                <h3 className="display mt-4 text-2xl group-hover:text-gold">{e.nome}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{e.descricao}</p>
                {e.data_evento && (
                  <p className="mt-4 text-xs uppercase tracking-wider text-gold">
                    {new Date(e.data_evento).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Nenhum evento agendado ainda. Volte em breve.
          </div>
        )}
      </section>

      {/* Bandas em destaque */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-gold">No palco</p>
          <h2 className="display text-4xl font-bold">Bandas em Destaque</h2>
        </div>
        {bandas && bandas.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bandas.map((b) => (
              <Link
                key={b.id}
                to="/bandas/$id"
                params={{ id: b.id }}
                className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/50 hover:shadow-glow"
              >
                <div className="aspect-video overflow-hidden bg-secondary">
                  {b.foto ? (
                    <img src={b.foto} alt={b.nome} className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Music2 className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="display text-xl group-hover:text-gold">{b.nome}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{b.cidade}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            Em breve as primeiras bandas cadastradas.
          </div>
        )}
      </section>
    </div>
  );
}
