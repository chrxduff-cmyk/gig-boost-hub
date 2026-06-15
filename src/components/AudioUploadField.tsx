import { useRef, useState } from "react";
import { Upload, X, Loader2, Music2 } from "lucide-react";
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

export function AudioUploadField({ label = "Faixa MP3", bucket, value, onChange, folder = "" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("audio/")) { toast.error("Selecione um arquivo de áudio."); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error("Áudio deve ter no máximo 15MB."); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
      const path = `${folder ? folder + "/" : ""}${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });
      if (error) throw error;
      const { data, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signErr || !data?.signedUrl) throw signErr ?? new Error("Falha ao gerar URL");
      onChange(data.signedUrl);
      toast.success("Áudio enviado.");
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
        accept="audio/mpeg,audio/mp3,audio/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => ref.current?.click()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {value ? "Trocar faixa" : "Enviar MP3"}
        </Button>
        {value && (
          <>
            <Music2 className="h-4 w-4 text-gold" />
            <audio src={value} controls className="h-8 max-w-full" />
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              <X className="mr-1 h-3.5 w-3.5" /> Remover
            </Button>
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">MP3 até 15MB. Será reproduzido ao passar o mouse sobre a miniatura.</p>
    </div>
  );
}
