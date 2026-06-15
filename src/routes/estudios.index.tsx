import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Music, MapPin, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/estudios/")({
  head: () => ({
    meta: [
      { title: "Estúdios de Ensaio — ONESTAGE" },
      { name: "description", content: "Encontre estúdios de ensaio com avaliações de estrutura, equipamentos e banheiro." },
    ],
  }),
  component: EstudiosPage,
});

function EstudiosPage() {
  const { data: estudios } = useQuery({
    queryKey: ["estudios"],
    queryFn: async () => {
      const { data } = await supabase
        .from("estudios_ensaio")
        .select("id, nome, cidade, estado, foto, valor_hora, latitude, longitude")
        .eq("status", "ativo")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Onde ensaiar</p>
          <h1 className="display text-4xl">Estúdios de Ensaio</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Avalie estrutura, equipamentos e banheiro de cada estúdio. Cadastre o seu e ajude a cena.
          </p>
        </div>
        <Button asChild className="bg-fire shadow-glow">
          <Link to="/estudios/cadastrar"><Plus className="mr-2 h-4 w-4" /> Cadastrar</Link>
        </Button>
      </div>

      {!estudios || estudios.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Nenhum estúdio cadastrado ainda. Seja o primeiro!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {estudios.map((s) => (
            <Link
              key={s.id}
              to="/estudios/$id"
              params={{ id: s.id }}
              className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-gold/50 hover:shadow-glow"
            >
              <div className="aspect-video overflow-hidden bg-secondary">
                {s.foto ? (
                  <img src={s.foto} alt={s.nome} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Music className="h-12 w-12 text-muted-foreground/40" /></div>
                )}
              </div>
              <div className="p-5">
                <h3 className="display text-xl group-hover:text-gold">{s.nome}</h3>
                {(s.cidade || s.estado) && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {[s.cidade, s.estado].filter(Boolean).join(" — ")}
                  </p>
                )}
                {s.valor_hora != null && (
                  <p className="mt-2 text-sm">
                    <span className="text-gold font-semibold">R$ {Number(s.valor_hora).toFixed(2)}</span>
                    <span className="text-muted-foreground"> / hora</span>
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
