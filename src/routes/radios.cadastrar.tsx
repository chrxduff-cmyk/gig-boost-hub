import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/radios/cadastrar")({
  head: () => ({ meta: [{ title: "Cadastrar rádio — ONESTAGE" }] }),
  component: CadastrarRadio,
});

const schema = z.object({
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().max(2000).optional(),
  site: z.string().max(300).optional(),
  stream_url: z.string().max(500).optional(),
  logo: z.string().max(500).optional(),
  cidade: z.string().max(120).optional(),
  estado: z.string().max(40).optional(),
});

function CadastrarRadio() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    nome: "", descricao: "", site: "", stream_url: "", logo: "", cidade: "", estado: "",
  });

  if (loading) return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md p-12 text-center">
        <h1 className="display text-3xl">Entre para cadastrar</h1>
        <Button asChild className="mt-6 bg-fire"><Link to="/auth">Entrar</Link></Button>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setBusy(true);
    const payload = {
      created_by: user!.id, owner_id: user!.id,
      nome: f.nome.trim(),
      descricao: f.descricao.trim() || null,
      site: f.site.trim() || null,
      stream_url: f.stream_url.trim() || null,
      logo: f.logo.trim() || null,
      cidade: f.cidade.trim() || null,
      estado: f.estado.trim() || null,
    };
    const { data, error } = await supabase.from("radios").insert(payload).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Rádio cadastrada!");
    nav({ to: "/radios/$id", params: { id: data!.id } });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="display text-4xl">Cadastrar rádio</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div><Label>Nome *</Label><Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
        <div><Label>Descrição</Label><Textarea rows={3} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Cidade</Label><Input value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></div>
          <div><Label>UF</Label><Input maxLength={2} value={f.estado} onChange={(e) => setF({ ...f, estado: e.target.value.toUpperCase() })} /></div>
        </div>
        <div><Label>Site</Label><Input placeholder="https://..." value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} /></div>
        <div><Label>URL do stream (opcional)</Label><Input placeholder="https://..." value={f.stream_url} onChange={(e) => setF({ ...f, stream_url: e.target.value })} /></div>
        <div><Label>URL do logo (opcional)</Label><Input placeholder="https://..." value={f.logo} onChange={(e) => setF({ ...f, logo: e.target.value })} /></div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => nav({ to: "/radios" })}>Cancelar</Button>
          <Button type="submit" className="bg-fire" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Cadastrar
          </Button>
        </div>
      </form>
    </div>
  );
}
