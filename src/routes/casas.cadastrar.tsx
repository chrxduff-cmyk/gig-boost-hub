import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Crosshair, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/casas/cadastrar")({
  head: () => ({ meta: [{ title: "Cadastrar casa de shows — União das Bandas" }] }),
  component: CadastrarCasa,
});

const schema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(120),
  descricao: z.string().max(2000).optional(),
  endereco: z.string().max(300).optional(),
  cidade: z.string().max(120).optional(),
  estado: z.string().max(40).optional(),
  telefone: z.string().max(40).optional(),
  instagram: z.string().max(200).optional(),
  site: z.string().max(300).optional(),
  foto: z.string().max(500).optional(),
});

function CadastrarCasa() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [f, setF] = useState({
    nome: "", descricao: "", endereco: "", cidade: "", estado: "",
    telefone: "", instagram: "", site: "", foto: "",
    latitude: "" as string | number, longitude: "" as string | number,
  });

  if (loading) return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-md p-12 text-center">
        <h1 className="display text-3xl">Entre para cadastrar</h1>
        <p className="mt-2 text-muted-foreground">Você precisa estar logado para cadastrar uma casa de shows.</p>
        <Button asChild className="mt-6 bg-fire"><Link to="/auth">Entrar</Link></Button>
      </div>
    );
  }

  function pegarGPS() {
    if (!("geolocation" in navigator)) { toast.error("Geolocalização não disponível neste navegador."); return; }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setF((p) => ({ ...p, latitude: pos.coords.latitude.toFixed(7), longitude: pos.coords.longitude.toFixed(7) }));
        toast.success("Localização capturada.");
        setGpsBusy(false);
      },
      (err) => { toast.error("Não foi possível obter o GPS: " + err.message); setGpsBusy(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setBusy(true);
    const lat = f.latitude === "" ? null : Number(f.latitude);
    const lng = f.longitude === "" ? null : Number(f.longitude);
    const payload = {
      created_by: user!.id,
      owner_id: user!.id, // quem cadastrou já vira dono; pode ser transferido por reivindicação
      nome: f.nome.trim(),
      descricao: f.descricao.trim() || null,
      endereco: f.endereco.trim() || null,
      cidade: f.cidade.trim() || null,
      estado: f.estado.trim() || null,
      telefone: f.telefone.trim() || null,
      instagram: f.instagram.trim() || null,
      site: f.site.trim() || null,
      foto: f.foto.trim() || null,
      latitude: lat,
      longitude: lng,
    };
    const { data, error } = await supabase.from("casas_shows").insert(payload).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Casa cadastrada!");
    nav({ to: "/casas/$id", params: { id: data!.id } });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="display text-4xl">Cadastrar casa de shows</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Adicione informações da casa, marque a localização pelo GPS e ajude as bandas a encontrarem espaços para tocar.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <div><Label>Nome *</Label><Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
        <div><Label>Descrição</Label><Textarea rows={4} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Cidade</Label><Input value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></div>
          <div><Label>Estado (UF)</Label><Input maxLength={2} value={f.estado} onChange={(e) => setF({ ...f, estado: e.target.value.toUpperCase() })} /></div>
        </div>
        <div><Label>Endereço</Label><Input value={f.endereco} onChange={(e) => setF({ ...f, endereco: e.target.value })} /></div>

        <div className="rounded-lg border border-border bg-card p-4">
          <Label className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> Localização (GPS)</Label>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <Input placeholder="Latitude" value={f.latitude} onChange={(e) => setF({ ...f, latitude: e.target.value })} />
            <Input placeholder="Longitude" value={f.longitude} onChange={(e) => setF({ ...f, longitude: e.target.value })} />
            <Button type="button" variant="outline" onClick={pegarGPS} disabled={gpsBusy}>
              {gpsBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Crosshair className="mr-2 h-4 w-4" />}
              Usar meu GPS
            </Button>
          </div>
          {f.latitude && f.longitude && (
            <a
              href={`https://www.google.com/maps?q=${f.latitude},${f.longitude}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-gold underline"
            >
              Ver no Google Maps
            </a>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Telefone</Label><Input value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} /></div>
          <div><Label>Instagram</Label><Input placeholder="https://instagram.com/..." value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} /></div>
        </div>
        <div><Label>Site</Label><Input placeholder="https://..." value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} /></div>
        <div><Label>URL da foto (opcional)</Label><Input placeholder="https://..." value={f.foto} onChange={(e) => setF({ ...f, foto: e.target.value })} /></div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => nav({ to: "/casas" })}>Cancelar</Button>
          <Button type="submit" className="bg-fire" disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar
          </Button>
        </div>
      </form>
    </div>
  );
}
