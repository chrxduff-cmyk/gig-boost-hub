import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Music, ExternalLink, Instagram, MapPin, Phone, Trash2, Flag } from "lucide-react";
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

export const Route = createFileRoute("/estudios/$id")({
  component: EstudioPage,
});

function EstudioPage() {
  const { id } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: e } = useQuery({
    queryKey: ["estudio", id],
    queryFn: async () => {
      const { data } = await supabase.from("estudios_ensaio").select("*").eq("id", id).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: avals } = useQuery({
    queryKey: ["estudio-avals", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("avaliacoes_estudio")
        .select("id, estrutura, equipamentos, comentario, created_at, user_id")
        .eq("estudio_id", id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const minha = avals?.find((a) => a.user_id === user?.id);
  const n = avals?.length ?? 0;
  const med = (k: "estrutura" | "equipamentos") =>
    n ? avals!.reduce((s, a) => s + (a as any)[k], 0) / n : 0;
  const geral = n ? (med("estrutura") + med("equipamentos")) / 2 : 0;

  const [estrutura, setEstrutura] = useState(0);
  const [equipamentos, setEquipamentos] = useState(0);
  const [coment, setComent] = useState("");
  const [busy, setBusy] = useState(false);

  async function avaliar() {
    if (!user) { toast.error("Entre para avaliar."); return; }
    if (estrutura < 1 || equipamentos < 1) {
      toast.error("Avalie estrutura e equipamentos (1 a 5).");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("avaliacoes_estudio").upsert(
      { estudio_id: id, user_id: user.id, estrutura, equipamentos, comentario: coment.trim() || null },
      { onConflict: "estudio_id,user_id" },
    );
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Avaliação enviada!");
    setEstrutura(0); setEquipamentos(0); setComent("");
    qc.invalidateQueries({ queryKey: ["estudio-avals", id] });
  }

  async function excluir() {
    const { error } = await supabase.from("estudios_ensaio").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Estúdio excluído.");
    window.location.href = "/estudios";
  }

  async function reivindicar() {
    if (!user) { toast.error("Entre para reivindicar."); return; }
    const { error } = await supabase.from("reivindicacoes").insert({
      entity_type: "estudio", entity_id: id, user_id: user.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Reivindicação enviada. Um admin irá avaliar.");
  }

  if (!e) return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;
  const podeEditar = isAdmin || e.owner_id === user?.id || (e.owner_id === null && e.created_by === user?.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
          {e.foto ? (
            <img src={e.foto} alt={e.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><Music className="h-24 w-24 text-muted-foreground/30" /></div>
          )}
        </div>
        <div>
          <h1 className="display text-5xl">{e.nome}</h1>
          {(e.cidade || e.estado) && (
            <p className="mt-2 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {[e.cidade, e.estado].filter(Boolean).join(" — ")}
            </p>
          )}
          {e.valor_hora != null && (
            <p className="mt-3 display text-3xl text-gold">R$ {Number(e.valor_hora).toFixed(2)}<span className="text-base text-muted-foreground"> / hora</span></p>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Geral</p>
              <StarsDisplay value={geral} count={n} size={18} />
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
              <div className="flex justify-between">Estrutura<StarsDisplay value={med("estrutura")} size={12} /></div>
              <div className="flex justify-between">Equipamentos<StarsDisplay value={med("equipamentos")} size={12} /></div>
            </div>
          </div>

          {e.descricao && <p className="mt-6 leading-relaxed text-muted-foreground">{e.descricao}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            {e.endereco && <span className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">{e.endereco}</span>}
            {e.telefone && (
              <a href={`tel:${e.telefone}`} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold/50">
                <Phone className="h-4 w-4" /> {e.telefone}
              </a>
            )}
            {e.instagram && (
              <a href={e.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold/50">
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            )}
            {e.site && (
              <a href={e.site} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold/50">
                <ExternalLink className="h-4 w-4" /> Site
              </a>
            )}
            {e.latitude && e.longitude && (
              <a href={`https://www.google.com/maps?q=${e.latitude},${e.longitude}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md border border-gold/50 bg-gold/10 px-3 py-2 text-sm text-gold">
                <MapPin className="h-4 w-4" /> Ver no mapa
              </a>
            )}
          </div>

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
                    <AlertDialogTitle>Excluir "{e.nome}"?</AlertDialogTitle>
                    <AlertDialogDescription>Todas as avaliações serão removidas. Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="display text-2xl">Avaliações</h2>

        {user ? (
          <div className="mt-4 rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              {minha ? "Você já avaliou. Envie novamente para atualizar." : "Compartilhe sua experiência:"}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Estrutura</p>
                <StarRating value={estrutura || minha?.estrutura || 0} onChange={setEstrutura} size={24} />
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Equipamentos</p>
                <StarRating value={equipamentos || minha?.equipamentos || 0} onChange={setEquipamentos} size={24} />
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Banheiro</p>
                <StarRating value={banheiro || minha?.banheiro || 0} onChange={setBanheiro} size={24} />
              </div>
            </div>
            <Textarea
              className="mt-3" rows={3}
              placeholder={minha?.comentario ?? "Comentário (opcional)"}
              value={coment} onChange={(ev) => setComent(ev.target.value)} maxLength={1000}
            />
            <div className="mt-3 flex justify-end">
              <Button className="bg-fire" onClick={avaliar} disabled={busy}>Enviar avaliação</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <Link to="/auth" className="text-gold underline">Entre</Link> para avaliar este estúdio.
          </div>
        )}

        {!avals || avals.length === 0 ? (
          <p className="mt-6 text-muted-foreground">Ainda nenhuma avaliação.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {avals.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-xs text-muted-foreground">Estrutura</span><StarsDisplay value={a.estrutura} size={12} />
                  <span className="text-xs text-muted-foreground">Equipamentos</span><StarsDisplay value={a.equipamentos} size={12} />
                  <span className="text-xs text-muted-foreground">Banheiro</span><StarsDisplay value={a.banheiro} size={12} />
                  <span className="ml-auto text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
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
