"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDailyAiGenerationLimit } from "@/lib/actions/store-settings";

/**
 * TASKS.md Phase 6 "Daily quota": "Add store daily limit setting" +
 * "Show usage in admin" (PRD.md §11: "7 de 10 gerações utilizadas hoje").
 */
export function StoreSettingsForm({
  initialLimit,
  usedToday,
}: {
  initialLimit: number;
  usedToday: number;
}) {
  const router = useRouter();
  const [limit, setLimit] = useState(initialLimit);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const result = await updateDailyAiGenerationLimit({ daily_ai_generation_limit: limit });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm">
        <strong>
          {usedToday} de {initialLimit}
        </strong>{" "}
        gerações de IA utilizadas hoje.
      </p>

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="daily_ai_generation_limit">Limite diário de gerações de IA</Label>
          <Input
            id="daily_ai_generation_limit"
            type="number"
            min={0}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      {success ? <p className="text-sm text-emerald-600">Limite atualizado.</p> : null}
    </div>
  );
}
