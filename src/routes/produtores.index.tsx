import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MapPin, Search, UserCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { StarsDisplay } from "@/components/StarRating";

export const Route = createFileRoute("/produtores/")({
  head: () => ({
    meta: [
      { title: "Produtores — União das Bandas" },
      { name: "description", content: "Conheça e avalie os produtores responsáveis pelos eventos." },
      { property: "og:title", content: "Produtores — União das Bandas" },
      { property: "og:description", content: "Conheça e avalie os produtores responsáveis pelos eventos." },
    ],
  }),
  component: ProdutoresPage,
});

type ProdutorRow = {
  id: string;
  nome: string;
  cidade: string | null;
  foto: string | null;
  bio: string | null;
};

function ProdutoresPage() {
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["produtores-list"],
    queryFn: async () => {
      const [{ data: prods }, { data: avals }] = await Promise.all([
        supabase.from("produtores").select("id, nome, cidade, foto, bio").eq("status", "ativo").order("nome"),
        supabase.from("avaliacoes_produtor").select("produtor_id, estrelas"),
      ]);
      const stats = new Map<string, { sum: number; n: number }>();
      (avals ?? []).forEach((a) => {
        const s = stats.get(a.produtor_id) ?? { sum: 0, n: 0 };
        s.sum += a.estrelas;
        s.n += 1;
        stats.set(a.produtor_id, s);
      });
      return (prods ?? []).map((p) => {
        const s = stats.get(p.id);
        return { ...(p as ProdutorRow), media: s ? s.sum / s.n : 0, total: s?.n ?? 0 };
      });
    },
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (!q.trim()) return list;
    const t = q.trim().toLowerCase();
    return list.filter((p) => p.nome.toLowerCase().includes(t) || (p.cidade ?? "").toLowerCase().includes(t));
  }, [data, q]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-4xl">Produtores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Avalie quem faz o evento acontecer. Apenas quem apoiou um evento do produtor pode dar estrelas.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou cidade"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-10 text-center text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 text-center text-muted-foreground">Nenhum produtor encontrado.</div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to="/produtores/$id"
              params={{ id: p.id }}
              className="group flex gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-gold"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-secondary">
                {p.foto ? (
                  <img src={p.foto} alt={p.nome} className="h-full w-full object-cover" />
                ) : (
                  <UserCircle2 className="h-full w-full text-muted-foreground/40" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="display truncate text-lg group-hover:text-gold">{p.nome}</p>
                {p.cidade && (
                  <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {p.cidade}
                  </p>
                )}
                <div className="mt-2">
                  <StarsDisplay value={p.media} count={p.total} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
