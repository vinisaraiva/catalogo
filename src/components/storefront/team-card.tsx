import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { TeamRow } from "@/lib/queries/teams";

export function TeamCard({ team }: { team: Pick<TeamRow, "slug" | "name" | "logo_url"> }) {
  return (
    <Link href={`/time/${team.slug}`} className="shrink-0">
      <Card className="w-28">
        <CardContent className="flex flex-col items-center gap-2 p-3 text-center">
          {team.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered URL, not a known image host
            <img src={team.logo_url} alt="" loading="lazy" className="h-12 w-12 object-contain" />
          ) : (
            <div className="bg-muted h-12 w-12 rounded-full" aria-hidden="true" />
          )}
          <span className="line-clamp-2 text-xs font-medium">{team.name}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
