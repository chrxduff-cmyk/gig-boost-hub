import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Props = {
  label?: string;
  bucket: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
};

export function ImageUploadField({ label = "Logo", bucket, value, onChange, folder = "" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 5MB."); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${folder ? folder + "/" : ""}${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Imagem enviada.");
    } catch (e: any) {
      toast.error("Falha ao enviar: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      <div className="mt-1 flex items-center gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">Sem imagem</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {value ? "Trocar" : "Enviar imagem"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <X className="mr-1 h-3.5 w-3.5" /> Remover
            </Button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">PNG, JPG ou WebP até 5MB.</p>
    </div>
  );
}
