import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Radio, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/radios/")({
  head: () => ({
    meta: [
      { title: "Rádios — ONESTAGE" },
      { name: "description", content: "Rádios da cena com avaliações dos ouvintes." },
    ],
  }),
  component: RadiosPage,
});

function RadiosPage() {
  const { data: radios } = useQuery({
    queryKey: ["radios"],
    queryFn: async () => {
      const { data } = await supabase
        .from("radios")
        .select("id, nome, descricao, site, logo, cidade, estado")
        .eq("status", "ativa")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">No ar</p>
          <h1 className="display text-4xl">Rádios</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Cadastre sua rádio e ouça avaliações dos ouvintes da cena.
          </p>
        </div>
        <Button asChild className="bg-fire shadow-glow">
          <Link to="/radios/cadastrar"><Plus className="mr-2 h-4 w-4" /> Cadastrar</Link>
        </Button>
      </div>

      {!radios || radios.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Nenhuma rádio cadastrada ainda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {radios.map((r) => (
            <Link
              key={r.id}
              to="/radios/$id"
              params={{ id: r.id }}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition hover:border-gold/50 hover:shadow-glow"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                {r.logo ? (
                  <img src={r.logo} alt={r.nome} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center"><Radio className="h-8 w-8 text-muted-foreground/40" /></div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="display text-lg group-hover:text-gold">{r.nome}</h3>
                {(r.cidade || r.estado) && <p className="text-xs text-muted-foreground">{[r.cidade, r.estado].filter(Boolean).join(" — ")}</p>}
                {r.descricao && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.descricao}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
