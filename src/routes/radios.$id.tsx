import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Radio, ExternalLink, Trash2, Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating, StarsDisplay } from "@/components/StarRating";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/radios/$id")({
  component: RadioPage,
});

function RadioPage() {
  const { id } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: r } = useQuery({
    queryKey: ["radio", id],
    queryFn: async () => {
      const { data } = await supabase.from("radios").select("*").eq("id", id).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: avals } = useQuery({
    queryKey: ["radio-avals", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("avaliacoes_radio")
        .select("id, estrelas, comentario, created_at, user_id")
        .eq("radio_id", id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const minha = avals?.find((a) => a.user_id === user?.id);
  const media = avals && avals.length ? avals.reduce((s, a) => s + a.estrelas, 0) / avals.length : 0;

  const [stars, setStars] = useState(0);
  const [coment, setComent] = useState("");
  const [busy, setBusy] = useState(false);

  async function avaliar() {
    if (!user) { toast.error("Entre para avaliar."); return; }
    if (stars < 1) { toast.error("Escolha de 1 a 5 estrelas."); return; }
    setBusy(true);
    const { error } = await supabase.from("avaliacoes_radio").upsert(
      { radio_id: id, user_id: user.id, estrelas: stars, comentario: coment.trim() || null },
      { onConflict: "radio_id,user_id" },
    );
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Avaliação enviada!");
    setStars(0); setComent("");
    qc.invalidateQueries({ queryKey: ["radio-avals", id] });
  }

  async function excluir() {
    const { error } = await supabase.from("radios").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Rádio excluída.");
    window.location.href = "/radios";
  }

  async function reivindicar() {
    if (!user) { toast.error("Entre para reivindicar."); return; }
    const { error } = await supabase.from("reivindicacoes").insert({
      entity_type: "radio", entity_id: id, user_id: user.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Reivindicação enviada.");
  }

  if (!r) return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;
  const podeEditar = isAdmin || r.owner_id === user?.id || (r.owner_id === null && r.created_by === user?.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-start gap-6">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-secondary">
          {r.logo ? (
            <img src={r.logo} alt={r.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><Radio className="h-12 w-12 text-muted-foreground/30" /></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="display text-4xl">{r.nome}</h1>
          {(r.cidade || r.estado) && <p className="mt-1 text-muted-foreground">{[r.cidade, r.estado].filter(Boolean).join(" — ")}</p>}
          <div className="mt-3"><StarsDisplay value={media} count={avals?.length ?? 0} size={18} /></div>
        </div>
      </div>

      {r.descricao && <p className="mt-6 leading-relaxed text-muted-foreground">{r.descricao}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        {r.site && (
          <a href={r.site} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold/50">
            <ExternalLink className="h-4 w-4" /> Visitar site
          </a>
        )}
        {r.stream_url && (
          <a href={r.stream_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border border-gold/50 bg-gold/10 px-3 py-2 text-sm text-gold">
            <Radio className="h-4 w-4" /> Ouvir ao vivo
          </a>
        )}
      </div>

      {r.stream_url && (
        <audio controls src={r.stream_url} className="mt-4 w-full" />
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {!podeEditar && user && (
          <Button variant="outline" size="sm" onClick={reivindicar}><Flag className="mr-1 h-4 w-4" /> Reivindicar</Button>
        )}
        {podeEditar && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm"><Trash2 className="mr-1 h-4 w-4" /> Excluir</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir "{r.nome}"?</AlertDialogTitle>
                <AlertDialogDescription>As avaliações também serão removidas.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="mt-12">
        <h2 className="display text-2xl">Avaliações</h2>
        {user ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              {minha ? "Você já avaliou. Envie novamente para atualizar." : "Avalie esta rádio:"}
            </p>
            <div className="mt-3"><StarRating value={stars || minha?.estrelas || 0} onChange={setStars} size={28} /></div>
            <Textarea className="mt-3" rows={3}
              placeholder={minha?.comentario ?? "Comentário (opcional)"}
              value={coment} onChange={(e) => setComent(e.target.value)} maxLength={1000} />
            <div className="mt-3 flex justify-end">
              <Button className="bg-fire" onClick={avaliar} disabled={busy}>Enviar</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <Link to="/auth" className="text-gold underline">Entre</Link> para avaliar.
          </div>
        )}

        {!avals || avals.length === 0 ? (
          <p className="mt-6 text-muted-foreground">Ainda nenhuma avaliação.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {avals.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <StarsDisplay value={a.estrelas} />
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                {a.comentario && <p className="mt-2 text-sm text-muted-foreground">{a.comentario}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
