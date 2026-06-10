import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, Youtube, Music2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/bandas/$id")({
  component: BandaPage,
});

function BandaPage() {
  const { id } = Route.useParams();

  const { data: banda } = useQuery({
    queryKey: ["banda", id],
    queryFn: async () => {
      const { data } = await supabase.from("bandas").select("*").eq("id", id).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: pontos } = useQuery({
    queryKey: ["banda-pontos", id],
    queryFn: async () => {
      const { data } = await supabase.from("apoios").select("pontos").eq("banda_id", id).eq("status", "aprovado");
      return (data ?? []).reduce((s, a) => s + a.pontos, 0);
    },
  });

  const { data: apoios } = useQuery({
    queryKey: ["banda-historico", id],
    queryFn: async () => {
      const { data } = await supabase.from("apoios")
        .select("nome_apoiador, valor, pontos, status, created_at")
        .eq("banda_id", id)
        .eq("status", "aprovado")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  if (!banda) return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
          {banda.foto ? (
            <img src={banda.foto} alt={banda.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><Music2 className="h-24 w-24 text-muted-foreground/30" /></div>
          )}
        </div>
        <div>
          <h1 className="display text-5xl">{banda.nome}</h1>
          {banda.cidade && (
            <p className="mt-2 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {banda.cidade}
            </p>
          )}
          <div className="mt-6 inline-block rounded-xl border border-gold/40 bg-gold/10 px-5 py-3">
            <p className="text-xs uppercase tracking-widest text-gold">Pontuação atual</p>
            <p className="display text-4xl text-gold">{pontos ?? 0}</p>
          </div>
          {banda.release && <p className="mt-6 leading-relaxed text-muted-foreground">{banda.release}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            {banda.instagram && (
              <a href={banda.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold/50">
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            )}
            {banda.youtube && (
              <a href={banda.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold/50">
                <Youtube className="h-4 w-4" /> YouTube
              </a>
            )}
            {banda.spotify && (
              <a href={banda.spotify} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold/50">
                <Music2 className="h-4 w-4" /> Spotify
              </a>
            )}
          </div>

          <Button asChild size="lg" className="mt-8 w-full bg-fire shadow-glow sm:w-auto">
            <Link to="/apoiar/$bandaId" params={{ bandaId: banda.id }}>
              Apoiar esta banda
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="display text-2xl">Histórico de apoios</h2>
        {!apoios || apoios.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Nenhum apoio aprovado ainda.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
            {apoios.map((a, i) => (
              <li key={i} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{a.nome_apoiador}</p>
                  <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">R$ {Number(a.valor).toFixed(2)}</p>
                  <p className="text-xs text-gold">+{a.pontos} pts</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
