import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Download, Check, X, Music2, Calendar, Users, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventoWizard } from "@/components/EventoWizard";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — União das Bandas" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;
  if (!isAdmin) return (
    <div className="mx-auto max-w-md p-12 text-center">
      <h1 className="display text-3xl">Acesso restrito</h1>
      <p className="mt-2 text-muted-foreground">Esta área é exclusiva para administradores.</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="display text-4xl">Dashboard Administrativo</h1>
      <StatsRow />
      <Tabs defaultValue="apoios" className="mt-8">
        <TabsList>
          <TabsTrigger value="apoios">Apoios</TabsTrigger>
          <TabsTrigger value="bandas">Bandas</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>
        <TabsContent value="apoios"><ApoiosTab /></TabsContent>
        <TabsContent value="bandas"><BandasTab /></TabsContent>
        <TabsContent value="eventos"><EventosTab /></TabsContent>
        <TabsContent value="ranking"><RankingTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function StatsRow() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data: apoios } = await supabase.from("apoios").select("valor, status, nome_apoiador");
      const aprovados = (apoios ?? []).filter((a) => a.status === "aprovado");
      const total = aprovados.reduce((s, a) => s + Number(a.valor), 0);
      const apoiadoresUnicos = new Set(aprovados.map((a) => a.nome_apoiador)).size;
      const { count: nBandas } = await supabase.from("bandas").select("*", { count: "exact", head: true });
      const { count: nEventos } = await supabase.from("eventos").select("*", { count: "exact", head: true });
      return { total, apoiadores: apoiadoresUnicos, bandas: nBandas ?? 0, eventos: nEventos ?? 0 };
    },
  });

  const cards = [
    { label: "Arrecadado", value: `R$ ${(data?.total ?? 0).toFixed(2)}`, icon: DollarSign },
    { label: "Apoiadores", value: data?.apoiadores ?? 0, icon: Users },
    { label: "Bandas", value: data?.bandas ?? 0, icon: Music2 },
    { label: "Eventos", value: data?.eventos ?? 0, icon: Calendar },
  ];
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-border bg-card p-5">
          <c.icon className="h-5 w-5 text-gold" />
          <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
          <p className="display text-3xl">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function ApoiosTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-apoios"],
    queryFn: async () => {
      const { data } = await supabase.from("apoios")
        .select("*, bandas(nome), eventos(nome)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function aprovar(id: string) {
    const { error } = await supabase.rpc("aprovar_apoio", { _apoio_id: id });
    if (error) toast.error(error.message); else { toast.success("Apoio aprovado!"); qc.invalidateQueries(); }
  }
  async function cancelar(id: string) {
    const { error } = await supabase.rpc("cancelar_apoio", { _apoio_id: id });
    if (error) toast.error(error.message); else { toast.success("Apoio cancelado."); qc.invalidateQueries(); }
  }

  function exportCSV() {
    const rows = [["Data", "Apoiador", "Banda", "Evento", "Valor", "Pontos", "Status"]];
    (data ?? []).forEach((a: any) => rows.push([
      new Date(a.created_at).toLocaleString("pt-BR"),
      a.nome_apoiador, a.bandas?.nome ?? "", a.eventos?.nome ?? "",
      Number(a.valor).toFixed(2), String(a.pontos), a.status,
    ]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `apoios-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex gap-2">
        <Button variant="outline" onClick={exportCSV}><Download className="mr-2 h-4 w-4" /> Excel/CSV</Button>
        <Button variant="outline" onClick={() => window.print()}><Download className="mr-2 h-4 w-4" /> PDF (imprimir)</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Data</th>
              <th className="px-3 py-2 text-left">Apoiador</th>
              <th className="px-3 py-2 text-left">Banda</th>
              <th className="px-3 py-2 text-left">Evento</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-right">Pontos</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((a: any) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-3 py-2 text-xs">{new Date(a.created_at).toLocaleString("pt-BR")}</td>
                <td className="px-3 py-2">{a.nome_apoiador}</td>
                <td className="px-3 py-2">{a.bandas?.nome}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{a.eventos?.nome ?? "—"}</td>
                <td className="px-3 py-2 text-right">R$ {Number(a.valor).toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-gold">{a.pontos}</td>
                <td className="px-3 py-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${
                    a.status === "aprovado" ? "bg-gold/20 text-gold" :
                    a.status === "cancelado" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                  }`}>{a.status}</span>
                </td>
                <td className="px-3 py-2">
                  {a.status === "pendente" && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => aprovar(a.id)}><Check className="h-3 w-3" /></Button>
                      <Button size="sm" variant="outline" onClick={() => cancelar(a.id)}><X className="h-3 w-3" /></Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhum apoio registrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BandasTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-bandas"],
    queryFn: async () => (await supabase.from("bandas").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  async function salvar(form: any) {
    const payload = {
      nome: form.nome, foto: form.foto || null, release: form.release || null,
      cidade: form.cidade || null, instagram: form.instagram || null,
      youtube: form.youtube || null, spotify: form.spotify || null, status: form.status || "ativa",
    };
    const { error } = edit?.id
      ? await supabase.from("bandas").update(payload).eq("id", edit.id)
      : await supabase.from("bandas").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Banda salva."); setOpen(false); setEdit(null); qc.invalidateQueries(); }
  }

  return (
    <div className="mt-6">
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEdit(null); }}>
        <DialogTrigger asChild>
          <Button className="bg-fire"><Plus className="mr-2 h-4 w-4" /> Nova banda</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Editar banda" : "Nova banda"}</DialogTitle></DialogHeader>
          <BandaForm initial={edit} onSubmit={salvar} />
        </DialogContent>
      </Dialog>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(data ?? []).map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-secondary">
              {b.foto ? <img src={b.foto} alt="" className="h-full w-full object-cover" /> : <Music2 className="m-3 h-8 w-8 text-muted-foreground/40" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate display text-lg">{b.nome}</p>
              <p className="truncate text-xs text-muted-foreground">{b.cidade} · {b.status}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setEdit(b); setOpen(true); }}>Editar</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BandaForm({ initial, onSubmit }: { initial: any; onSubmit: (f: any) => void }) {
  const [f, setF] = useState({
    nome: initial?.nome ?? "", foto: initial?.foto ?? "", release: initial?.release ?? "",
    cidade: initial?.cidade ?? "", instagram: initial?.instagram ?? "",
    youtube: initial?.youtube ?? "", spotify: initial?.spotify ?? "", status: initial?.status ?? "ativa",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-3">
      <div><Label>Nome</Label><Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label>URL da foto</Label><Input value={f.foto} onChange={(e) => setF({ ...f, foto: e.target.value })} placeholder="https://..." /></div>
      <div><Label>Cidade</Label><Input value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></div>
      <div><Label>Release</Label><Textarea rows={4} value={f.release} onChange={(e) => setF({ ...f, release: e.target.value })} /></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div><Label>Instagram</Label><Input value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} /></div>
        <div><Label>YouTube</Label><Input value={f.youtube} onChange={(e) => setF({ ...f, youtube: e.target.value })} /></div>
        <div><Label>Spotify</Label><Input value={f.spotify} onChange={(e) => setF({ ...f, spotify: e.target.value })} /></div>
      </div>
      <Button type="submit" className="w-full bg-fire">Salvar</Button>
    </form>
  );
}

function EventosTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-eventos"],
    queryFn: async () => (await supabase.from("eventos").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  async function salvar(form: any) {
    const payload = {
      nome: form.nome, descricao: form.descricao || null,
      data_evento: form.data_evento || null,
      data_inicio_votacao: form.data_inicio_votacao || null,
      data_fim_votacao: form.data_fim_votacao || null,
      status: form.status,
    };
    const { error } = edit?.id
      ? await supabase.from("eventos").update(payload).eq("id", edit.id)
      : await supabase.from("eventos").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Evento salvo."); setOpen(false); setEdit(null); qc.invalidateQueries(); }
  }
  async function encerrar(id: string) {
    const { error } = await supabase.from("eventos").update({ status: "encerrado" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Votação encerrada."); qc.invalidateQueries(); }
  }

  return (
    <div className="mt-6">
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEdit(null); }}>
        <DialogTrigger asChild>
          <Button className="bg-fire"><Plus className="mr-2 h-4 w-4" /> Novo evento</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Editar evento" : "Novo evento"}</DialogTitle></DialogHeader>
          <EventoWizard initial={edit} onSubmit={salvar} onCancel={() => { setOpen(false); setEdit(null); }} />
        </DialogContent>
      </Dialog>

      <div className="mt-4 space-y-3">
        {(data ?? []).map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
            <div className="min-w-0">
              <p className="display text-lg">{e.nome}</p>
              <p className="text-xs text-muted-foreground">
                {e.data_evento ? new Date(e.data_evento).toLocaleDateString("pt-BR") : "Sem data"} · {e.status}
              </p>
            </div>
            <div className="flex gap-2">
              {e.status !== "encerrado" && <Button size="sm" variant="outline" onClick={() => encerrar(e.id)}>Encerrar</Button>}
              <Button size="sm" variant="outline" onClick={() => { setEdit(e); setOpen(true); }}>Editar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventoForm({ initial, onSubmit }: { initial: any; onSubmit: (f: any) => void }) {
  const fmt = (d: string | null | undefined) => d ? new Date(d).toISOString().slice(0, 16) : "";
  const [f, setF] = useState({
    nome: initial?.nome ?? "", descricao: initial?.descricao ?? "",
    data_evento: fmt(initial?.data_evento),
    data_inicio_votacao: fmt(initial?.data_inicio_votacao),
    data_fim_votacao: fmt(initial?.data_fim_votacao),
    status: initial?.status ?? "aberto",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-3">
      <div><Label>Nome</Label><Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label>Descrição</Label><Textarea rows={3} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div><Label>Data evento</Label><Input type="datetime-local" value={f.data_evento} onChange={(e) => setF({ ...f, data_evento: e.target.value })} /></div>
        <div><Label>Início votação</Label><Input type="datetime-local" value={f.data_inicio_votacao} onChange={(e) => setF({ ...f, data_inicio_votacao: e.target.value })} /></div>
        <div><Label>Fim votação</Label><Input type="datetime-local" value={f.data_fim_votacao} onChange={(e) => setF({ ...f, data_fim_votacao: e.target.value })} /></div>
      </div>
      <div>
        <Label>Status</Label>
        <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="aberto">aberto</option>
          <option value="em_votacao">em_votacao</option>
          <option value="encerrado">encerrado</option>
        </select>
      </div>
      <Button type="submit" className="w-full bg-fire">Salvar</Button>
    </form>
  );
}

function RankingTab() {
  const { data } = useQuery({
    queryKey: ["admin-ranking"],
    queryFn: async () => {
      const { data: apoios } = await supabase.from("apoios").select("banda_id, pontos").eq("status", "aprovado");
      const { data: bandas } = await supabase.from("bandas").select("id, nome, cidade");
      const map = new Map<string, number>();
      (apoios ?? []).forEach((a) => map.set(a.banda_id, (map.get(a.banda_id) ?? 0) + a.pontos));
      return (bandas ?? []).map((b) => ({ ...b, pontos: map.get(b.id) ?? 0 })).sort((a, b) => b.pontos - a.pontos);
    },
  });
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-card text-xs uppercase text-muted-foreground">
          <tr><th className="px-3 py-2 text-left">#</th><th className="px-3 py-2 text-left">Banda</th><th className="px-3 py-2 text-left">Cidade</th><th className="px-3 py-2 text-right">Pontos</th></tr>
        </thead>
        <tbody>
          {(data ?? []).map((b, i) => (
            <tr key={b.id} className="border-t border-border">
              <td className="px-3 py-2">{i + 1}</td>
              <td className="px-3 py-2 display">{b.nome}</td>
              <td className="px-3 py-2 text-muted-foreground">{b.cidade}</td>
              <td className="px-3 py-2 text-right text-gold display text-lg">{b.pontos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
