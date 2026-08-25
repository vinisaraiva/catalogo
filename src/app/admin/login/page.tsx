"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Admin login (PRD §4.1 / TASKS.md Phase 1 Auth).
 *
 * Customers never see this — the public storefront requires no login
 * (ADR-003). This page is the only authenticated entry point in the MVP.
 *
 * useSearchParams() opts the subtree into client-side rendering, which
 * Next.js requires to be wrapped in Suspense during static prerendering —
 * hence the small wrapper below.
 */
export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    const redirectTo = searchParams.get("redirectTo") ?? "/admin";
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="border-border w-full max-w-sm space-y-4 rounded-lg border p-6"
      >
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">Entrar</h1>
          <p className="text-muted-foreground text-sm">Painel administrativo do catálogo</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-input h-11 w-full rounded-md border bg-transparent px-3 text-base"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-input h-11 w-full rounded-md border bg-transparent px-3 text-base"
          />
        </div>

        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary text-primary-foreground h-11 w-full rounded-md text-base font-medium disabled:opacity-60"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
