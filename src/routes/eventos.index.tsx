import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/eventos/")({
  head: () => ({ meta: [{ title: "Eventos — União das Bandas" }] }),
  component: EventosList,
});

function EventosList() {
  const { data } = useQuery({
    queryKey: ["eventos-todos"],
    queryFn: async () => {
      const { data } = await supabase.from("eventos").select("*").order("data_evento", { ascending: true, nullsFirst: false });
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="display text-5xl">Eventos</h1>
      <p className="mt-2 text-muted-foreground">Festivais e shows com votação aberta</p>

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((e) => (
          <Link
            key={e.id}
            to="/eventos/$id"
            params={{ id: e.id }}
            className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-gold/50 hover:shadow-glow"
          >
            {e.banner_url && (
              <div className="aspect-[16/9] overflow-hidden bg-secondary">
                <img src={e.banner_url} alt={e.nome} className="h-full w-full object-cover transition group-hover:scale-105" />
              </div>
            )}
            <div className="p-6">
            <div className="flex items-center justify-between">
              <Calendar className="h-6 w-6 text-gold" />
              <span className={`rounded-full px-2 py-0.5 text-xs uppercase ${e.status === "aberto" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {e.status}
              </span>
            </div>
            <h3 className="display mt-4 text-2xl group-hover:text-gold">{e.nome}</h3>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{e.descricao}</p>
            {e.data_evento && (
              <p className="mt-4 text-xs uppercase tracking-wider text-gold">
                {new Date(e.data_evento).toLocaleDateString("pt-BR", { dateStyle: "long" })}
              </p>
            )}
          </Link>
        ))}
        {data && data.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            Nenhum evento cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}
