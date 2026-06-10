import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Music2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/minha-banda")({
  head: () => ({ meta: [{ title: "Minha Banda — União das Bandas" }] }),
  component: MinhaBanda,
});

function MinhaBanda() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: banda } = useQuery({
    queryKey: ["minha-banda", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("bandas").select("*").eq("owner_id", user!.id).maybeSingle();
      return data;
    },
  });

  const [f, setF] = useState<any>(null);
  useEffect(() => {
    if (banda) setF({ ...banda });
  }, [banda]);

  const { data: pontos } = useQuery({
    queryKey: ["minha-banda-pontos", banda?.id],
    enabled: !!banda,
    queryFn: async () => {
      const { data } = await supabase.from("apoios").select("pontos").eq("banda_id", banda!.id).eq("status", "aprovado");
      return (data ?? []).reduce((s, a) => s + a.pontos, 0);
    },
  });

  const { data: historico } = useQuery({
    queryKey: ["minha-banda-hist", banda?.id],
    enabled: !!banda,
    queryFn: async () => {
      const { data } = await supabase.from("apoios").select("*")
        .eq("banda_id", banda!.id).order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return;
    const payload = {
      nome: f.nome, foto: f.foto || null, release: f.release || null,
      cidade: f.cidade || null, instagram: f.instagram || null,
      youtube: f.youtube || null, spotify: f.spotify || null,
    };
    const { error } = await supabase.from("bandas").update(payload).eq("id", banda!.id);
    if (error) toast.error(error.message);
    else { toast.success("Perfil atualizado!"); qc.invalidateQueries(); }
  }

  if (!banda) {
    return (
      <div className="mx-auto max-w-md p-12 text-center">
        <Music2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h1 className="display mt-4 text-3xl">Nenhuma banda vinculada</h1>
        <p className="mt-2 text-muted-foreground">Peça ao administrador para vincular sua conta a uma banda cadastrada.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl">{banda.nome}</h1>
          <p className="text-muted-foreground">Painel da banda</p>
        </div>
        <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-2">
          <p className="text-xs uppercase tracking-wider text-gold">Pontos</p>
          <p className="display text-3xl text-gold">{pontos ?? 0}</p>
        </div>
      </div>

      <form onSubmit={salvar} className="mt-8 grid gap-4 rounded-xl border border-border bg-card p-6">
        {f && <>
          <div><Label>Nome</Label><Input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
          <div><Label>URL da foto</Label><Input value={f.foto ?? ""} onChange={(e) => setF({ ...f, foto: e.target.value })} placeholder="https://..." /></div>
          {f.foto && <img src={f.foto} alt="Preview" className="h-40 w-40 rounded-lg object-cover" />}
          <div><Label>Cidade</Label><Input value={f.cidade ?? ""} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></div>
          <div><Label>Release</Label><Textarea rows={5} value={f.release ?? ""} onChange={(e) => setF({ ...f, release: e.target.value })} /></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><Label>Instagram</Label><Input value={f.instagram ?? ""} onChange={(e) => setF({ ...f, instagram: e.target.value })} /></div>
            <div><Label>YouTube</Label><Input value={f.youtube ?? ""} onChange={(e) => setF({ ...f, youtube: e.target.value })} /></div>
            <div><Label>Spotify</Label><Input value={f.spotify ?? ""} onChange={(e) => setF({ ...f, spotify: e.target.value })} /></div>
          </div>
          <Button type="submit" className="bg-fire">Salvar</Button>
        </>}
      </form>

      <h2 className="display mt-10 text-2xl">Histórico de apoios</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-xs uppercase text-muted-foreground">
            <tr><th className="px-3 py-2 text-left">Data</th><th className="px-3 py-2 text-left">Apoiador</th><th className="px-3 py-2 text-right">Valor</th><th className="px-3 py-2 text-right">Pontos</th><th className="px-3 py-2 text-left">Status</th></tr>
          </thead>
          <tbody>
            {(historico ?? []).map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-3 py-2 text-xs">{new Date(a.created_at).toLocaleString("pt-BR")}</td>
                <td className="px-3 py-2">{a.nome_apoiador}</td>
                <td className="px-3 py-2 text-right">R$ {Number(a.valor).toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-gold">{a.pontos}</td>
                <td className="px-3 py-2 text-xs">{a.status}</td>
              </tr>
            ))}
            {(!historico || historico.length === 0) && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Sem apoios ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
