import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { authErrorMessage } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = Boolean(
    import.meta.env["VITE_SUPABASE_URL"] && import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"],
  );
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [configured]);

  const value = {
    user: session?.user ?? null,
    loading,
    configured,
    async signIn(email: string, password: string) {
      if (!supabase) return { error: "Supabase Auth não está configurado neste ambiente." };
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? authErrorMessage("login") : null };
    },
    async signUp(email: string, password: string) {
      if (!supabase)
        return {
          error: "Supabase Auth não está configurado neste ambiente.",
          needsConfirmation: false,
        };
      const { data, error } = await supabase.auth.signUp({ email, password });
      return {
        error: error ? authErrorMessage("signup") : null,
        needsConfirmation: Boolean(!error && !data.session),
      };
    },
    async signOut() {
      if (!supabase) return { error: authErrorMessage("logout") };
      const { error } = await supabase.auth.signOut();
      return { error: error ? authErrorMessage("logout") : null };
    },
  } satisfies NonNullable<React.ComponentProps<typeof AuthContext.Provider>["value"]>;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
