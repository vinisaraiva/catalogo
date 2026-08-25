import { requireStoreMembership } from "@/lib/auth/require-store-membership";
import { getDailyAiUsage } from "@/lib/queries/ai-usage";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import { StoreProfileForm } from "@/components/admin/store-profile-form";
import { Separator } from "@/components/ui/separator";

export default async function StoreSettingsPage() {
  const { store } = await requireStoreMembership();
  const usage = await getDailyAiUsage(store.id);

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
        <h2 className="text-sm font-semibold">Inteligência artificial</h2>
        <StoreSettingsForm initialLimit={usage.limit} usedToday={usage.usedToday} />
      </div>
    </div>
  );
}
