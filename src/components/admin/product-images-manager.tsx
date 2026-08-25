"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronDown, ChevronUp, ImagePlus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/types/database";
import { deleteProductImage, reorderProductImages, uploadProductImages } from "@/lib/actions/product-images";

type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];

const IMAGE_TYPE_LABEL: Record<string, string> = {
  original: "Foto",
  detail: "Detalhe",
  generated: "Gerada por IA",
  social_feed: "Feed",
  social_story: "Story",
};

/**
 * PRD §7 "Product Image" / §15 Etapa 3 ("Tirar foto" / "Galeria") /
 * TASKS.md Phase 5. Lives on the product edit screen (not the creation
 * wizard) for the same reason `ProductSizesManager` does —
 * `product_images.product_id` needs an existing product to attach to.
 *
 * "Select primary image" and "Reorder images" share one action
 * (`reorderProductImages`): the first item in `images` (index 0) is
 * always the primary/cover image, so "set as primary" is just "move to
 * the front" — see DECISIONS.md ADR-027.
 */
export function ProductImagesManager({
  productId,
  initialImages,
}: {
  productId: string;
  initialImages: ProductImageRow[];
}) {
  const router = useRouter();
  const [images, setImages] = useState(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function handleFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = ""; // allow selecting the same file again later
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    for (const file of Array.from(files)) formData.append("files", file);
    formData.append("image_type", "original");

    const result = await uploadProductImages(productId, formData);
    setIsUploading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setImages((prev) => [...prev, ...result.data]);
  }

  async function handleDelete(imageId: string) {
    setPendingId(imageId);
    setError(null);
    const result = await deleteProductImage(imageId, productId);
    setPendingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setImages((prev) => prev.filter((image) => image.id !== imageId));
  }

  async function persistOrder(nextOrder: ProductImageRow[]) {
    setImages(nextOrder);
    const result = await reorderProductImages(
      productId,
      nextOrder.map((image) => image.id),
    );
    if (!result.ok) {
      setError(result.error);
      router.refresh();
    }
  }

  function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const next = [...images];
    const a = next[index];
    const b = next[targetIndex];
    if (!a || !b) return;
    next[index] = b;
    next[targetIndex] = a;
    void persistOrder(next);
  }

  function handleSetPrimary(index: number) {
    if (index === 0) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.unshift(item);
    void persistOrder(next);
  }

  return (
    <div className="space-y-3">
      {images.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma foto cadastrada ainda.</p>
      ) : (
        <ul className="space-y-2">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="border-border flex items-center gap-3 rounded-md border p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail list; not worth next/image's overhead here. */}
              <img src={image.url} alt="" className="h-14 w-14 shrink-0 rounded object-cover" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {index === 0 ? <Badge variant="success">Principal</Badge> : null}
                  <span className="text-muted-foreground text-xs">
                    {IMAGE_TYPE_LABEL[image.image_type] ?? image.image_type}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {index !== 0 ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Definir como principal"
                    onClick={() => handleSetPrimary(index)}
                  >
                    <Star />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={index === 0}
                  aria-label="Mover para cima"
                  onClick={() => handleMove(index, -1)}
                >
                  <ChevronUp />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={index === images.length - 1}
                  aria-label="Mover para baixo"
                  onClick={() => handleMove(index, 1)}
                >
                  <ChevronDown />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={pendingId === image.id}
                  aria-label="Remover foto"
                  onClick={() => handleDelete(image.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFilesSelected}
        />
        <input
          ref={galleryInputRef}
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
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera /> Tirar foto
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => galleryInputRef.current?.click()}
        >
          <ImagePlus /> Galeria
        </Button>
        {isUploading ? <span className="text-muted-foreground text-sm">Enviando...</span> : null}
      </div>

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
