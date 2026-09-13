import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { RumoLogo } from "@/components/brand/RumoLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { configured, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    if (isLogin) {
      const result = await signIn(email, password);
      setBusy(false);
      if (result.error) return setMessage(result.error);
      void navigate({ to: "/today" });
      return;
    }
    const result = await signUp(email, password);
    setBusy(false);
    if (result.error) return setMessage(result.error);
    if (!isLogin && result.needsConfirmation)
      return setMessage("Conta criada. Verifique seu e-mail para confirmar o acesso.");
    void navigate({ to: "/today" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <Link to="/">
            <RumoLogo className="mx-auto" />
          </Link>
          <CardTitle>{isLogin ? "Entrar no RUMO" : "Criar sua conta"}</CardTitle>
        </CardHeader>
        <CardContent>
          {!configured && (
            <p
              role="alert"
              className="mb-4 rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground"
            >
              Autenticação indisponível: configure o Supabase neste ambiente para continuar.
            </p>
          )}
          <form className="space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={6}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {message && (
              <p role="status" className="text-sm text-muted-foreground">
                {message}
              </p>
            )}
            <Button className="w-full" type="submit" disabled={!configured || busy}>
              {busy ? "Aguarde…" : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isLogin ? "Ainda não tem conta? " : "Já tem conta? "}
            <Link
              className="font-medium text-foreground underline"
              to={isLogin ? "/signup" : "/login"}
            >
              {isLogin ? "Criar conta" : "Entrar"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
