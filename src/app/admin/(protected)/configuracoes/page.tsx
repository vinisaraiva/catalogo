import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { getDailyAiUsage } from "@/lib/queries/ai-usage";
import { listStoreHeroImages } from "@/lib/queries/store-hero-images";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { StoreProfileForm } from "@/components/admin/store-profile-form";
import { StoreHeroImagesManager } from "@/components/admin/store-hero-images-manager";
import { Separator } from "@/components/ui/separator";

export default async function StoreSettingsPage() {
  const { store } = await requireStoreMembership();
  const [usage, heroImages] = await Promise.all([
    getDailyAiUsage(store.id),
    listStoreHeroImages(store.id),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Configurações</h1>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Minha loja</h2>
        <StoreProfileForm
          initialName={store.name}
          initialWhatsapp={store.whatsapp_number}
          initialInstagram={store.instagram_url}
          initialLogoUrl={store.logo_url}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Banner da página inicial</h2>
        <StoreHeroImagesManager initialImages={heroImages} />
      </div>

      <Separator />

      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Inteligência artificial</h2>
        <StoreSettingsForm initialLimit={usage.limit} usedToday={usage.usedToday} />
      </div>
    </div>
  );
}
