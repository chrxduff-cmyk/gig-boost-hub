import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Store, ExternalLink, Instagram, MapPin, Phone, Trash2, Flag } from "lucide-react";
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

export const Route = createFileRoute("/lojas/$id")({
  component: LojaPage,
});

function LojaPage() {
  const { id } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();

  const { data: l } = useQuery({
    queryKey: ["loja", id],
    queryFn: async () => {
      const { data } = await supabase.from("lojas").select("*").eq("id", id).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: avals } = useQuery({
    queryKey: ["loja-avals", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("avaliacoes_loja")
        .select("id, atendimento, variedade, preco, comentario, created_at, user_id")
        .eq("loja_id", id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const minha = avals?.find((a) => a.user_id === user?.id);
  const n = avals?.length ?? 0;
  const med = (k: "atendimento" | "variedade" | "preco") =>
    n ? avals!.reduce((s, a) => s + (a as any)[k], 0) / n : 0;
  const geral = n ? (med("atendimento") + med("variedade") + med("preco")) / 3 : 0;

  const [atendimento, setAtendimento] = useState(0);
  const [variedade, setVariedade] = useState(0);
  const [preco, setPreco] = useState(0);
  const [coment, setComent] = useState("");
  const [busy, setBusy] = useState(false);

  async function avaliar() {
    if (!user) { toast.error("Entre para avaliar."); return; }
    if (atendimento < 1 || variedade < 1 || preco < 1) {
      toast.error("Avalie atendimento, variedade e preço (1 a 5)."); return;
    }
    setBusy(true);
    const { error } = await supabase.from("avaliacoes_loja").upsert(
      { loja_id: id, user_id: user.id, atendimento, variedade, preco, comentario: coment.trim() || null },
      { onConflict: "loja_id,user_id" },
    );
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Avaliação enviada!");
    setAtendimento(0); setVariedade(0); setPreco(0); setComent("");
    qc.invalidateQueries({ queryKey: ["loja-avals", id] });
  }

  async function excluir() {
    const { error } = await supabase.from("lojas").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Loja excluída.");
    window.location.href = "/lojas";
  }

  async function reivindicar() {
    if (!user) { toast.error("Entre para reivindicar."); return; }
    const { error } = await supabase.from("reivindicacoes").insert({
      entity_type: "loja", entity_id: id, user_id: user.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Reivindicação enviada. Um admin irá avaliar.");
  }

  if (!l) return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;
  const podeEditar = isAdmin || l.owner_id === user?.id || (l.owner_id === null && l.created_by === user?.id);
  const pendente = l.status === "pendente";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {pendente && (
        <div className="mb-6 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
          Este cadastro está pendente de aprovação por um administrador.
        </div>
      )}
      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
          {l.foto ? (
            <img src={l.foto} alt={l.nome} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><Store className="h-24 w-24 text-muted-foreground/30" /></div>
          )}
        </div>
        <div>
          <h1 className="display text-5xl">{l.nome}</h1>
          {l.categoria && <p className="mt-1 text-xs uppercase tracking-widest text-gold">{l.categoria}</p>}
          {(l.cidade || l.estado) && (
            <p className="mt-2 flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {[l.cidade, l.estado].filter(Boolean).join(" — ")}
            </p>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Geral</p>
              <StarsDisplay value={geral} count={n} size={18} />
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
              <div className="flex justify-between">Atendimento<StarsDisplay value={med("atendimento")} size={12} /></div>
              <div className="flex justify-between">Variedade<StarsDisplay value={med("variedade")} size={12} /></div>
              <div className="flex justify-between">Preço<StarsDisplay value={med("preco")} size={12} /></div>
            </div>
          </div>

          {l.descricao && <p className="mt-6 leading-relaxed text-muted-foreground">{l.descricao}</p>}

          <div className="mt-6 flex flex-wrap gap-3">
            {l.endereco && <span className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">{l.endereco}</span>}
            {l.telefone && (
              <a href={`tel:${l.telefone}`} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold/50">
                <Phone className="h-4 w-4" /> {l.telefone}
              </a>
            )}
            {l.instagram && (
              <a href={l.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold/50">
                <Instagram className="h-4 w-4" /> Instagram
              </a>
            )}
            {l.site && (
              <a href={l.site} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold/50">
                <ExternalLink className="h-4 w-4" /> Site
              </a>
            )}
            {l.latitude && l.longitude && (
              <a href={`https://www.google.com/maps?q=${l.latitude},${l.longitude}`} target="_blank" rel="noopener noreferrer"
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
                    <AlertDialogTitle>Excluir "{l.nome}"?</AlertDialogTitle>
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
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Atendimento</p>
                <StarRating value={atendimento || minha?.atendimento || 0} onChange={setAtendimento} size={24} />
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Variedade</p>
                <StarRating value={variedade || minha?.variedade || 0} onChange={setVariedade} size={24} />
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Preço</p>
                <StarRating value={preco || minha?.preco || 0} onChange={setPreco} size={24} />
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
            <Link to="/auth" className="text-gold underline">Entre</Link> para avaliar esta loja.
          </div>
        )}

        {!avals || avals.length === 0 ? (
          <p className="mt-6 text-muted-foreground">Ainda nenhuma avaliação.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {avals.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-xs text-muted-foreground">Atendimento</span><StarsDisplay value={a.atendimento} size={12} />
                  <span className="text-xs text-muted-foreground">Variedade</span><StarsDisplay value={a.variedade} size={12} />
                  <span className="text-xs text-muted-foreground">Preço</span><StarsDisplay value={a.preco} size={12} />
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
