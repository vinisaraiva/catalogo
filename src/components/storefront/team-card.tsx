import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { TeamRow } from "@/lib/queries/teams";

export function TeamCard({ team }: { team: Pick<TeamRow, "slug" | "name" | "logo_url"> }) {
  return (
    <Link href={`/time/${team.slug}`} className="group shrink-0">
      <Card className="w-32 rounded-xl border-border/60 transition-all duration-200 group-hover:shadow-md group-hover:shadow-black/5 group-hover:-translate-y-0.5 group-hover:border-accent/30">
        <CardContent className="flex flex-col items-center gap-2.5 p-4 text-center">
          {team.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered URL, not a known image host
            <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full p-1 transition-transform duration-200 group-hover:scale-110">
              <img src={team.logo_url} alt="" loading="lazy" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
          )}
          <span className="line-clamp-2 text-xs font-semibold leading-tight">{team.name}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
