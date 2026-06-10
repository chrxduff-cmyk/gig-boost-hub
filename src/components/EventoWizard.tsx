import { useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Calendar, Check, ChevronLeft, ChevronRight, Eye, Image as ImageIcon, Info, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type EventoFormData = {
  nome: string;
  descricao: string;
  data_evento: string;
  data_inicio_votacao: string;
  data_fim_votacao: string;
  status: "aberto" | "em_votacao" | "encerrado";
  banner_url: string;
};

const MAX_BANNER_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_BANNER_TYPES = ["image/jpeg", "image/png", "image/webp"];


const step1Schema = z.object({
  nome: z.string().trim().min(3, "Nome deve ter ao menos 3 caracteres").max(120, "Máx. 120 caracteres"),
  descricao: z.string().trim().max(2000, "Máx. 2000 caracteres").optional().or(z.literal("")),
});

const step2Schema = z
  .object({
    data_evento: z.string().min(1, "Informe a data do evento"),
    data_inicio_votacao: z.string().min(1, "Informe o início da votação"),
    data_fim_votacao: z.string().min(1, "Informe o fim da votação"),
    status: z.enum(["aberto", "em_votacao", "encerrado"]),
  })
  .refine((d) => new Date(d.data_inicio_votacao) < new Date(d.data_fim_votacao), {
    message: "O fim da votação deve ser após o início",
    path: ["data_fim_votacao"],
  })
  .refine((d) => new Date(d.data_fim_votacao) <= new Date(d.data_evento), {
    message: "A votação deve encerrar até a data do evento",
    path: ["data_fim_votacao"],
  });

const STEPS = [
  { id: 1, label: "Dados", icon: Info },
  { id: 2, label: "Datas", icon: Calendar },
  { id: 3, label: "Revisão", icon: Eye },
];

const fmtLocal = (d: string | null | undefined) =>
  d ? new Date(d).toISOString().slice(0, 16) : "";

const fmtBR = (d: string) =>
  d ? new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export function EventoWizard({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<EventoFormData> & { data_evento?: string | null; data_inicio_votacao?: string | null; data_fim_votacao?: string | null };
  onSubmit: (data: EventoFormData) => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState<EventoFormData>({
    nome: initial?.nome ?? "",
    descricao: initial?.descricao ?? "",
    data_evento: fmtLocal(initial?.data_evento ?? ""),
    data_inicio_votacao: fmtLocal(initial?.data_inicio_votacao ?? ""),
    data_fim_votacao: fmtLocal(initial?.data_fim_votacao ?? ""),
    status: (initial?.status as EventoFormData["status"]) ?? "aberto",
    banner_url: initial?.banner_url ?? "",
  });

  async function handleBannerFile(file: File | null) {
    if (!file) return;
    if (!ALLOWED_BANNER_TYPES.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_BANNER_BYTES) {
      toast.error("Imagem maior que 5MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("event-banners")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("event-banners").getPublicUrl(path);
      update("banner_url", data.publicUrl);
      toast.success("Banner enviado!");
    } catch (err: any) {
      toast.error(err.message ?? "Falha no upload do banner.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }


  const update = <K extends keyof EventoFormData>(k: K, v: EventoFormData[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => {
      const { [k as string]: _, ...rest } = prev;
      return rest;
    });
  };

  function validate(targetStep: number): boolean {
    const schema = targetStep === 1 ? step1Schema : step2Schema;
    const res = schema.safeParse(f);
    if (res.success) {
      setErrors({});
      return true;
    }
    const map: Record<string, string> = {};
    res.error.issues.forEach((i) => {
      const key = i.path[0]?.toString() ?? "_";
      if (!map[key]) map[key] = i.message;
    });
    setErrors(map);
    return false;
  }

  const canNext = useMemo(() => {
    if (step === 1) return f.nome.trim().length >= 3;
    if (step === 2)
      return !!f.data_evento && !!f.data_inicio_votacao && !!f.data_fim_votacao;
    return true;
  }, [step, f]);

  function next() {
    if (validate(step)) setStep((s) => Math.min(3, s + 1));
  }
  function prev() {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    if (!validate(1) || !validate(2)) {
      setStep(!step1Schema.safeParse(f).success ? 1 : 2);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(f);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <ol className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  done
                    ? "border-gold bg-gold text-background"
                    : active
                      ? "border-fire bg-fire text-fire-foreground"
                      : "border-border bg-card text-muted-foreground"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <span
                className={`hidden text-xs sm:inline ${active ? "text-foreground" : "text-muted-foreground"}`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 ${done ? "bg-gold" : "bg-border"}`} />
              )}
            </li>
          );
        })}
      </ol>

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">
              Nome do evento <span className="text-fire">*</span>
            </Label>
            <Input
              id="nome"
              value={f.nome}
              maxLength={120}
              onChange={(e) => update("nome", e.target.value)}
              placeholder="Ex: Festival União das Bandas 2026"
              aria-invalid={!!errors.nome}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-destructive">{errors.nome ?? " "}</span>
              <span className="text-muted-foreground">{f.nome.length}/120</span>
            </div>
          </div>
          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              rows={5}
              value={f.descricao}
              maxLength={2000}
              onChange={(e) => update("descricao", e.target.value)}
              placeholder="Conte aos fãs sobre o evento, regras de votação, premiação..."
              aria-invalid={!!errors.descricao}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-destructive">{errors.descricao ?? " "}</span>
              <span className="text-muted-foreground">{f.descricao.length}/2000</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="data_evento">
              Data do evento <span className="text-fire">*</span>
            </Label>
            <Input
              id="data_evento"
              type="datetime-local"
              value={f.data_evento}
              onChange={(e) => update("data_evento", e.target.value)}
              aria-invalid={!!errors.data_evento}
            />
            <p className="mt-1 text-xs text-destructive">{errors.data_evento ?? " "}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ini">
                Início da votação <span className="text-fire">*</span>
              </Label>
              <Input
                id="ini"
                type="datetime-local"
                value={f.data_inicio_votacao}
                onChange={(e) => update("data_inicio_votacao", e.target.value)}
                aria-invalid={!!errors.data_inicio_votacao}
              />
              <p className="mt-1 text-xs text-destructive">{errors.data_inicio_votacao ?? " "}</p>
            </div>
            <div>
              <Label htmlFor="fim">
                Fim da votação <span className="text-fire">*</span>
              </Label>
              <Input
                id="fim"
                type="datetime-local"
                value={f.data_fim_votacao}
                onChange={(e) => update("data_fim_votacao", e.target.value)}
                aria-invalid={!!errors.data_fim_votacao}
              />
              <p className="mt-1 text-xs text-destructive">{errors.data_fim_votacao ?? " "}</p>
            </div>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={f.status}
              onChange={(e) => update("status", e.target.value as EventoFormData["status"])}
            >
              <option value="aberto">Aberto (em breve)</option>
              <option value="em_votacao">Em votação</option>
              <option value="encerrado">Encerrado</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 3 — Preview */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Pré-visualização do evento
            </p>
            <h3 className="display mt-2 text-2xl">{f.nome || "Sem nome"}</h3>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {f.descricao || "Sem descrição."}
            </p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Data do evento</dt>
                <dd className="font-medium">{fmtBR(f.data_evento)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Status</dt>
                <dd className="font-medium">{f.status}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Início da votação</dt>
                <dd className="font-medium">{fmtBR(f.data_inicio_votacao)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted-foreground">Fim da votação</dt>
                <dd className="font-medium">{fmtBR(f.data_fim_votacao)}</dd>
              </div>
            </dl>
          </div>
          <p className="text-xs text-muted-foreground">
            Confira os dados antes de salvar. Você poderá editar depois pelo painel.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-4">
        <div>
          {step > 1 && (
            <Button type="button" variant="outline" onClick={prev} disabled={submitting}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" className="bg-fire" onClick={next} disabled={!canNext}>
              Próximo <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" className="bg-fire" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar evento"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
