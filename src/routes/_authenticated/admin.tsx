import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Download, Check, X, Music2, Calendar, Users, DollarSign, UserCircle2, KeyRound, Trash2, ListPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { EventoWizard } from "@/components/EventoWizard";
import { ImageUploadField } from "@/components/ImageUploadField";

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
          <TabsTrigger value="produtores">Produtores</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="pix"><KeyRound className="mr-1 h-3.5 w-3.5" />PIX</TabsTrigger>
        </TabsList>
        <TabsContent value="apoios"><ApoiosTab /></TabsContent>
        <TabsContent value="bandas"><BandasTab /></TabsContent>
        <TabsContent value="produtores"><ProdutoresTab /></TabsContent>
        <TabsContent value="eventos"><EventosTab /></TabsContent>
        <TabsContent value="ranking"><RankingTab /></TabsContent>
        <TabsContent value="pix"><PixTab /></TabsContent>
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

  async function excluir(id: string) {
    const { error } = await supabase.from("bandas").delete().eq("id", id);
    if (error) toast.error("Não foi possível excluir: " + error.message);
    else { toast.success("Banda excluída."); qc.invalidateQueries(); }
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
            <DeleteButton
              label={`Excluir banda "${b.nome}"`}
              description="Todos os apoios e participações vinculados também serão removidos."
              onConfirm={() => excluir(b.id)}
            />
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
      <ImageUploadField label="Logo da banda" bucket="band-logos" value={f.foto} onChange={(url) => setF({ ...f, foto: url })} />
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

function DeleteButton({ label, description, onConfirm }: { label: string; description?: string; onConfirm: () => void | Promise<void> }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" aria-label={label}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}?</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
  const [addBandasFor, setAddBandasFor] = useState<any>(null);

  async function salvar(form: any) {
    const payload = {
      nome: form.nome, descricao: form.descricao || null,
      data_evento: form.data_evento || null,
      data_inicio_votacao: form.data_inicio_votacao || null,
      data_fim_votacao: form.data_fim_votacao || null,
      status: form.status,
      banner_url: form.banner_url || null,
      produtor_id: form.produtor_id || null,
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
  async function excluir(id: string) {
    const { error } = await supabase.from("eventos").delete().eq("id", id);
    if (error) toast.error("Não foi possível excluir: " + error.message);
    else { toast.success("Evento excluído."); qc.invalidateQueries(); }
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

      <Dialog open={!!addBandasFor} onOpenChange={(o) => { if (!o) setAddBandasFor(null); }}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader><DialogTitle>Adicionar bandas — {addBandasFor?.nome}</DialogTitle></DialogHeader>
          {addBandasFor && (
            <AdicionarBandasEvento evento={addBandasFor} onDone={() => { setAddBandasFor(null); qc.invalidateQueries(); }} />
          )}
        </DialogContent>
      </Dialog>

      <div className="mt-4 space-y-3">
        {(data ?? []).map((e) => (
          <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
            <div className="min-w-0">
              <p className="display text-lg">{e.nome}</p>
              <p className="text-xs text-muted-foreground">
                {e.data_evento ? new Date(e.data_evento).toLocaleString("pt-BR") : "Sem data"} · {e.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setAddBandasFor(e)}>
                <ListPlus className="mr-1 h-4 w-4" /> Adicionar bandas
              </Button>
              {e.status !== "encerrado" && <Button size="sm" variant="outline" onClick={() => encerrar(e.id)}>Encerrar</Button>}
              <Button size="sm" variant="outline" onClick={() => { setEdit(e); setOpen(true); }}>Editar</Button>
              <DeleteButton
                label={`Excluir evento "${e.nome}"`}
                description="Apoios e participações vinculados a este evento serão removidos."
                onConfirm={() => excluir(e.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdicionarBandasEvento({ evento, onDone }: { evento: any; onDone: () => void }) {
  const { data: bandas } = useQuery({
    queryKey: ["admin-bandas-select"],
    queryFn: async () => (await supabase.from("bandas").select("id, nome, cidade").order("nome")).data ?? [],
  });
  const { data: jaVinculadas } = useQuery({
    queryKey: ["pe-vinculadas", evento.id],
    queryFn: async () => {
      const { data } = await supabase.from("participacao_evento").select("banda_id").eq("evento_id", evento.id);
      return new Set((data ?? []).map((p) => p.banda_id));
    },
  });
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
  }

  async function salvar() {
    if (sel.size === 0) { toast.error("Selecione ao menos uma banda."); return; }
    setBusy(true);
    const rows = Array.from(sel).map((banda_id) => ({ evento_id: evento.id, banda_id, pontos: 0 }));
    const { error } = await supabase.from("participacao_evento").insert(rows);
    setBusy(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(`${rows.length} banda(s) adicionada(s).`);
    onDone();
  }

  const disponiveis = (bandas ?? []).filter((b) => !jaVinculadas?.has(b.id));

  return (
    <div className="space-y-3">
      {disponiveis.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Todas as bandas já estão neste evento.</p>
      ) : (
        <div className="max-h-80 space-y-1 overflow-y-auto rounded border border-border p-2">
          {disponiveis.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-secondary">
              <Checkbox checked={sel.has(b.id)} onCheckedChange={() => toggle(b.id)} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{b.nome}</p>
                <p className="truncate text-xs text-muted-foreground">{b.cidade ?? "—"}</p>
              </div>
            </label>
          ))}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onDone}>Cancelar</Button>
        <Button className="bg-fire" disabled={busy || sel.size === 0} onClick={salvar}>
          Adicionar {sel.size > 0 ? `(${sel.size})` : ""}
        </Button>
      </div>
    </div>
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

function ProdutoresTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-produtores"],
    queryFn: async () => (await supabase.from("produtores").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);

  async function salvar(form: any) {
    const payload = {
      nome: form.nome,
      bio: form.bio || null,
      foto: form.foto || null,
      cidade: form.cidade || null,
      contato: form.contato || null,
      instagram: form.instagram || null,
      site: form.site || null,
      status: form.status || "ativo",
    };
    const { error } = edit?.id
      ? await supabase.from("produtores").update(payload).eq("id", edit.id)
      : await supabase.from("produtores").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Produtor salvo."); setOpen(false); setEdit(null); qc.invalidateQueries(); }
  }

  return (
    <div className="mt-6">
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEdit(null); }}>
        <DialogTrigger asChild>
          <Button className="bg-fire"><Plus className="mr-2 h-4 w-4" /> Novo produtor</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Editar produtor" : "Novo produtor"}</DialogTitle></DialogHeader>
          <ProdutorForm initial={edit} onSubmit={salvar} />
        </DialogContent>
      </Dialog>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(data ?? []).map((p: any) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-secondary">
              {p.foto ? <img src={p.foto} alt="" className="h-full w-full object-cover" /> : <UserCircle2 className="h-full w-full text-muted-foreground/40" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate display text-lg">{p.nome}</p>
              <p className="truncate text-xs text-muted-foreground">{p.cidade ?? "—"} · {p.status}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setEdit(p); setOpen(true); }}>Editar</Button>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Nenhum produtor cadastrado.</p>
        )}
      </div>
    </div>
  );
}

function ProdutorForm({ initial, onSubmit }: { initial: any; onSubmit: (f: any) => void }) {
  const [f, setF] = useState({
    nome: initial?.nome ?? "",
    bio: initial?.bio ?? "",
    foto: initial?.foto ?? "",
    cidade: initial?.cidade ?? "",
    contato: initial?.contato ?? "",
    instagram: initial?.instagram ?? "",
    site: initial?.site ?? "",
    status: initial?.status ?? "ativo",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(f); }} className="space-y-3">
      <div><Label>Nome</Label><Input required value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
      <div><Label>URL da foto</Label><Input value={f.foto} onChange={(e) => setF({ ...f, foto: e.target.value })} placeholder="https://..." /></div>
      <div><Label>Cidade</Label><Input value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></div>
      <div><Label>Bio</Label><Textarea rows={4} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div><Label>Contato</Label><Input value={f.contato} onChange={(e) => setF({ ...f, contato: e.target.value })} placeholder="Email ou telefone" /></div>
        <div><Label>Instagram</Label><Input value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} /></div>
        <div><Label>Site</Label><Input value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} /></div>
      </div>
      <div>
        <Label>Status</Label>
        <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
      </div>
      <Button type="submit" className="w-full bg-fire">Salvar</Button>
    </form>
  );
}

function PixTab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["config-pix-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("configuracoes_pix")
        .select("id, chave, nome_recebedor, cidade, updated_at")
        .maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState({ chave: "", nome_recebedor: "", cidade: "" });
  const [hydrated, setHydrated] = useState(false);
  if (data && !hydrated) {
    setForm({ chave: data.chave, nome_recebedor: data.nome_recebedor, cidade: data.cidade });
    setHydrated(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.chave.trim() || !form.nome_recebedor.trim() || !form.cidade.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    const payload = {
      chave: form.chave.trim(),
      nome_recebedor: form.nome_recebedor.trim(),
      cidade: form.cidade.trim(),
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    };
    const { error } = data?.id
      ? await supabase.from("configuracoes_pix").update(payload).eq("id", data.id)
      : await supabase.from("configuracoes_pix").insert(payload);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Conta PIX atualizada.");
    qc.invalidateQueries({ queryKey: ["config-pix-admin"] });
    qc.invalidateQueries({ queryKey: ["config-pix"] });
  }

  if (isLoading) return <p className="mt-6 text-muted-foreground">Carregando...</p>;

  return (
    <div className="mt-6 max-w-xl">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-gold" />
          <h2 className="display text-xl">Conta PIX dos apoios</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta chave é usada para gerar o QR Code e o código copia-e-cola na tela de apoio às bandas.
        </p>
        <form onSubmit={salvar} className="mt-6 space-y-4">
          <div>
            <Label>Chave PIX</Label>
            <Input value={form.chave} onChange={(e) => setForm({ ...form, chave: e.target.value })} placeholder="email, CPF/CNPJ, telefone ou aleatória" />
          </div>
          <div>
            <Label>Nome do recebedor</Label>
            <Input value={form.nome_recebedor} onChange={(e) => setForm({ ...form, nome_recebedor: e.target.value })} maxLength={25} />
            <p className="mt-1 text-xs text-muted-foreground">Máx. 25 caracteres (padrão PIX).</p>
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} maxLength={15} />
            <p className="mt-1 text-xs text-muted-foreground">Máx. 15 caracteres (padrão PIX).</p>
          </div>
          <Button type="submit" className="bg-fire">Salvar</Button>
          {data?.updated_at && (
            <p className="text-xs text-muted-foreground">
              Última atualização: {new Date(data.updated_at).toLocaleString("pt-BR")}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
