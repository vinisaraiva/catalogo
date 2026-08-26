"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database";
import { deleteStoreHeroImage, uploadStoreHeroImages } from "@/lib/actions/store-hero-images";

type StoreHeroImageRow = Database["public"]["Tables"]["store_hero_images"]["Row"];

/**
 * DECISIONS.md ADR-035 — lets the seller manage the Home hero's background
 * photos from Configurações instead of a developer replacing static files
 * under `public/hero/`. Deliberately simpler than `ProductImagesManager`:
 * no "set primary"/reorder, since the storefront Home picks one of these
 * at random per page load (order doesn't change what's shown, just the
 * order this list renders in) — CLAUDE.md "avoid unnecessary
 * abstractions".
 */
export function StoreHeroImagesManager({
  initialImages,
}: {
  initialImages: StoreHeroImageRow[];
}) {
  const router = useRouter();
  const [images, setImages] = useState(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    // See DECISIONS.md's product-images-manager fix: `requireStoreMembership()`
    // inside the action can throw (not just return `{ ok: false }`) — this
    // try/catch/finally is what keeps that from leaving the button stuck
    // on "Enviando..." with no feedback at all.
    try {
      const formData = new FormData();
      for (const file of Array.from(files)) formData.append("files", file);

      const result = await uploadStoreHeroImages(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setImages((prev) => [...prev, ...result.data]);
      router.refresh();
    } catch {
      setError("Não foi possível enviar a foto. Verifique sua conexão e tente novamente.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(imageId: string) {
    setPendingId(imageId);
    setError(null);
    try {
      const result = await deleteStoreHeroImage(imageId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setImages((prev) => prev.filter((image) => image.id !== imageId));
      router.refresh();
    } catch {
      setError("Não foi possível remover a foto. Tente novamente.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">
        Fotos de fundo do banner na página inicial do catálogo. A cada visita, uma delas é
        escolhida aleatoriamente.
      </p>

      {images.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma foto cadastrada ainda.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((image) => (
            <li key={image.id} className="group relative aspect-video overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail; not worth next/image's overhead here. */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
              <Button
                type="button"
                size="icon"
                variant="destructive"
                disabled={pendingId === image.id}
                aria-label="Remover foto"
                className="absolute top-1 right-1 size-7"
                onClick={() => handleDelete(image.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImagePlus /> {isUploading ? "Enviando..." : "Adicionar fotos"}
      </Button>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
