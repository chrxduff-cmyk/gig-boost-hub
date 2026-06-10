import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar — União das Bandas" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Flame className="mx-auto h-10 w-10 text-primary" />
        <h1 className="display mt-3 text-3xl">União das Bandas</h1>
        <p className="text-sm text-muted-foreground">Entre ou cadastre-se para continuar</p>
      </div>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Entrar</TabsTrigger>
          <TabsTrigger value="signup">Criar conta</TabsTrigger>
        </TabsList>
        <TabsContent value="login"><LoginForm /></TabsContent>
        <TabsContent value="signup"><SignupForm /></TabsContent>
      </Tabs>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/" });
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <Label>E-mail</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label>Senha</Label>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full bg-fire" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

function SignupForm() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [cidade, setCidade] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termos, setTermos] = useState(false);
  const [lgpd, setLgpd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!termos || !lgpd) { toast.error("Você precisa aceitar os termos para continuar."); return; }
    if (password.length < 6) { toast.error("Senha deve ter no mínimo 6 caracteres."); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { nome, cidade },
      },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conta criada! Você já pode entrar.");
    navigate({ to: "/" });
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <Label>Nome completo</Label>
        <Input required value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} />
      </div>
      <div>
        <Label>Cidade</Label>
        <Input value={cidade} onChange={(e) => setCidade(e.target.value)} maxLength={80} />
      </div>
      <div>
        <Label>E-mail</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label>Senha</Label>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
      </div>

      <div className="space-y-2 rounded-md border border-border bg-card/50 p-3 text-sm">
        <label className="flex items-start gap-2">
          <Checkbox checked={termos} onCheckedChange={(v) => setTermos(v === true)} className="mt-0.5" />
          <span className="text-muted-foreground">
            Li e aceito os <Link to="/termos" className="text-gold underline">Termos de Uso</Link>.
          </span>
        </label>
        <label className="flex items-start gap-2">
          <Checkbox checked={lgpd} onCheckedChange={(v) => setLgpd(v === true)} className="mt-0.5" />
          <span className="text-muted-foreground">
            Autorizo o tratamento dos meus dados conforme a <Link to="/privacidade" className="text-gold underline">Política de Privacidade</Link>.
          </span>
        </label>
      </div>

      <Button type="submit" className="w-full bg-fire" disabled={loading || !termos || !lgpd}>
        {loading ? "Criando..." : "Criar conta"}
      </Button>
    </form>
  );
}
