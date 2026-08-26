"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStoreProfile, uploadStoreLogo } from "@/lib/actions/store";

/**
 * PRD.md §7 "Store" / §14 "Painel administrativo". The one place an admin
 * sets up the storefront's identity: name, logo, WhatsApp number and
 * Instagram — see DECISIONS.md ADR-029 for why this page didn't exist
 * before Phase 6 despite the storefront already depending on these
 * fields.
 */
export function StoreProfileForm({
  initialName,
  initialWhatsapp,
  initialInstagram,
  initialLogoUrl,
}: {
  initialName: string;
  initialWhatsapp: string | null;
  initialInstagram: string | null;
  initialLogoUrl: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp ?? "");
  const [instagram, setInstagram] = useState(initialInstagram ?? "");
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    const result = await updateStoreProfile({
      name,
      whatsapp_number: whatsapp,
      instagram_url: instagram,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  async function handleLogoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsUploadingLogo(true);
    setError(null);

    // Same fix as product-images-manager.tsx / store-hero-images-manager.tsx:
    // `requireStoreMembership()` inside the action can throw (not just
    // return `{ ok: false }`) on an expired session or a failed membership
    // lookup. Without this try/catch/finally, that left the button stuck on
    // "Enviando..." forever with zero feedback — no error, no retorno.
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadStoreLogo(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setLogoUrl(result.data.logo_url);
      router.refresh();
    } catch {
      setError("Não foi possível enviar a logo. Verifique sua conexão e tente novamente.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Logo da loja</Label>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- small admin preview; same pattern as product-images-manager.tsx.
            <img src={logoUrl} alt="" className="h-16 w-16 rounded object-contain" />
          ) : (
            <div className="bg-muted text-muted-foreground flex h-16 w-16 items-center justify-center rounded text-xs">
              Sem logo
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoSelected}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploadingLogo}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus /> {isUploadingLogo ? "Enviando..." : "Trocar logo"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="store-name">Nome da loja</Label>
          <Input id="store-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="store-whatsapp">WhatsApp (com DDD)</Label>
          <Input
            id="store-whatsapp"
            placeholder="(11) 91234-5678"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            Usado nos botões de WhatsApp do catálogo público. Sem esse número, os botões não
            aparecem.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="store-instagram">Instagram (link)</Label>
          <Input
            id="store-instagram"
            placeholder="https://instagram.com/sualoja"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
        </div>

        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        {success ? <p className="text-sm text-emerald-600">Dados da loja atualizados.</p> : null}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Salvando..." : "Salvar dados da loja"}
        </Button>
      </form>
    </div>
  );
}
