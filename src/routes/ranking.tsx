import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [{ title: "Ranking Geral — União das Bandas" }] }),
  component: RankingPage,
});

function RankingPage() {
  const { data: ranking, isLoading } = useQuery({
    queryKey: ["ranking-geral"],
    queryFn: async () => {
      const { data: apoios } = await supabase
        .from("apoios")
        .select("banda_id, pontos")
        .eq("status", "aprovado");
      const { data: bandas } = await supabase.from("bandas").select("id, nome, foto, cidade");
      const map = new Map<string, number>();
      (apoios ?? []).forEach((a) => map.set(a.banda_id, (map.get(a.banda_id) ?? 0) + a.pontos));
      return (bandas ?? [])
        .map((b) => ({ ...b, pontos: map.get(b.id) ?? 0 }))
        .sort((a, b) => b.pontos - a.pontos);
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <Trophy className="mx-auto h-10 w-10 text-gold" />
        <h1 className="display mt-3 text-5xl">Ranking Geral</h1>
        <p className="text-muted-foreground">Quem está liderando a cena agora</p>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground">Carregando...</p>
      ) : !ranking || ranking.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          Ainda não há bandas pontuando.
        </div>
      ) : (
        <ul className="space-y-2">
          {ranking.map((b, i) => (
            <li key={b.id}>
              <Link
                to="/bandas/$id"
                params={{ id: b.id }}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-gold/50"
              >
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold display ${
                  i === 0 ? "bg-gold text-gold-foreground" :
                  i === 1 ? "bg-secondary text-foreground" :
                  i === 2 ? "bg-primary/30 text-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {i < 3 ? <Medal className="h-6 w-6" /> : i + 1}
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {b.foto && <img src={b.foto} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate display text-lg">{b.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{b.cidade}</p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="display text-2xl text-gold">{b.pontos}</p>
                  <p className="text-xs uppercase text-muted-foreground">pontos</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
