import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Calendar, Trophy, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/eventos/$id")({
  component: EventoPage,
});

function useCountdown(target?: string | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (diff <= 0) return "Encerrado";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

function EventoPage() {
  const { id } = Route.useParams();

  const { data: evento } = useQuery({
    queryKey: ["evento", id],
    queryFn: async () => {
      const { data } = await supabase.from("eventos").select("*").eq("id", id).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: ranking, refetch } = useQuery({
    queryKey: ["evento-ranking", id],
    queryFn: async () => {
      const { data: pe } = await supabase
        .from("participacao_evento")
        .select("banda_id, pontos, bandas(id, nome, foto, cidade)")
        .eq("evento_id", id)
        .order("pontos", { ascending: false });
      return pe ?? [];
    },
  });

  // realtime
  useEffect(() => {
    const ch = supabase
      .channel(`evento-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "participacao_evento", filter: `evento_id=eq.${id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, refetch]);

  const countdown = useCountdown(evento?.data_fim_votacao);

  if (!evento) return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl bg-hero p-8 sm:p-12">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
          <Calendar className="h-4 w-4" /> Evento
        </div>
        <h1 className="display mt-2 text-4xl sm:text-6xl">{evento.nome}</h1>
        {evento.descricao && <p className="mt-4 max-w-2xl text-muted-foreground">{evento.descricao}</p>}
        {evento.data_evento && (
          <p className="mt-4 text-sm text-gold">
            {new Date(evento.data_evento).toLocaleDateString("pt-BR", { dateStyle: "full" })}
          </p>
        )}
        {countdown && (
          <div className="mt-6 inline-block rounded-lg border border-gold/40 bg-background/40 px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Votação encerra em</p>
            <p className="display text-3xl text-gold">{countdown}</p>
          </div>
        )}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-gold" />
          <h2 className="display text-3xl">Ranking em tempo real</h2>
        </div>
        {!ranking || ranking.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            Nenhuma banda pontuou ainda. Seja o primeiro a apoiar!
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full">
              <thead className="bg-card text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Posição</th>
                  <th className="px-4 py-3 text-left">Banda</th>
                  <th className="px-4 py-3 text-right">Pontos</th>
                  <th className="px-4 py-3 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => {
                  const b: any = r.bandas;
                  return (
                    <tr key={r.banda_id} className="border-t border-border bg-card/40">
                      <td className="px-4 py-3">
                        {i < 3 ? <Medal className={`h-5 w-5 ${i === 0 ? "text-gold" : i === 1 ? "text-muted-foreground" : "text-primary"}`} /> : <span className="font-bold">{i + 1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link to="/bandas/$id" params={{ id: b?.id }} className="display text-lg hover:text-gold">
                          {b?.nome}
                        </Link>
                        <p className="text-xs text-muted-foreground">{b?.cidade}</p>
                      </td>
                      <td className="px-4 py-3 text-right display text-xl text-gold">{r.pontos}</td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild size="sm" className="bg-fire">
                          <Link to="/apoiar/$bandaId" params={{ bandaId: b?.id }} search={{ evento: id }}>Apoiar</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
