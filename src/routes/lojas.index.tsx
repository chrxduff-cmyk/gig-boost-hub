import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Store, MapPin, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { StarsDisplay } from "@/components/StarRating";

export const Route = createFileRoute("/lojas/")({
  head: () => ({
    meta: [
      { title: "Lojas & Expositores — ONESTAGE" },
      { name: "description", content: "Encontre lojas e expositores parceiros da cena musical, avaliados pela comunidade." },
    ],
  }),
  component: LojasPage,
});

function LojasPage() {
  const { data } = useQuery({
    queryKey: ["lojas-list"],
    queryFn: async () => {
      const [{ data: lojas }, { data: avals }] = await Promise.all([
        supabase.from("lojas").select("id, nome, cidade, estado, foto, categoria").in("status", ["ativa", "ativo"]).order("nome"),
        supabase.from("avaliacoes_loja").select("loja_id, atendimento, variedade, preco"),
      ]);
      const stats = new Map<string, { sum: number; n: number }>();
      (avals ?? []).forEach((a: any) => {
        const s = stats.get(a.loja_id) ?? { sum: 0, n: 0 };
        s.sum += (a.atendimento + a.variedade + a.preco) / 3;
        s.n += 1;
        stats.set(a.loja_id, s);
      });
      return (lojas ?? []).map((l) => {
        const s = stats.get(l.id);
        return { ...l, media: s ? s.sum / s.n : 0, total: s?.n ?? 0 };
      });
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Onde comprar</p>
          <h1 className="display text-4xl">Lojas & Expositores</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Instrumentos, equipamentos, vestuário e expositores. Avalie atendimento, variedade e preço.
          </p>
        </div>
        <Button asChild className="bg-fire shadow-glow">
          <Link to="/lojas/cadastrar"><Plus className="mr-2 h-4 w-4" /> Cadastrar</Link>
        </Button>
      </div>

      {!data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Nenhuma loja cadastrada ainda. Seja o primeiro!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((l) => (
            <Link
              key={l.id}
              to="/lojas/$id"
              params={{ id: l.id }}
              className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-gold/50 hover:shadow-glow"
            >
              <div className="aspect-video overflow-hidden bg-secondary">
                {l.foto ? (
                  <img src={l.foto} alt={l.nome} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Store className="h-12 w-12 text-muted-foreground/40" /></div>
                )}
              </div>
              <div className="p-5">
                <h3 className="display text-xl group-hover:text-gold">{l.nome}</h3>
                {l.categoria && <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{l.categoria}</p>}
                {(l.cidade || l.estado) && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {[l.cidade, l.estado].filter(Boolean).join(" — ")}
                  </p>
                )}
                <div className="mt-3"><StarsDisplay value={l.media} count={l.total} /></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
