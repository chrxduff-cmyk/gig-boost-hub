import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gerarPixSimulado, pontosDeValor } from "@/lib/pix";

const searchSchema = z.object({ evento: z.string().optional() });

export const Route = createFileRoute("/apoiar/$bandaId")({
  validateSearch: searchSchema,
  component: ApoiarPage,
});

function ApoiarPage() {
  const { bandaId } = Route.useParams();
  const { evento } = Route.useSearch();
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState<number>(10);
  const [pix, setPix] = useState<ReturnType<typeof gerarPixSimulado> | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const { data: banda } = useQuery({
    queryKey: ["banda-min", bandaId],
    queryFn: async () => {
      const { data } = await supabase.from("bandas").select("id, nome, foto").eq("id", bandaId).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: pixConfig } = useQuery({
    queryKey: ["config-pix"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_pix_config_public");
      const row = Array.isArray(data) ? data[0] : data;
      return row ?? { chave: "pix@uniaodasbandas.com", nome_recebedor: "UDB", cidade: "BRASIL" };
    },
  });


  function gerar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) { toast.error("Informe seu nome."); return; }
    if (valor < 10) { toast.error("O valor mínimo é R$ 10."); return; }
    if (!pixConfig) { toast.error("Configuração PIX indisponível."); return; }
    setPix(gerarPixSimulado(banda?.nome ?? "", valor, pixConfig));
  }

  async function confirmar() {
    if (!pix || !banda) return;
    const { error } = await supabase.from("apoios").insert({
      banda_id: banda.id,
      evento_id: evento ?? null,
      nome_apoiador: nome.trim(),
      valor,
      txid: pix.txid,
      pontos: 0,
      status: "pendente",
    });
    if (error) { toast.error("Não foi possível registrar: " + error.message); return; }
    setEnviado(true);
    toast.success("Apoio registrado! Aguardando confirmação do administrador.");
  }

  async function copiar() {
    if (!pix) return;
    await navigator.clipboard.writeText(pix.copiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (!banda) return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;

  if (enviado) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-gold" />
        <h1 className="display mt-4 text-3xl">Obrigado pelo apoio!</h1>
        <p className="mt-3 text-muted-foreground">
          Seu apoio a <span className="text-foreground font-medium">{banda.nome}</span> foi registrado e será convertido em <span className="text-gold font-bold">{pontosDeValor(valor)} ponto{pontosDeValor(valor) !== 1 ? "s" : ""}</span> após a confirmação do pagamento pelo administrador.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="outline"><Link to="/bandas/$id" params={{ id: banda.id }}>Voltar à banda</Link></Button>
          <Button asChild className="bg-fire"><Link to="/ranking">Ver ranking</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <p className="text-xs uppercase tracking-widest text-gold">Apoiar banda</p>
        <h1 className="display mt-1 text-3xl">{banda.nome}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cada <strong className="text-foreground">R$10</strong> apoiados geram <strong className="text-gold">1 ponto</strong> para esta banda.
        </p>

        {!pix ? (
          <form onSubmit={gerar} className="mt-8 space-y-4">
            <div>
              <Label>Seu nome</Label>
              <Input required value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" min={10} step={10} value={valor} onChange={(e) => setValor(Number(e.target.value))} />
              <p className="mt-1 text-xs text-muted-foreground">Equivale a <span className="text-gold">{pontosDeValor(valor)} ponto(s)</span>.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 50, 100, 200].map((v) => (
                <button key={v} type="button" onClick={() => setValor(v)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition ${valor === v ? "border-gold bg-gold/10 text-gold" : "border-border hover:border-gold/50"}`}>
                  R$ {v}
                </button>
              ))}
            </div>
            <Button type="submit" className="w-full bg-fire shadow-glow">Gerar PIX</Button>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl bg-background p-6 text-center">
              <img src={pix.qrUrl} alt="QR Code PIX" className="mx-auto rounded-lg bg-white p-2" width={260} height={260} />
              <p className="mt-4 text-sm text-muted-foreground">Escaneie o QR Code no app do seu banco</p>
              <p className="mt-1 display text-3xl text-gold">R$ {valor.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">= {pontosDeValor(valor)} ponto(s)</p>
            </div>

            <div>
              <Label>PIX copia e cola</Label>
              <div className="mt-1 flex gap-2">
                <Input value={pix.copiaECola} readOnly className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={copiar}>
                  {copiado ? <CheckCircle2 className="h-4 w-4 text-gold" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="rounded-md border border-gold/30 bg-gold/5 p-4 text-sm">
              <p className="text-gold font-semibold">Após pagar, clique abaixo para registrar seu apoio.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                A pontuação será creditada após a confirmação manual do administrador.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPix(null)} className="flex-1">Voltar</Button>
              <Button onClick={confirmar} className="flex-1 bg-fire">Já paguei</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
