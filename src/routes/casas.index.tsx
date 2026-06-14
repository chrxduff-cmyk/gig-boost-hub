import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Plus, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StarsDisplay } from "@/components/StarRating";

export const Route = createFileRoute("/casas/")({
  head: () => ({
    meta: [
      { title: "Casas de Shows — União das Bandas" },
      { name: "description", content: "Conheça e avalie casas de shows e espaços para eventos." },
      { property: "og:title", content: "Casas de Shows — União das Bandas" },
      { property: "og:description", content: "Casas, bares e espaços que recebem bandas independentes." },
    ],
  }),
  component: CasasList,
});

function CasasList() {
  const { data, isLoading } = useQuery({
    queryKey: ["casas-list"],
    queryFn: async () => {
      const [{ data: casas }, { data: avals }] = await Promise.all([
        supabase.from("casas_shows").select("*").eq("status", "ativa").order("nome"),
        supabase.from("avaliacoes_casa").select("casa_id, estrelas"),
      ]);
      const stats = new Map<string, { sum: number; n: number }>();
      (avals ?? []).forEach((a) => {
        const s = stats.get(a.casa_id) ?? { sum: 0, n: 0 };
        s.sum += a.estrelas;
        s.n += 1;
        stats.set(a.casa_id, s);
      });
      return (casas ?? []).map((c) => {
        const s = stats.get(c.id);
        return { ...c, media: s ? s.sum / s.n : 0, total: s?.n ?? 0 };
      });
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-5xl">Casas de Shows</h1>
          <p className="mt-2 text-muted-foreground">
            Espaços que recebem bandas independentes. Avalie as casas em que você já tocou ou foi assistir.
          </p>
        </div>
        <Button asChild className="bg-fire shadow-glow">
          <Link to="/casas/cadastrar"><Plus className="mr-2 h-4 w-4" /> Cadastrar casa</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-12 text-center text-muted-foreground">Carregando...</div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Nenhuma casa cadastrada ainda. Seja o primeiro!
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.map((c) => (
            <Link
              key={c.id}
              to="/casas/$id"
              params={{ id: c.id }}
              className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/60 hover:shadow-glow"
            >
              <div className="relative aspect-video overflow-hidden bg-secondary">
                {c.foto ? (
                  <img src={c.foto} alt={c.nome} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Building2 className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="display text-xl group-hover:text-gold">{c.nome}</h3>
                {(c.cidade || c.estado) && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {[c.cidade, c.estado].filter(Boolean).join(" — ")}
                  </p>
                )}
                <div className="mt-3"><StarsDisplay value={c.media} count={c.total} /></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
