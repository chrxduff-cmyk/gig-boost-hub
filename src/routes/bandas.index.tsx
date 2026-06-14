import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/bandas/")({
  head: () => ({ meta: [{ title: "Bandas — União das Bandas" }] }),
  component: BandasList,
});

function BandaCard({ b }: { b: any }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function play() {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.volume = 0.8;
    a.play().catch(() => {});
  }
  function stop() {
    const a = audioRef.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
  }

  return (
    <Link
      to="/bandas/$id"
      params={{ id: b.id }}
      className="group overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/50 hover:shadow-glow"
      onMouseEnter={play}
      onMouseLeave={stop}
      onTouchStart={play}
      onTouchEnd={stop}
    >
      <div className="relative aspect-video overflow-hidden bg-secondary">
        {b.foto ? (
          <img src={b.foto} alt={b.nome} className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center"><Music2 className="h-12 w-12 text-muted-foreground/40" /></div>
        )}
        {b.musica && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-[10px] uppercase tracking-wider text-gold opacity-0 transition group-hover:opacity-100">
            ♪ tocando
          </span>
        )}
      </div>
      <div className="p-5">
        <h3 className="display text-xl group-hover:text-gold">{b.nome}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{b.cidade}</p>
      </div>
      {b.musica && <audio key={b.musica} ref={audioRef} src={b.musica} preload="none" />}
    </Link>
  );
}

function BandasList() {
  const { data } = useQuery({
    queryKey: ["bandas-all"],
    queryFn: async () => {
      const { data } = await supabase.from("bandas").select("*").eq("status", "ativa").order("nome");
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="display text-5xl">Bandas</h1>
      <p className="mt-2 text-muted-foreground">Conheça as bandas independentes da plataforma</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((b) => <BandaCard key={b.id} b={b} />)}
        {data && data.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center text-muted-foreground">
            Nenhuma banda cadastrada ainda.
          </div>
        )}
      </div>
    </div>
  );
}
