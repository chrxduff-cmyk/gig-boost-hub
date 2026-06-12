import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Instagram, Link as LinkIcon, MapPin, MessageSquare, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating, StarsDisplay } from "@/components/StarRating";

export const Route = createFileRoute("/produtores/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Produtor — União das Bandas` }, { name: "description", content: `Perfil do produtor ${params.id}` }],
  }),
  component: ProdutorPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="p-12 text-center">
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button className="mt-4" onClick={() => { router.invalidate(); reset(); }}>Tentar novamente</Button>
      </div>
    );
  },
  notFoundComponent: () => <div className="p-12 text-center">Produtor não encontrado.</div>,
});

function ProdutorPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["produtor", id],
    queryFn: async () => {
      const { data: p, error } = await supabase.from("produtores").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      const { data: avals } = await supabase
        .from("avaliacoes_produtor")
        .select("id, estrelas, comentario, created_at, user_id, evento_id, eventos(nome)")
        .eq("produtor_id", id)
        .order("created_at", { ascending: false });
      const { data: eventos } = await supabase
        .from("eventos")
        .select("id, nome, data_evento")
        .eq("produtor_id", id)
        .order("data_evento", { ascending: false });
      return { produtor: p, avaliacoes: avals ?? [], eventos: eventos ?? [] };
    },
  });

  // Quais eventos do produtor o usuário pode avaliar?
  const { data: eligibilidade } = useQuery({
    queryKey: ["produtor-elegivel", id, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: eventos } = await supabase
        .from("eventos")
        .select("id, nome, data_evento")
        .eq("produtor_id", id);
      const passados = (eventos ?? []).filter((e) => !e.data_evento || new Date(e.data_evento) < new Date());
      if (passados.length === 0) return [];
      const { data: apoios } = await supabase
        .from("apoios")
        .select("evento_id")
        .eq("status", "aprovado")
        .eq("user_id", user!.id)
        .in("evento_id", passados.map((e) => e.id));
      const idsApoiados = new Set((apoios ?? []).map((a) => a.evento_id));

      const { data: jaAvaliou } = await supabase
        .from("avaliacoes_produtor")
        .select("evento_id")
        .eq("produtor_id", id)
        .eq("user_id", user!.id);
      const jaSet = new Set((jaAvaliou ?? []).map((a) => a.evento_id));
      return passados.filter((e) => idsApoiados.has(e.id) && !jaSet.has(e.id));
    },
  });

  const media = useMemo(() => {
    const list = data?.avaliacoes ?? [];
    if (!list.length) return { value: 0, n: 0 };
    return { value: list.reduce((s, a) => s + a.estrelas, 0) / list.length, n: list.length };
  }, [data]);

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;
  if (!data?.produtor) return <div className="p-12 text-center text-muted-foreground">Produtor não encontrado.</div>;
  const p = data.produtor;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full bg-secondary">
          {p.foto ? (
            <img src={p.foto} alt={p.nome} className="h-full w-full object-cover" />
          ) : (
            <UserCircle2 className="h-full w-full text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="display text-4xl">{p.nome}</h1>
          {p.cidade && (
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {p.cidade}
            </p>
          )}
          <div className="mt-3">
            <StarsDisplay value={media.value} count={media.n} size={18} />
          </div>
          {p.bio && <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">{p.bio}</p>}
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {p.instagram && (
              <a href={p.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            )}
            {p.site && (
              <a href={p.site} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-gold hover:underline">
                <LinkIcon className="h-4 w-4" /> Site
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Eventos do produtor */}
      {data.eventos.length > 0 && (
        <section className="mt-10">
          <h2 className="display text-2xl">Eventos</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {data.eventos.map((e) => (
              <Link
                key={e.id}
                to="/eventos/$id"
                params={{ id: e.id }}
                className="rounded-lg border border-border bg-card p-3 transition hover:border-gold"
              >
                <p className="font-medium">{e.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {e.data_evento ? new Date(e.data_evento).toLocaleDateString("pt-BR") : "Sem data"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Avaliar */}
      <section className="mt-10">
        <h2 className="display text-2xl">Deixe sua avaliação</h2>
        {!user ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link to="/auth" className="text-gold hover:underline">Entre</Link> para avaliar este produtor.
          </p>
        ) : (eligibilidade ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Apenas quem apoiou um evento já realizado deste produtor pode avaliar.
          </p>
        ) : (
          <NovaAvaliacao
            produtorId={id}
            eventos={eligibilidade!}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ["produtor", id] });
              qc.invalidateQueries({ queryKey: ["produtor-elegivel", id, user.id] });
            }}
          />
        )}
      </section>

      {/* Lista de avaliações */}
      <section className="mt-10">
        <h2 className="display text-2xl">Avaliações</h2>
        {data.avaliacoes.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Ainda não há avaliações.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.avaliacoes.map((a: any) => (
              <li key={a.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <StarsDisplay value={a.estrelas} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("pt-BR")}
                    {a.eventos?.nome ? ` · ${a.eventos.nome}` : ""}
                  </span>
                </div>
                {a.comentario && (
                  <p className="mt-2 flex gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" /> {a.comentario}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function NovaAvaliacao({
  produtorId,
  eventos,
  onSaved,
}: {
  produtorId: string;
  eventos: { id: string; nome: string }[];
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [eventoId, setEventoId] = useState(eventos[0]?.id ?? "");
  const [estrelas, setEstrelas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);

  async function salvar() {
    if (estrelas < 1) return toast.error("Escolha de 1 a 5 estrelas.");
    if (!eventoId) return toast.error("Selecione o evento.");
    if (comentario.length > 500) return toast.error("Comentário muito longo.");
    setSaving(true);
    const { error } = await supabase.from("avaliacoes_produtor").insert({
      produtor_id: produtorId,
      evento_id: eventoId,
      user_id: user!.id,
      estrelas,
      comentario: comentario.trim() || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Avaliação enviada!");
    setEstrelas(0);
    setComentario("");
    onSaved();
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <label className="text-sm font-medium">Evento</label>
        <select
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={eventoId}
          onChange={(e) => setEventoId(e.target.value)}
        >
          {eventos.map((e) => (
            <option key={e.id} value={e.id}>{e.nome}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium">Sua nota</label>
        <div className="mt-1"><StarRating value={estrelas} onChange={setEstrelas} size={32} /></div>
      </div>
      <div>
        <label className="text-sm font-medium">Comentário (opcional)</label>
        <Textarea
          rows={3}
          value={comentario}
          maxLength={500}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Como foi sua experiência?"
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{comentario.length}/500</p>
      </div>
      <Button className="bg-fire" onClick={salvar} disabled={saving}>
        {saving ? "Enviando..." : "Enviar avaliação"}
      </Button>
    </div>
  );
}
